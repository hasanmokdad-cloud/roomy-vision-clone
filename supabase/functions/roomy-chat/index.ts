import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to detect keywords and extract filters
function extractFilters(message: string, context: any = {}) {
  const query = message.toLowerCase();
  const filters: any = { ...context };

  // Budget detection
  const budgetMatch = query.match(/\$?(\d{2,4})/);
  if (budgetMatch) filters.budget = parseInt(budgetMatch[1]);
  else if (query.includes("cheaper") || query.includes("lower")) {
    // Reduce budget by 20% if asking for cheaper
    if (context.budget) filters.budget = Math.floor(context.budget * 0.8);
  }

  // University detection
  const universities = ["lau", "aub", "usek", "usj", "balamand", "bau", "lu", "haigazian"];
  const uniMatch = universities.find(u => query.includes(u));
  if (uniMatch) filters.university = uniMatch.toUpperCase();

  // Area detection
  const areas = ["hamra", "jbeil", "byblos", "verdun", "raoucheh", "hazmieh", "badaro", "dekowaneh", "manara", "blat", "fidar"];
  const areaMatch = areas.find(a => query.includes(a));
  if (areaMatch) filters.area = areaMatch;

  // Room type detection
  const roomTypes = ["shared", "single", "private", "studio", "apartment"];
  const roomMatch = roomTypes.find(r => query.includes(r));
  if (roomMatch) filters.roomType = roomMatch;

  // Detect amenity queries
  if (query.includes("parking") || query.includes("garage")) filters.amenity = "parking";
  if (query.includes("wifi") || query.includes("internet")) filters.amenity = "wifi";
  if (query.includes("gym") || query.includes("fitness")) filters.amenity = "gym";
  if (query.includes("laundry")) filters.amenity = "laundry";

  return filters;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, sessionId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Generate session ID for guest users
    const effectiveUserId = userId || `guest_${Date.now()}`;
    const effectiveSessionId = sessionId || effectiveUserId;

    // Check for reset command
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

    // Extract filters from message, merging with stored context
    const filters = extractFilters(message, storedContext);
    
    // Build conversation context from history (last 10 messages)
    const recentHistory = history.slice(-10);
    const conversationContext = recentHistory.length > 0
      ? "\n\nPrevious conversation:\n" + recentHistory.map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join("\n") + "\n"
      : "";

    // Query dorms database with filters
    let dbQuery = supabase
      .from("dorms")
      .select("dorm_name, area, university, monthly_price, room_types, services_amenities, verification_status")
      .eq("verification_status", "Verified")
      .limit(3);

    if (filters.budget) dbQuery = dbQuery.lte("monthly_price", filters.budget);
    if (filters.university) dbQuery = dbQuery.ilike("university", `%${filters.university}%`);
    if (filters.area) dbQuery = dbQuery.ilike("area", `%${filters.area}%`);
    if (filters.roomType) dbQuery = dbQuery.ilike("room_types", `%${filters.roomType}%`);
    if (filters.amenity) dbQuery = dbQuery.ilike("services_amenities", `%${filters.amenity}%`);

    const { data: dorms, error: dbError } = await dbQuery;
    
    if (dbError) {
      console.error("Database query error:", dbError);
    }

    // Build context with dorm data
    let dormsContext = "";
    if (dorms && dorms.length > 0) {
      dormsContext = "\n\nHere are the matching dorms from our database:\n\n";
      dorms.forEach((dorm, idx) => {
        dormsContext += `${idx + 1}. ${dorm.dorm_name}\n`;
        dormsContext += `   📍 Area: ${dorm.area || "Not specified"}\n`;
        dormsContext += `   🎓 University: ${dorm.university || "Not specified"}\n`;
        dormsContext += `   💰 Price: $${dorm.monthly_price}/month\n`;
        dormsContext += `   🛏️ Room Types: ${dorm.room_types || "Not specified"}\n`;
        dormsContext += `   ✨ Amenities: ${dorm.services_amenities || "Not specified"}\n\n`;
      });
      dormsContext += "\nPlease present these dorms to the user in a friendly, conversational way using emojis.";
    } else if (Object.keys(filters).length > 0) {
      dormsContext = "\n\nNo dorms match the user's criteria. Politely inform them and suggest they adjust their budget, location, or room type preferences.";
    }

    const systemPrompt = `You are Roomy AI, a friendly and helpful assistant for student housing in Lebanon. 
Your role is to help students find the perfect dorm that matches their preferences.

Key capabilities:
- Help students find dorms based on budget, university, location, and preferences
- Provide detailed information about available dorms from our live database
- Remember previous conversation context to handle follow-up questions naturally
- Recommend dorms based on amenities, gender preferences, and proximity to universities
- Be conversational, warm, and helpful
- Use emojis to make conversations friendly (🏠 💰 🎓 ✨)

When I provide you with matching dorms from our database, present them in an engaging way.
If no dorms match, suggest alternatives or ask the user to adjust their criteria.
Keep responses concise and actionable.${conversationContext}${dormsContext}`;

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "An error occurred processing your request" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices?.[0]?.message?.content || "Sorry, I couldn't process that request.";

    // Update session with new messages
    const updatedHistory = [
      ...history,
      { role: "user", content: message, timestamp: new Date().toISOString() },
      { role: "assistant", content: aiResponse, timestamp: new Date().toISOString() }
    ];

    // Keep only last 20 entries (10 conversation turns)
    const trimmedHistory = updatedHistory.slice(-20);

    // Update context with latest filters
    const updatedContext = { ...filters };

    await supabase.from("chat_sessions")
      .update({
        history: trimmedHistory,
        context: updatedContext,
        updated_at: new Date().toISOString()
      })
      .eq("session_id", effectiveSessionId);

    // Log conversation (optional)
    if (userId) {
      const { error: logError } = await supabase.from("chat_logs").insert([{
        user_id: userId,
        message: message,
        reply: aiResponse,
      }]);
      if (logError) console.error("Failed to log chat:", logError);
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        sessionId: effectiveSessionId,
        hasContext: recentHistory.length > 0
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
