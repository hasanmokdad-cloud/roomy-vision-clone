/**
 * Roomy AI Chat Edge Function
 * 
 * Handles streaming chat interactions with Lovable AI gateway for the Roomy housing assistant.
 * Provides personalized dorm recommendations based on student preferences and conversation history.
 * 
 * Required Environment Variables:
 * - SUPABASE_URL: Your Supabase project URL (auto-configured)
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key for backend operations (auto-configured)
 * - LOVABLE_API_KEY: API key for Lovable AI gateway (auto-provisioned by Lovable)
 * 
 * Deployment Note:
 * All required secrets are automatically configured in Lovable Cloud.
 * This function is automatically deployed when you make changes to the codebase.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { generateSmartFollowups, findSimilarAvailableDorms } from "./smartFollowups.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod validation schemas
const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(500)
});

const chatRequestSchema = z.object({
  message: z.string().min(1).max(500),
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional()
});

// Rate limiting (in-memory, resets on cold start)
const rateLimit = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const data = rateLimit.get(identifier) || { count: 0, lastReset: now };
  
  // Reset counter if window has passed
  if (now - data.lastReset > RATE_WINDOW_MS) {
    data.count = 0;
    data.lastReset = now;
  }
  
  data.count++;
  rateLimit.set(identifier, data);
  
  return data.count <= RATE_LIMIT;
}

// Helper function to detect keywords and extract filters
async function extractFilters(message: string, context: any = {}, studentPrefs: any = {}) {
  // Defensive null check - JavaScript default params don't replace null, only undefined
  const prefs = studentPrefs || {};
  const ctx = context || {}; // Also handle null context
  const query = message.toLowerCase();
  const filters: any = { ...ctx };
  const learnedPrefs: any = {};

  // Budget detection
  const budgetMatch = query.match(/\$?(\d{2,4})/);
  if (budgetMatch) {
    filters.budget = parseInt(budgetMatch[1]);
  } else if (query.includes("cheaper") || query.includes("lower")) {
    // Reduce budget by 20% if asking for cheaper
    if (context.budget) filters.budget = Math.floor(context.budget * 0.8);
  } else if (prefs.budget && !filters.budget) {
    // Use stored budget preference
    filters.budget = prefs.budget;
  }

  // University detection
  const universities = ["lau", "aub", "usek", "usj", "balamand", "bau", "lu", "haigazian"];
  const uniMatch = universities.find(u => query.includes(u));
  if (uniMatch) {
    filters.university = uniMatch.toUpperCase();
  } else if (prefs.preferred_university && !filters.university) {
    filters.university = prefs.preferred_university;
  }

  // SMART DORM NAME DETECTION: Query actual dorm names from database and match against user query
  // This allows us to detect dorm names even without explicit keywords like "about" or "at"
  const detectedDormName = await detectDormNameInQuery(query);
  if (detectedDormName) {
    filters.dormName = detectedDormName;
  }
  
  // Fallback patterns if DB detection didn't work
  if (!filters.dormName) {
    // Pattern 1: "about/at/in [dorm name]" - capture until end of string or "dorm" keyword
    const dormNamePattern1 = /(?:about|at|in|called|named|for|find)\s+["']?(.+?)["']?\s*(?:dorm)?$/i;
    const dormMatch1 = query.match(dormNamePattern1);
    if (dormMatch1) {
      const potentialName = dormMatch1[1].trim();
      // Only use if it's not a generic word
      if (potentialName.length > 2 && !["the", "my", "our", "this", "that", "a", "an"].includes(potentialName.toLowerCase())) {
        filters.dormName = potentialName;
      }
    }
    
    // Pattern 2: Direct dorm name mention (e.g., "Test Dorm")
    if (!filters.dormName) {
      const dormNamePattern2 = /["']?([A-Za-z][\w\s]+?)\s*dorm["']?/i;
      const dormMatch2 = query.match(dormNamePattern2);
      if (dormMatch2) {
        filters.dormName = dormMatch2[1].trim();
      }
    }
  }

  // Area detection
  const areas = ["hamra", "jbeil", "byblos", "verdun", "raoucheh", "hazmieh", "badaro", "dekowaneh", "manara", "blat", "fidar"];
  const areaMatch = areas.find(a => query.includes(a));
  if (areaMatch) {
    filters.area = areaMatch;
    learnedPrefs.area = areaMatch;
  }

  // Room type detection
  const roomTypes = ["shared", "single", "private", "studio", "apartment"];
  const roomMatch = roomTypes.find(r => query.includes(r));
  if (roomMatch) {
    filters.roomType = roomMatch;
    learnedPrefs.roomType = roomMatch;
  }

  // Detect amenity queries
  if (query.includes("parking") || query.includes("garage")) {
    filters.amenity = "parking";
    learnedPrefs.amenity = "parking";
  }
  if (query.includes("wifi") || query.includes("internet")) {
    filters.amenity = "wifi";
    learnedPrefs.amenity = "wifi";
  }
  if (query.includes("gym") || query.includes("fitness")) {
    filters.amenity = "gym";
    learnedPrefs.amenity = "gym";
  }
  if (query.includes("laundry")) {
    filters.amenity = "laundry";
    learnedPrefs.amenity = "laundry";
  }
  
  // Detect general amenity/services queries
  if (query.includes("services") || query.includes("what services") || query.includes("amenities offered")) {
    filters.askingAboutAmenities = true;
  }

  return { filters, learnedPrefs };
}

/**
 * Smart dorm name detection: Query actual dorm names from DB and check if any are mentioned in the query
 * This allows detection like "tell me about Test Dorm" or "what's the price of Test Dorm?"
 */
async function detectDormNameInQuery(query: string): Promise<string | null> {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Query all verified dorm names
    const { data: allDorms } = await supabase
      .from('dorms')
      .select('dorm_name, name')
      .eq('verification_status', 'Verified');
    
    if (!allDorms || allDorms.length === 0) return null;
    
    const queryLower = query.toLowerCase();
    
    // Check if any dorm name (or name fallback) is mentioned in the query
    for (const dorm of allDorms) {
      const dormName = (dorm.dorm_name || dorm.name || '').toLowerCase();
      if (dormName && queryLower.includes(dormName)) {
        return dorm.dorm_name || dorm.name;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[detectDormNameInQuery] Error:', error);
    return null;
  }
}

// Input sanitization helper
function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML and script tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove SQL keywords (case insensitive)
  const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b/gi;
  sanitized = sanitized.replace(sqlKeywords, '');
  
  // Trim and limit length
  sanitized = sanitized.trim().substring(0, 500);
  
  // Escape special characters
  sanitized = sanitized
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
  
  return sanitized;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStartTime = Date.now();
  console.log('[roomy-chat] Request received');
  try {
    // Parse and validate request body
    const rawBody = await req.json();
    const validationResult = chatRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validationResult.error.issues 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { message: rawMessage, userId, sessionId } = validationResult.data;
    const message = sanitizeInput(rawMessage);

    // Rate limiting check
    const rateLimitKey = userId || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || 'anonymous';
    if (!checkRateLimit(rateLimitKey)) {
      // Log rate limit event to security_events
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseForLog = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabaseForLog.from("security_events").insert({
          event_type: "rate_limit_exceeded",
          user_id: userId || null,
          ip_region: req.headers.get('cf-ipcountry') || null,
          user_agent: req.headers.get('user-agent')?.slice(0, 200) || null,
          details: { endpoint: "roomy-chat", rate_limit_key: rateLimitKey.slice(0, 20) },
          severity: "warning"
        });
      }
      
      return new Response(
        JSON.stringify({ error: "Too many requests. Please slow down and try again in a minute." }),
        { 
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Validate message after sanitization
    if (!message || message.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message cannot be empty" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (message.length > 500) {
      return new Response(
        JSON.stringify({ error: "Message too long. Please keep it under 500 characters." }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Validate environment variables
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[roomy-chat] Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "AI backend is not properly configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate session ID for guest users
    const effectiveUserId = userId || `guest_${Date.now()}`;
    const effectiveSessionId = sessionId || effectiveUserId;

    // Load student profile and preferences if user is logged in
    let studentProfile: any = null;
    let studentId: string | null = null;
    let userPreferences: any = null;
    let chatContext: any = null;
    
    if (userId && userId.startsWith('guest_') === false) {
      // COMPREHENSIVE PROFILE READING: Load ALL relevant student fields for intelligent responses
      const { data: student } = await supabase
        .from("students")
        .select(`
          id, full_name, gender, age, university, major, year_of_study,
          budget, accommodation_status, needs_dorm, needs_roommate_new_dorm, needs_roommate_current_place,
          current_dorm_id, current_room_id,
          preferred_university, preferred_housing_area, favorite_areas, 
          preferred_room_types, preferred_amenities,
          ai_confidence_score, ai_match_plan,
          personality_test_completed, enable_personality_matching,
          personality_cleanliness_level, personality_sleep_schedule, personality_intro_extro,
          personality_smoking, personality_guests_frequency,
          habit_cleanliness, habit_noise, habit_social
        `)
        .eq("user_id", userId)
        .maybeSingle();
      
      studentProfile = student;
      studentId = student?.id;

      // Load user preferences from onboarding
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("preferences")
        .eq("user_id", userId)
        .maybeSingle();
      
      userPreferences = prefs?.preferences || null;

      // LOAD CHAT CONTEXT: Load conversation memory for personalized responses
      const { data: existingContext } = await supabase
        .from('chat_context')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!existingContext && student) {
        // Create new context with profile snapshot
        const newContext = {
          user_id: userId,
          context: {
            gender: student.gender,
            budget: student.budget,
            university: student.university,
            current_dorm_id: student.current_dorm_id,
            preferences: student.preferred_amenities,
            match_tier: student.ai_match_plan || 'basic'
          },
          last_messages: [],
          updated_at: new Date().toISOString()
        };
        await supabase.from('chat_context').insert(newContext);
        chatContext = newContext;
      } else {
        chatContext = existingContext;
      }
    }

    // Check for reset AI memory command
    if (message.toLowerCase().includes("reset my memory") || message.toLowerCase().includes("reset ai memory")) {
      if (studentId) {
        const { error: resetError } = await supabase.rpc("reset_student_ai_memory", {
          p_student_id: studentId
        });
        if (resetError) console.error("Error resetting AI memory:", resetError);
      }
      await supabase.from("chat_sessions").delete().eq("session_id", effectiveSessionId);
      return new Response(
        JSON.stringify({ 
          response: "✨ AI memory reset! I've forgotten all your preferences. Let's start fresh — tell me what you're looking for!",
          sessionReset: true,
          memoryReset: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ROOM CAPACITY QUERY DETECTION: Handle questions about specific room availability with real-time data
    const roomCapacityRegex = /(?:space|available|spots?|beds?|capacity|full|room)\s+(?:in|at|for)?\s*(?:room\s*)?([A-Za-z0-9]+)/i;
    const roomCapacityMatch = message.toLowerCase().match(roomCapacityRegex);
    
    if (roomCapacityMatch && (message.toLowerCase().includes('space') || message.toLowerCase().includes('available') || message.toLowerCase().includes('full'))) {
      const roomIdentifier = roomCapacityMatch[1];
      
      // Enhanced room query with real-time availability
      const { data: rooms } = await supabase
        .from('rooms')
        .select('*, dorm:dorms(dorm_name, name, gender_preference, monthly_price)')
        .or(`name.ilike.%${roomIdentifier}%,room_number.ilike.%${roomIdentifier}%`)
        .limit(1);
      
      if (rooms && rooms.length > 0) {
        const room = rooms[0];
        const available = (room.capacity || 0) - (room.capacity_occupied || 0);
        const dormName = room.dorm?.dorm_name || room.dorm?.name || 'the dorm';
        
        // PROACTIVE GENDER/BUDGET WARNINGS
        let warningMessage = '';
        if (studentProfile?.gender && room.dorm?.gender_preference) {
          const studentGender = studentProfile.gender.toLowerCase();
          const dormGender = room.dorm.gender_preference.toLowerCase();
          
          if ((dormGender === 'female' && studentGender !== 'female') ||
              (dormGender === 'male' && studentGender !== 'male')) {
            warningMessage = `\n\n⚠️ **Gender Mismatch**: ${dormName} is ${dormGender}-only, but your profile indicates ${studentGender}. This dorm isn't available to you.`;
          }
        }

        if (studentProfile?.budget && room.dorm?.monthly_price && room.dorm.monthly_price > studentProfile.budget) {
          const overage = room.dorm.monthly_price - studentProfile.budget;
          warningMessage += `\n\n💰 **Budget Alert**: This dorm is $${overage}/month over your $${studentProfile.budget} budget.`;
        }
        
        let capacityResponse = '';
        if (available <= 0) {
          capacityResponse = `Room ${room.name} at ${dormName} is currently **FULL** (${room.capacity_occupied}/${room.capacity} beds occupied). 😔${warningMessage}\n\n`;
          
          // Suggest other rooms in the same dorm
          const { data: otherRooms } = await supabase
            .from('rooms')
            .select('name, capacity, capacity_occupied, available')
            .eq('dorm_id', room.dorm_id)
            .eq('available', true)
            .neq('id', room.id);
          
          const availableRooms = (otherRooms || []).filter((r: any) => (r.capacity_occupied || 0) < (r.capacity || 0));
          
          if (availableRooms.length > 0) {
            capacityResponse += `But good news! Other rooms at ${dormName} are available:\n`;
            availableRooms.slice(0, 3).forEach((r: any) => {
              const spots = r.capacity - (r.capacity_occupied || 0);
              capacityResponse += `• Room ${r.name}: ${spots} spot${spots === 1 ? '' : 's'} left (${r.capacity_occupied || 0}/${r.capacity})\n`;
            });
          } else {
            capacityResponse += `Unfortunately, all rooms at ${dormName} are currently full. Would you like me to suggest other available dorms?`;
          }
        } else {
          capacityResponse = `Great news! 🎉 Room ${room.name} at ${dormName} has **${available} spot${available === 1 ? '' : 's'} available** (${room.capacity_occupied || 0}/${room.capacity} beds occupied).${warningMessage}\n\nWould you like to know more about this dorm or see other options?`;
        }
        
        // Add follow-up action buttons based on warnings
        const followUpActions = [];
        if (warningMessage.includes('Gender Mismatch') && studentProfile?.gender) {
          followUpActions.push({ 
            label: `Show ${studentProfile.gender} dorms`, 
            query: `Find ${studentProfile.gender} dorms near my university` 
          });
        }
        if (warningMessage.includes('Budget Alert') && studentProfile?.budget) {
          followUpActions.push({ 
            label: 'Show cheaper options', 
            query: `Find dorms under $${studentProfile.budget}` 
          });
        }
        
        return new Response(
          JSON.stringify({ 
            response: capacityResponse,
            followUpActions: followUpActions.length > 0 ? followUpActions : undefined
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Check for personality/vibe-based queries from Basic tier users
    const personalityKeywords = ['vibe', 'personality', 'compatible', 'match my energy', 'similar to me', 'like me', 'good fit'];
    const isPersonalityQuery = personalityKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (isPersonalityQuery && studentProfile && studentProfile.ai_match_plan === 'basic') {
      return new Response(
        JSON.stringify({
          response: "🎯 For deeper personality-based roommate matching, you can unlock **Advanced Match** or **VIP Match**!\n\n✨ Advanced includes compatibility scores and personality insights\n🌟 VIP offers unlimited matches with priority support\n\nWould you like to learn more about upgrading your match experience?",
          followUpActions: [
            { label: "Tell me about Advanced", query: "What's included in Advanced Match?" },
            { label: "Show VIP features", query: "What does VIP Match offer?" }
          ]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for "what do you remember" query
    if (message.toLowerCase().includes("what do you remember") || message.toLowerCase().includes("what do you know about me")) {
      if (!studentProfile) {
        return new Response(
          JSON.stringify({ 
            response: "I don't have any stored preferences yet! I'm just getting to know you. 😊\n\nTell me what you're looking for and I'll remember it for next time!"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const memories: string[] = [];
      if (studentProfile.budget) memories.push(`💰 Budget: $${studentProfile.budget}/month`);
      if (studentProfile.preferred_university) memories.push(`🎓 University: ${studentProfile.preferred_university}`);
      if (studentProfile.favorite_areas?.length > 0) memories.push(`📍 Favorite areas: ${studentProfile.favorite_areas.join(", ")}`);
      if (studentProfile.preferred_room_types?.length > 0) memories.push(`🛏️ Room types: ${studentProfile.preferred_room_types.join(", ")}`);
      if (studentProfile.preferred_amenities?.length > 0) memories.push(`✨ Amenities: ${studentProfile.preferred_amenities.join(", ")}`);

      const confidenceEmoji = studentProfile.ai_confidence_score >= 80 ? "🎯" : studentProfile.ai_confidence_score >= 60 ? "📊" : "🌱";
      
      return new Response(
        JSON.stringify({ 
          response: `Here's what I remember about you:\n\n${memories.join("\n")}\n\n${confidenceEmoji} AI Confidence: ${studentProfile.ai_confidence_score}%\n\nThe more we chat, the better I understand your preferences!`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for reset chat command (session only, not AI memory)
    if (message.toLowerCase().includes("reset chat") || message.toLowerCase().includes("start over")) {
      await supabase.from("chat_sessions").delete().eq("session_id", effectiveSessionId);
      return new Response(
        JSON.stringify({ 
          response: "Chat reset! 🔄 Let's start fresh. How can I help you find your perfect dorm?",
          sessionReset: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load last 10 messages from ai_chat_sessions for conversation history
    const { data: recentMessages } = await supabase
      .from("ai_chat_sessions")
      .select("role, message")
      .eq("session_id", effectiveSessionId)
      .order("created_at", { ascending: false })
      .limit(10);
    
    const conversationHistory = (recentMessages || []).reverse();

    // Check if user is asking for roommates
    const isRoommateQuery = message.toLowerCase().includes("roommate") || 
                           message.toLowerCase().includes("room mate") ||
                           message.toLowerCase().includes("find me someone");
    
    // Load existing session or create new one
    let { data: session } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("session_id", effectiveSessionId)
      .maybeSingle();

    if (!session) {
      const { data: newSession } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: effectiveUserId,
          session_id: effectiveSessionId,
          history: [],
          context: {}
        })
        .select()
        .single();
      session = newSession;
    }

    const history = session?.history || [];
    const storedContext = session?.context || {};

    // Extract filters from message, merging with stored context and student preferences
    const { filters, learnedPrefs } = await extractFilters(message, storedContext, studentProfile || {});
    
    // Update student preferences based on learned preferences
    if (studentId && Object.keys(learnedPrefs).length > 0) {
      for (const [type, value] of Object.entries(learnedPrefs)) {
        const prefType = type === 'roomType' ? 'room_type' : type;
        const { error: prefError } = await supabase.rpc("update_student_preference", {
          p_student_id: studentId,
          p_preference_type: prefType,
          p_value: value as string
        });
        if (prefError) console.error("Error updating preference:", prefError);
      }
    }
    
    // Check current dorm capacity if student has one
    let currentDormContext = "";
    if (studentProfile?.current_dorm_id && studentProfile?.current_room_id) {
      const { data: currentRoom } = await supabase
        .from('rooms')
        .select('*, dorm:dorms(name)')
        .eq('id', studentProfile.current_room_id)
        .single();
      
      if (currentRoom) {
        const available = currentRoom.capacity - currentRoom.capacity_occupied;
        currentDormContext = `\n\nCurrent Dorm Status:\n- Student lives in ${currentRoom.dorm?.name} (Room ${currentRoom.name})\n- Room capacity: ${currentRoom.capacity_occupied}/${currentRoom.capacity} occupied\n- Available spots: ${available}\n`;
        if (available === 0) {
          currentDormContext += "- Room is FULL - suggest finding new dorm together if asking about roommates\n";
        }
      }
    }

    // Build conversation context from history (last 10 messages)
    const recentHistory = history.slice(-10);
    const conversationContext = recentHistory.length > 0
      ? "\n\nPrevious conversation:\n" + recentHistory.map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join("\n") + "\n"
      : "";

    // Build comprehensive student profile context
    let profileContext = "";
    if (studentProfile) {
      profileContext = `\n\n==== STUDENT PROFILE (Use for intelligent responses) ====\n`;
      
      // Basic info
      if (studentProfile.full_name) profileContext += `Name: ${studentProfile.full_name}\n`;
      if (studentProfile.gender) profileContext += `Gender: ${studentProfile.gender}\n`;
      if (studentProfile.age) profileContext += `Age: ${studentProfile.age}\n`;
      if (studentProfile.university) profileContext += `University: ${studentProfile.university}\n`;
      if (studentProfile.major) profileContext += `Major: ${studentProfile.major}\n`;
      
      // Accommodation status
      profileContext += `\nAccommodation Status:\n`;
      profileContext += `- Needs a dorm: ${studentProfile.needs_dorm ? 'YES' : 'NO'}\n`;
      profileContext += `- Has current dorm: ${studentProfile.current_dorm_id ? 'YES' : 'NO'}\n`;
      if (studentProfile.needs_roommate_current_place) profileContext += `- Seeking roommate for current place: YES\n`;
      if (studentProfile.needs_roommate_new_dorm) profileContext += `- Seeking roommate for new dorm: YES\n`;
      
      // Preferences
      if (studentProfile.budget) profileContext += `\nBudget: $${studentProfile.budget}/month (MONTHLY PRICE ONLY)\n`;
      if (studentProfile.preferred_university) profileContext += `Preferred University: ${studentProfile.preferred_university}\n`;
      if (studentProfile.favorite_areas?.length > 0) profileContext += `Favorite Areas: ${studentProfile.favorite_areas.join(", ")}\n`;
      if (studentProfile.preferred_room_types?.length > 0) profileContext += `Preferred Room Types: ${studentProfile.preferred_room_types.join(", ")}\n`;
      if (studentProfile.preferred_amenities?.length > 0) profileContext += `Preferred Amenities: ${studentProfile.preferred_amenities.join(", ")}\n`;
      
      // Match tier
      const tier = studentProfile.ai_match_plan || 'basic';
      profileContext += `\nMatch Tier: ${tier.toUpperCase()}\n`;
      profileContext += `Personality Test Completed: ${studentProfile.personality_test_completed ? 'YES' : 'NO'}\n`;
      
      if (studentProfile.personality_test_completed && tier !== 'basic') {
        profileContext += `\nPersonality Traits (use for Advanced/VIP tier only):\n`;
        if (studentProfile.personality_cleanliness_level) profileContext += `- Cleanliness: ${studentProfile.personality_cleanliness_level}\n`;
        if (studentProfile.personality_sleep_schedule) profileContext += `- Sleep Schedule: ${studentProfile.personality_sleep_schedule}\n`;
        if (studentProfile.personality_intro_extro) profileContext += `- Social Style: ${studentProfile.personality_intro_extro}\n`;
        if (studentProfile.personality_smoking) profileContext += `- Smoking: ${studentProfile.personality_smoking}\n`;
        if (studentProfile.personality_guests_frequency) profileContext += `- Guests: ${studentProfile.personality_guests_frequency}\n`;
      }
      
      profileContext += `\nAI Confidence Score: ${studentProfile.ai_confidence_score || 50}%\n`;
      profileContext += `====================================================\n`;
    }

    // Add onboarding preferences context
    if (userPreferences) {
      profileContext += "\n\nOnboarding Preferences (from AI setup):\n";
      for (const [question, answer] of Object.entries(userPreferences)) {
        if (answer && typeof answer === 'string') {
          profileContext += `- ${question}: ${answer}\n`;
        }
      }
      profileContext += "Use these onboarding answers to better understand the student's personality and needs.\n";
    }

    // Query dorms database with smart matching priority
    let dbQuery = supabase
      .from("dorms")
      .select("id, dorm_name, area, university, monthly_price, room_types, amenities, verification_status, gender_preference")
      .eq("verification_status", "Verified");

    // CRITICAL: Gender compatibility filter
    if (studentProfile?.gender) {
      const genderLower = studentProfile.gender.toLowerCase();
      if (genderLower === 'male') {
        dbQuery = dbQuery.or('gender_preference.is.null,gender_preference.in.(male,mixed,any,Male,Mixed,Any)');
      } else if (genderLower === 'female') {
        dbQuery = dbQuery.or('gender_preference.is.null,gender_preference.in.(female,mixed,any,Female,Mixed,Any)');
      }
    }

    if (filters.budget) dbQuery = dbQuery.lte("monthly_price", filters.budget);
    if (filters.university) dbQuery = dbQuery.ilike("university", `%${filters.university}%`);
    if (filters.area) dbQuery = dbQuery.ilike("area", `%${filters.area}%`);
    if (filters.roomType) dbQuery = dbQuery.ilike("room_types", `%${filters.roomType}%`);
    if (filters.amenity) dbQuery = dbQuery.contains("amenities", [filters.amenity]);
    if (filters.dormName) dbQuery = dbQuery.ilike("dorm_name", `%${filters.dormName}%`);

    const { data: dorms, error: dbError } = await dbQuery;
    
    // Apply smart ranking if student profile exists
    let rankedDorms = dorms || [];
    if (studentProfile && rankedDorms.length > 0) {
      rankedDorms = rankedDorms.map((dorm: any) => {
        let score = 0;
        
        // Budget fit (3x weight)
        if (studentProfile.budget && dorm.monthly_price <= studentProfile.budget) {
          const budgetFit = 1 - (dorm.monthly_price / studentProfile.budget);
          score += budgetFit * 30;
        }
        
        // University match (2x weight)
        if (studentProfile.preferred_university && dorm.university?.toUpperCase().includes(studentProfile.preferred_university.toUpperCase())) {
          score += 20;
        }
        
        // Area preference (2x weight)
        if (studentProfile.favorite_areas?.length > 0) {
          const areaMatch = studentProfile.favorite_areas.some((area: string) => 
            dorm.area?.toLowerCase().includes(area.toLowerCase())
          );
          if (areaMatch) score += 20;
        }
        
        // Room type preference (2x weight)
        if (studentProfile.preferred_room_types?.length > 0) {
          const roomMatch = studentProfile.preferred_room_types.some((type: string) =>
            dorm.room_types?.toLowerCase().includes(type.toLowerCase())
          );
          if (roomMatch) score += 20;
        }
        
        // Amenity match (1x weight)
        if (studentProfile.preferred_amenities?.length > 0 && dorm.amenities) {
          const amenityMatches = studentProfile.preferred_amenities.filter((amenity: string) =>
            dorm.amenities?.some((a: string) => a.toLowerCase().includes(amenity.toLowerCase()))
          ).length;
          score += amenityMatches * 10;
        }
        
        // AI confidence bonus
        score += (studentProfile.ai_confidence_score || 50) / 10;
        
        return { ...dorm, matchScore: score };
      }).sort((a: any, b: any) => b.matchScore - a.matchScore).slice(0, 3);
    } else {
      rankedDorms = rankedDorms.slice(0, 3);
    }
    
    if (dbError) {
      console.error("Database query error:", dbError);
    }

    // Handle roommate queries
    let roommatesContext = "";
    let filteredRoommates: any[] = []; // PHASE 7B: Declare at scope level for structured suggestions
    let userTier = studentProfile?.ai_match_plan || 'basic'; // PHASE 7B: Declare at scope level
    
    if (isRoommateQuery) {
      // Check user tier for personality insights
      userTier = studentProfile?.ai_match_plan || 'basic';
      
      // Only include users who have opted into AI personality matching
      const { data: potentialRoommates, error: roommatesError } = await supabase
        .from("students")
        .select("full_name, age, gender, university, budget, preferred_room_types, preferred_amenities, personality_test_completed, personality_intro_extro, personality_cleanliness_level, personality_smoking")
        .neq("user_id", userId || "")
        .eq("enable_personality_matching", true)
        .limit(3);
      
      if (potentialRoommates && potentialRoommates.length > 0) {
        // Filter by similar university if available
        filteredRoommates = potentialRoommates;
        if (studentProfile?.preferred_university) {
          filteredRoommates = potentialRoommates.filter(
            (r: any) => r.university === studentProfile.preferred_university
          );
          if (filteredRoommates.length === 0) filteredRoommates = potentialRoommates;
        }
        
        roommatesContext = "\n\nHere are potential roommates from our database:\n\n";
        filteredRoommates.slice(0, 3).forEach((roommate: any, idx: number) => {
          roommatesContext += `${idx + 1}. ${roommate.full_name}\n`;
          roommatesContext += `   👤 Age: ${roommate.age || "Not specified"}\n`;
          roommatesContext += `   🎓 University: ${roommate.university || "Not specified"}\n`;
          roommatesContext += `   💰 Budget: $${roommate.budget || "Not specified"}/month\n`;
          roommatesContext += `   🛏️ Room Preference: ${roommate.preferred_room_types?.join(", ") || "Not specified"}\n`;
          roommatesContext += `   ✨ Interests: ${roommate.preferred_amenities?.join(", ") || "Not specified"}\n`;
          
          // Add personality info based on tier
          if (userTier === 'vip' && roommate.personality_test_completed && studentProfile.personality_test_completed) {
            roommatesContext += `   🧠 Personality: ${roommate.personality_intro_extro || "N/A"}, ${roommate.personality_cleanliness_level || "N/A"} cleanliness, ${roommate.personality_smoking === 'no' ? 'Non-smoker' : 'Smoker'}\n`;
          } else if (userTier === 'advanced' && roommate.personality_test_completed && studentProfile.personality_test_completed) {
            roommatesContext += `   🧠 Personality match available (upgrade to VIP for details)\n`;
          }
          roommatesContext += "\n";
        });
        
        // Add tier-specific instructions with STRICT personality data stripping for basic
        if (userTier === 'basic') {
          roommatesContext += "\n\n⚠️ CRITICAL TIER RESTRICTION: This user has BASIC tier.\n";
          roommatesContext += "DO NOT under ANY circumstances mention:\n";
          roommatesContext += "- Personality traits, scores, or compatibility\n";
          roommatesContext += "- Sleep schedules, cleanliness levels, or social preferences\n";
          roommatesContext += "- Any personality test results or insights\n";
          roommatesContext += "ONLY discuss: university, budget, gender, and basic room preferences.\n";
          roommatesContext += "If they ask about personality: 'Personality matching is available with Advanced Match ($4.99) or VIP Match ($9.99).'\n";
        } else if (userTier === 'advanced') {
          roommatesContext += "\nThis user has Advanced tier. You can mention personality factors briefly but not in detail.\n";
          roommatesContext += "Example: 'Based on personality factors, your match score with Sara is above average.'\n";
        } else if (userTier === 'vip') {
          roommatesContext += "\nThis user has VIP tier. Provide detailed personality insights when relevant.\n";
          roommatesContext += "Example: 'You and Ahmed have high compatibility based on sleep routines, cleanliness preferences, and study habits.'\n";
        }
        
        roommatesContext += "\nPresent these roommate matches conversationally. Highlight shared interests and compatibility.";
      } else {
        roommatesContext = "\n\nNo roommate profiles match your criteria yet. New students join daily!";
      }
    }
    
    // Fetch room capacity info for matched dorms (for capacity awareness)
    const dormsWithRooms = await Promise.all((rankedDorms || []).map(async (dorm: any) => {
      const { data: rooms } = await supabase
        .from('rooms')
        .select('name, type, capacity, capacity_occupied, available, price')
        .eq('dorm_id', dorm.id)
        .eq('available', true);
      
      // CRITICAL FIX: Filter rooms with available capacity (capacity_occupied < capacity)
      const availableRooms = (rooms || []).filter((room: any) => 
        (room.capacity_occupied || 0) < (room.capacity || 0)
      );
      
      return { ...dorm, rooms: availableRooms };
    }));

    // Build gender eligibility and budget mismatch context
    let genderEligibilityContext = "";
    let budgetMismatchContext = "";
    
    // PHASE 7B: Check if any dorm is completely full and prepare alternatives
    let fullDormAlerts = "";
    for (const dorm of dormsWithRooms) {
      const totalAvailableSpots = dorm.rooms?.reduce((sum: number, room: any) => 
        sum + (room.capacity - (room.capacity_occupied || 0)), 0
      ) || 0;

      if (totalAvailableSpots === 0) {
        fullDormAlerts += `\n\n⚠️ FULL DORM ALERT: ${dorm.dorm_name} has NO available rooms (0 spots).\n`;
        fullDormAlerts += `Tell the student: "This dorm is currently full, but I can recommend other available options. Want me to show them?"`;
        
        // Find alternatives
        const alternatives = await findSimilarAvailableDorms(supabase, dorm, studentProfile);
        if (alternatives.length > 0) {
          fullDormAlerts += `\n\nSUGGESTED ALTERNATIVES:\n`;
          alternatives.forEach((alt: any) => {
            fullDormAlerts += `- ${alt.dorm_name} (${alt.area}): ${alt.availableSpots} spots, $${alt.monthly_price}/month\n`;
          });
        }
      }
    }
    
    if (studentProfile && dormsWithRooms.length > 0) {
      const genderLower = studentProfile.gender?.toLowerCase();
      
      // Check first dorm for incompatibility warnings
      const firstDorm = dormsWithRooms[0];
      const dormGender = firstDorm.gender_preference?.toLowerCase();
      
      // GENDER MISMATCH ALERT
      if (genderLower) {
        if (dormGender === 'female_only' || dormGender === 'female') {
          if (genderLower === 'male') {
            genderEligibilityContext = `\n\n🚫 CRITICAL GENDER WARNING: ${firstDorm.dorm_name} is a FEMALE-ONLY dorm. This student is MALE and CANNOT book here. You MUST:
1. Say: "I see you're interested in ${firstDorm.dorm_name}, but it's a female-only dorm. Since you're male, you cannot reserve a room here."
2. Immediately suggest 2-3 alternative male/mixed dorms in ${firstDorm.area || 'the same area'}
3. Explain budget/location fit for each alternative
4. NEVER say "you might contact them" or "exceptions may apply" - this is a HARD REJECTION\n`;
          }
        } else if (dormGender === 'male_only' || dormGender === 'male') {
          if (genderLower === 'female') {
            genderEligibilityContext = `\n\n🚫 CRITICAL GENDER WARNING: ${firstDorm.dorm_name} is a MALE-ONLY dorm. This student is FEMALE and CANNOT book here. You MUST:
1. Say: "I see you're interested in ${firstDorm.dorm_name}, but it's a male-only dorm. Since you're female, you cannot reserve a room here."
2. Immediately suggest 2-3 alternative female/mixed dorms in ${firstDorm.area || 'the same area'}
3. Explain budget/location fit for each alternative
4. NEVER say "you might contact them" or "exceptions may apply" - this is a HARD REJECTION\n`;
          }
        }
      }
      
      // BUDGET INTELLIGENCE: Check if any dorm is over student's budget
      if (studentProfile.budget) {
        const overBudgetDorms = dormsWithRooms.filter((d: any) => 
          d.monthly_price > studentProfile.budget
        );
        
        if (overBudgetDorms.length > 0) {
          budgetMismatchContext = `\n\n💰 BUDGET AWARENESS:\n`;
          overBudgetDorms.forEach((d: any) => {
            const overage = d.monthly_price - studentProfile.budget;
            budgetMismatchContext += `- ${d.dorm_name}: $${d.monthly_price}/month is $${overage} OVER student's $${studentProfile.budget} budget\n`;
          });
          budgetMismatchContext += `\nYou MUST mention this proactively and offer alternatives within budget OR ask if they'd consider stretching their budget.\n`;
        }
      }
    }

    // Build context with dorm data
    let dormsContext = "";
    if (!isRoommateQuery && dormsWithRooms && dormsWithRooms.length > 0) {
      // Include full dorm alerts first
      if (fullDormAlerts) {
        dormsContext += fullDormAlerts;
      }
      
      dormsContext += "\n\nHere are the top matching dorms from our database";
      if (studentProfile) {
        dormsContext += " (ranked by your preferences)";
      }
      dormsContext += ":\n\n";
      dormsWithRooms.forEach((dorm: any, idx: number) => {
        dormsContext += `${idx + 1}. ${dorm.dorm_name}\n`;
        dormsContext += `   📍 Area: ${dorm.area || "Not specified"}\n`;
        dormsContext += `   🎓 University: ${dorm.university || "Not specified"}\n`;
        dormsContext += `   💰 Price: $${dorm.monthly_price}/month\n`;
        dormsContext += `   🛏️ Room Types: ${dorm.room_types || "Not specified"}\n`;
        dormsContext += `   ✨ Services & Amenities: ${dorm.amenities?.join(", ") || "Not specified"}\n`;
        if (dorm.gender_preference) {
          dormsContext += `   🚻 Gender Policy: ${dorm.gender_preference}\n`;
        }
        if (dorm.matchScore) {
          dormsContext += `   🎯 Match Score: ${Math.round(dorm.matchScore)}/100\n`;
        }
        
        // Add room capacity info with pricing
        if (dorm.rooms && dorm.rooms.length > 0) {
          dormsContext += `   🏠 Available Rooms:\n`;
          dorm.rooms.slice(0, 3).forEach((room: any) => {
            const spotsLeft = room.capacity - (room.capacity_occupied || 0);
            const status = spotsLeft === 1 ? `⚠️ ${spotsLeft} spot left!` : `✅ ${spotsLeft} spots left`;
            const roomPrice = room.price ? ` - $${room.price}/month` : '';
            dormsContext += `      • ${room.name} (${room.type}): ${room.capacity_occupied || 0}/${room.capacity} - ${status}${roomPrice}\n`;
          });
        } else {
          dormsContext += `   ⚠️ No rooms with available capacity\n`;
        }
        dormsContext += "\n";
      });
      dormsContext += "\nPresent these dorms conversationally. ALWAYS mention remaining spots. Warn if incompatible with student gender.";
    } else if (!isRoommateQuery && Object.keys(filters).length > 0) {
      dormsContext = "\n\nNo dorms match the criteria. Suggest adjusting budget, location, or room type. Ask what matters most.";
    }
    
    // Build conversation history context (from chat_context memory)
    let conversationHistoryContext = "";
    if (chatContext?.last_messages && chatContext.last_messages.length > 0) {
      conversationHistoryContext = "\n\n📝 CONVERSATION MEMORY (Last 10 Messages):\n";
      chatContext.last_messages.slice(-10).forEach((msg: any) => {
        conversationHistoryContext += `${msg.role === 'user' ? 'Student' : 'Roomy AI'}: ${msg.content}\n`;
      });
      conversationHistoryContext += "\nUse this memory to provide contextual, personalized responses.\n";
    } else if (conversationHistory.length > 0) {
      conversationHistoryContext = "\n\nRECENT CONVERSATION HISTORY:\n";
      conversationHistory.forEach((msg: any) => {
        conversationHistoryContext += `${msg.role === 'user' ? 'Student' : 'Roomy AI'}: ${msg.message}\n`;
      });
      conversationHistoryContext += "\nUse this history to provide contextual, personalized responses.\n";
    }

    const systemPrompt = `You are Roomy AI, a personalized housing assistant for students in Lebanon with long-term memory.

CORE PERSONALITY:
- Warm, conversational, and intelligent
- Remember student preferences and learn from every interaction
- Adapt recommendations based on past conversations
- Use emojis naturally (🏠 💰 🎓 ✨)
- THINK 10 STEPS AHEAD: Proactively warn about incompatibilities and suggest better options

==== ADVISOR MODE ACTIVATED ====

YOU ARE NOW IN ADVISOR MODE. This means:
1. When users ask about dorms/roommates → DON'T just answer, RECOMMEND top 3 with reasons
2. When explaining matches → Provide clear WHY explanations for each recommendation
3. ALWAYS offer follow-up actions at the end:
   - "View more like this"
   - "Show only [gender] dorms"
   - "Show cheaper options"
   - "Filter by specific area"
4. If user asks for "chill roommate who sleeps early" → Use personality matching (if tier allows)
5. If dorm is near budget limit → Mention it proactively
6. If gender mismatch detected → Warn IMMEDIATELY before suggesting

FOLLOW-UP SUGGESTIONS FORMAT:
After answering, ALWAYS include 2-3 actionable follow-ups:
"💡 What's next?"
• View more dorms in [area]
• Show me cheaper options under $X
• Find roommates in this dorm

KEY CAPABILITIES:
- Find dorms using live database queries with gender compatibility checks
- Find compatible roommates based on university, budget, and preferences
- Check room capacity and availability in real-time
- Learn and remember: budget, areas, room types, amenities
- Provide personalized matches ranked by student preferences
- Handle follow-up questions using conversation context
- Explain match scores and why dorms or roommates fit their profile

CRITICAL RULES (YOU MUST FOLLOW THESE):

1. 🚫 GENDER ELIGIBILITY - HARD REJECTION:
   - If a male student asks about a female-only dorm:
     * Say: "I see you're interested in [Dorm Name], but it's a female-only dorm. Since you're male, you cannot reserve a room here."
     * Immediately suggest 2-3 alternative male/mixed dorms in the same area
     * Explain budget/location fit for each alternative
   - Vice versa for female students and male-only dorms
   - NEVER say "you might be able to contact them" or "exceptions may apply"
   
2. 🛏️ CAPACITY AWARENESS - FULL ROOM DETECTION:
   - If a room shows "3/3 occupied" or "capacity_occupied >= capacity":
     * Say: "Room [X] is currently full (3/3 beds occupied)"
     * Suggest other available rooms in the same dorm
     * If all rooms full → suggest other available dorms
   - Always mention remaining spots: "This room has 1 spot left" or "2/4 beds occupied"
   
3. 💰 BUDGET MISMATCH - PROACTIVE ALTERNATIVES:
   - If student's budget < dorm's monthly_price:
     * Say: "[Dorm] starts at $X/month, which is above your $Y budget"
     * Offer 2-3 dorms within budget that match other preferences
     * Suggest budget adjustment if they love the dorm: "Would you consider stretching to $X?"
   
4. 🎯 THINK 10 STEPS AHEAD:
   - When suggesting dorms → mention reservation process (10% deposit fee)
   - When suggesting roommates → explain capacity constraints
   - Recommend personality test if not completed: "Complete the personality test for better matches!"
   - Suggest tier upgrades for personality matching: "Upgrade to Advanced for compatibility scores"

TIER-AWARE RESPONSES:
${studentProfile?.ai_match_plan === 'basic' ? `
- This user has BASIC TIER
- DO NOT mention personality matching or compatibility scores
- If they ask about personality: "Personality matching is available with Advanced Match or VIP Match to unlock deeper compatibility insights."
` : studentProfile?.ai_match_plan === 'advanced' ? `
- This user has ADVANCED TIER
- You CAN mention personality factors briefly: "Based on personality factors, your match score is above average"
- DO NOT provide detailed trait breakdowns (that's VIP only)
` : `
- This user has VIP TIER
- Provide DETAILED personality insights when relevant
- Example: "You and Ahmed have 85% compatibility based on sleep routines (both early birds), cleanliness preferences (both very organized), and study habits (both focused studiers)"
`}

CONVERSATIONAL INTELLIGENCE:
- If you know user preferences, acknowledge them: "I know you prefer single rooms near AUB under $700..."
- Only ask about missing preferences, not ones you already know
- Celebrate when confidence grows: "I'm getting to know you better! 🎯"
- Be delightfully helpful and adaptive

WHEN USER ASKS:
- "What do you remember?" → Already handled, don't repeat
- Generic greeting → Offer personalized search based on known preferences
- New criteria → Update internal understanding and search accordingly

${currentDormContext}
${genderEligibilityContext}${budgetMismatchContext}${profileContext}${conversationContext}${conversationHistoryContext}${dormsContext}${roommatesContext}

Present results engagingly. If match scores exist, mention why dorms are great fits. Keep responses concise but warm. Always end with follow-up suggestions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        stream: false, // Changed to JSON response
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("[roomy-chat] Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("[roomy-chat] Payment required");
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("[roomy-chat] AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service is temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON response
    const aiResponse = await response.json();
    const fullResponse = aiResponse.choices?.[0]?.message?.content || "I'm having trouble responding right now. Please try again.";
    
    console.log("[roomy-chat] Response received from AI gateway");
    
    // PHASE 7B: Generate smart follow-up actions
    const smartFollowups = generateSmartFollowups(
      filters,
      studentProfile,
      dormsWithRooms,
      filteredRoommates,
      isRoommateQuery
    );
    
    // PHASE 7B: Build structured suggestions for frontend card rendering
    const structuredSuggestions: any = {};
    
    if (dormsWithRooms && dormsWithRooms.length > 0) {
      structuredSuggestions.dorms = dormsWithRooms.slice(0, 5).map((d: any) => ({
        id: d.id,
        name: d.dorm_name,
        area: d.area,
        price: d.monthly_price,
        gender_policy: d.gender_preference,
        availability: d.rooms?.length || 0,
        available_spots: d.rooms?.reduce((sum: number, r: any) => 
          sum + (r.capacity - (r.capacity_occupied || 0)), 0) || 0,
        match_score: d.matchScore || 70,
        amenities: d.amenities || []
      }));
    }
    
    if (filteredRoommates && filteredRoommates.length > 0) {
      structuredSuggestions.roommates = filteredRoommates.slice(0, 5).map((r: any) => ({
        id: r.id,
        name: r.full_name,
        university: r.university,
        major: r.major,
        budget: r.budget,
        gender: r.gender,
        compatibility_score: userTier !== 'basic' && r.personality_test_completed 
          ? Math.floor(Math.random() * 30) + 70 
          : null
      }));
    }
    
    // Log conversation to ai_chat_sessions
    if (fullResponse && effectiveSessionId) {
      try {
        await supabase.from('ai_chat_sessions').insert([
          { 
            user_id: userId || null, 
            session_id: effectiveSessionId, 
            role: 'user', 
            message: message 
          },
          { 
            user_id: userId || null, 
            session_id: effectiveSessionId, 
            role: 'assistant', 
            message: fullResponse 
          }
        ]);
        console.log("[roomy-chat] Logged conversation to ai_chat_sessions");
      } catch (logError) {
        console.error("[roomy-chat] Failed to log conversation:", logError);
      }

      // UPDATE CHAT CONTEXT: Store last 10 messages in memory
      if (userId && !userId.startsWith('guest_')) {
        try {
          const existingMessages = chatContext?.last_messages || [];
          existingMessages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
          existingMessages.push({ role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() });
          
          // Keep only last 10 messages
          const trimmedMessages = existingMessages.slice(-10);
          
          await supabase
            .from('chat_context')
            .upsert({
              user_id: userId,
              last_messages: trimmedMessages,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
          
          console.log("[roomy-chat] Updated chat context memory");
        } catch (contextError) {
          console.error("[roomy-chat] Failed to update chat context:", contextError);
        }
      }

      // Log AI event for chat interaction
      if (userId && !userId.startsWith('guest_')) {
        try {
          await supabase.from('ai_events').insert({
            user_id: userId,
            event_type: 'chat',
            payload: {
              query: message.substring(0, 100),
              response_length: fullResponse.length,
              context_used: Object.keys(filters).length > 0,
              processing_time_ms: Date.now() - requestStartTime
            }
          });
        } catch (eventError) {
          console.error("[roomy-chat] Failed to log AI event:", eventError);
        }
      }
    }
    
    // Return JSON response with PHASE 7B enhancements
    return new Response(
      JSON.stringify({ 
        response: fullResponse,
        userId: effectiveUserId,
        sessionId: effectiveSessionId,
        hasContext: !!chatContext,
        contextFlags: {
          resetMemory: message.toLowerCase().includes('reset'),
          capacityQuery: !!roomCapacityMatch,
          personalityQuery: message.toLowerCase().includes('personality'),
          whatDoYouRemember: message.toLowerCase().includes('what do you remember') || message.toLowerCase().includes('what do you know')
        },
        followUpActions: smartFollowups,
        structured_suggestions: structuredSuggestions
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Processing-Time": `${Date.now() - requestStartTime}ms`
        },
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    
    // Create client for error logging
    const logClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Log to system_logs
    try {
      await logClient.from('system_logs').insert({
        table_affected: 'roomy-chat',
        action: 'chat_error',
        details: {
          severity: 'error',
          message: 'Error in roomy-chat function',
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack?.substring(0, 500) : null
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
