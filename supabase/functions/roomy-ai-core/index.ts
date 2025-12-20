/**
 * Roomy AI Core - Unified AI Matching Engine
 * 
 * Handles dorm matching, roommate matching, and combined matching
 * Uses Gemini for re-ranking and insights generation
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { generateMatchExplanations, generateMatchExplanation } from "./explanations.ts";
import { fetchWithRelaxedFilters } from "./fallbackFilters.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting - 10 requests per minute per IP (AI matching)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[roomy-ai-core] Request received');

  // Rate limiting check
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   req.headers.get("x-real-ip") || 
                   "unknown";
  
  if (isRateLimited(clientIp)) {
    console.log("[roomy-ai-core] Rate limit exceeded for IP:", clientIp);
    
    // Log rate limit event
    try {
      const logClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await logClient.from("security_events").insert({
        event_type: "rate_limit_exceeded",
        severity: "warning",
        ip_region: clientIp,
        details: { function: "roomy-ai-core", limit: RATE_LIMIT, window: "1min" }
      });
    } catch (e) {
      console.error("Failed to log rate limit event:", e);
    }
    
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": "60"
        } 
      }
    );
  }

  try {
    const { mode, match_tier, personality_enabled, limit, context, exclude_ids, action } = await req.json();

    // Handle feedback recording endpoint
    if (action === 'record_feedback') {
      const { ai_action, target_id, helpful_score, feedback_text } = await req.json();
      
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Invalid authentication" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase.from('ai_feedback').insert({
        user_id: user.id,
        ai_action,
        target_id,
        helpful_score,
        feedback_text,
        context: { mode, tier: match_tier }
      });
      
      await supabase.from('ai_events').insert({
        user_id: user.id,
        event_type: 'feedback',
        payload: { ai_action, target_id, helpful_score }
      });
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle aggregate scores endpoint
    if (action === 'get_aggregate_scores') {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      
      const { data: feedbacks } = await supabase
        .from('ai_feedback')
        .select('ai_action, helpful_score, target_id');
      
      const aggregates: any = {};
      feedbacks?.forEach((f: any) => {
        if (!aggregates[f.ai_action]) {
          aggregates[f.ai_action] = { total: 0, count: 0, targets: {} };
        }
        aggregates[f.ai_action].total += f.helpful_score;
        aggregates[f.ai_action].count += 1;
        
        if (f.target_id) {
          if (!aggregates[f.ai_action].targets[f.target_id]) {
            aggregates[f.ai_action].targets[f.target_id] = { total: 0, count: 0 };
          }
          aggregates[f.ai_action].targets[f.target_id].total += f.helpful_score;
          aggregates[f.ai_action].targets[f.target_id].count += 1;
        }
      });
      
      return new Response(
        JSON.stringify(aggregates),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LOVABLE_API_KEY) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch student profile
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: "Student profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get effective match plan (check expiry)
    const effectivePlan = await getEffectiveMatchPlanForStudent(supabase, student.id);
    console.log('[roomy-ai-core] Effective plan:', effectivePlan);

    // Determine tier limits
    const tierLimits: Record<string, number> = {
      basic: 1,
      advanced: 3,
      vip: 10
    };
    const tierLimit = tierLimits[effectivePlan.tier] || 1;
    
    // Determine if personality should be used (based on effective plan, not passed tier)
    const usePersonality = effectivePlan.isPersonalityEnabled && 
                          student.personality_test_completed;

    let matches: any[] = [];
    let insightsBanner = '';

    // Fetch candidates based on mode
    if (mode === 'dorm' || mode === 'combined') {
      matches = await fetchDormMatches(supabase, student, context, exclude_ids);
    }

    if (mode === 'rooms') {
      matches = await fetchRoomMatches(supabase, student, context, exclude_ids);
    }

    if (mode === 'roommate' || mode === 'combined') {
      const roommateMatches = await fetchRoommateMatches(
        supabase, 
        student, 
        usePersonality, 
        tierLimit,
        exclude_ids
      );
      matches = mode === 'combined' ? [...matches, ...roommateMatches] : roommateMatches;
    }
    
    // Generate detailed explanations for each match
    matches = matches.map(match => ({
      ...match,
      explanations: generateMatchExplanations(match, student, effectivePlan.tier as 'basic' | 'advanced' | 'vip', usePersonality)
    }));

    // Call Gemini for re-ranking and insights (only if matches found)
    if (matches.length > 0) {
      const aiResult = await enhanceWithGemini(
        matches,
        student,
        mode,
        usePersonality,
        LOVABLE_API_KEY
      );
      
      matches = aiResult.rankedMatches.slice(0, mode === 'dorm' ? (limit || 10) : tierLimit);
      insightsBanner = aiResult.insights;
    }

    // Log the request
    await supabase.from('ai_match_logs').insert({
      student_id: student.id,
      mode,
      match_tier: effectivePlan.tier,
      personality_used: usePersonality,
      result_count: matches.length,
      insights_generated: !!insightsBanner,
      processing_time_ms: Date.now() - startTime
    });

    // Log AI event for learning
    await supabase.from('ai_events').insert({
      user_id: user.id,
      event_type: 'match',
      payload: {
        mode,
        tier: effectivePlan.tier,
        personality_used: usePersonality,
        result_count: matches.length,
        processing_time_ms: Date.now() - startTime
      }
    });

    // PHASE 7B: Implement fallback logic when no matches found
    let fallbackInfo = null;
    if (matches.length === 0) {
      console.log('[roomy-ai-core] No matches found, applying fallback filters');
      
      const fallbackMatches = await fetchWithRelaxedFilters(supabase, student, context, mode, exclude_ids);
      
      if (fallbackMatches.length > 0) {
        matches = fallbackMatches;
        fallbackInfo = {
          type: mode === 'dorm' ? 'dorm_no_match' : 'roommate_no_match',
          message: mode === 'dorm' 
            ? "No perfect matches found. Here are rooms slightly outside your budget or preferred area that may still work."
            : "No perfectly compatible roommates found. Here are students with similar budgets and preferences.",
          filters_relaxed: ['budget', 'area', 'room_type']
        };
      } else {
        fallbackInfo = {
          type: `${mode}_no_match`,
          message: "No matches found with current criteria. Try adjusting your preferences.",
          suggestions: mode === 'dorm' 
            ? ["Increase budget by 10-20%", "Expand area search", "Try different room types"]
            : ["Expand university search", "Adjust budget range", "Consider different housing areas"]
        };
      }
    }

    // Add tier info to response for frontend use
    return new Response(
      JSON.stringify({
        ai_mode: mode,
        match_tier: effectivePlan.tier,
        personality_used: usePersonality,
        insights_banner: insightsBanner,
        matches: matches.map(m => ({
          ...m,
          personality_visible: usePersonality,
          explanation: generateMatchExplanation(m, student, effectivePlan.tier as 'basic' | 'advanced' | 'vip', usePersonality),
          tier_message: !usePersonality && m.type === 'roommate'
            ? 'Upgrade to Advanced for personality compatibility scores'
            : null
        })),
        fallback: fallbackInfo,
        tier_info: {
          current_tier: effectivePlan.tier,
          personality_enabled: usePersonality,
          match_limit: tierLimit
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('[roomy-ai-core] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Get effective match plan for student with expiry check
 */
async function getEffectiveMatchPlanForStudent(supabase: any, studentId: string) {
  const { data: plans } = await supabase
    .from('student_match_plans')
    .select('plan_type, expires_at, status')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1);

  if (!plans || plans.length === 0) {
    return { tier: 'basic', isPersonalityEnabled: false };
  }

  const plan = plans[0];
  const tier = plan.plan_type as 'basic' | 'advanced' | 'vip';
  const isPersonalityEnabled = tier !== 'basic';
  
  return { tier, isPersonalityEnabled };
}

async function fetchDormMatches(supabase: any, student: any, context: any = {}, exclude_ids?: string[]) {
  let query = supabase
    .from('dorms')
    .select('*')
    .eq('verification_status', 'Verified')
    .eq('available', true);

  // Exclude dismissed dorms
  if (exclude_ids && exclude_ids.length > 0) {
    query = query.not('id', 'in', `(${exclude_ids.join(',')})`);
  }

  // CRITICAL: Gender compatibility filter with explicit logging
  if (student.gender) {
    const genderLower = student.gender.toLowerCase();
    console.log(`[roomy-ai-core] Student gender: ${genderLower}, filtering dorms for gender compatibility`);
    if (genderLower === 'male') {
      // Exclude female-only dorms
      query = query.or('gender_preference.is.null,gender_preference.in.(male,mixed,any,Male,Mixed,Any)');
    } else if (genderLower === 'female') {
      // Exclude male-only dorms
      query = query.or('gender_preference.is.null,gender_preference.in.(female,mixed,any,Female,Mixed,Any)');
    }
  }

  // Budget filter with 10% tolerance
  if (context.budget || student.budget) {
    const maxBudget = Math.floor((context.budget || student.budget) * 1.10); // 10% tolerance
    query = query.lte('monthly_price', maxBudget);
    console.log(`[roomy-ai-core] Budget filter: $${context.budget || student.budget} with 10% tolerance (max: $${maxBudget})`);
  }

  if (context.area || student.favorite_areas?.length > 0) {
    const areas = context.area ? [context.area] : student.favorite_areas;
    query = query.in('area', areas);
  }

  if (context.university || student.preferred_university) {
    query = query.ilike('university', `%${context.university || student.preferred_university}%`);
  }

  const { data, error } = await query.limit(30);
  
  if (error) throw error;

  // Filter out dorms and fetch rooms with capacity checks
  const dormsWithRooms = await Promise.all((data || []).map(async (dorm: any) => {
    // Fetch available rooms for this dorm
    const { data: rooms } = await supabase
      .from('rooms')
      .select('*')
      .eq('dorm_id', dorm.id)
      .eq('available', true);
    
    // CRITICAL FIX: Filter rooms where capacity_occupied < capacity (JavaScript filter since Supabase doesn't support column comparison)
    let availableRooms = (rooms || []).filter((room: any) => 
      (room.capacity_occupied || 0) < (room.capacity || 0)
    );
    
    // If student selected "Any" room type AND needs roommate, exclude single rooms
    const studentRoomType = student.room_type;
    if ((studentRoomType === 'Any' || !studentRoomType) && student.need_roommate) {
      availableRooms = availableRooms.filter((room: any) => 
        !room.type?.toLowerCase().includes('single')
      );
      console.log(`[roomy-ai-core] Filtered out single rooms for dorm "${dorm.name}" - student needs roommate with "Any" room type`);
    }
    
    return {
      ...dorm,
      availableRooms,
      hasAvailableRooms: availableRooms.length > 0
    };
  }));

  // Only include dorms that have available rooms
  const dormsWithAvailableRooms = dormsWithRooms.filter(d => d.hasAvailableRooms);

  // Pre-score dorms with sub-scores + feedback boost + budget warning
  const scoredDorms = await Promise.all(dormsWithAvailableRooms.map(async (dorm: any) => {
    const locationScore = calculateLocationScore(dorm, student);
    let budgetScore = calculateBudgetScore(dorm, student);
    const roomTypeScore = calculateRoomTypeScore(dorm, student);
    const amenitiesScore = calculateAmenitiesScore(dorm, student);
    let overallScore = calculateDormScore(dorm, student);

    // Budget warning and penalty for over-budget dorms
    let budgetWarning = null;
    if (student.budget && dorm.monthly_price > student.budget) {
      const overage = dorm.monthly_price - student.budget;
      budgetWarning = `$${overage} over your budget`;
      // Penalize over-budget dorms
      budgetScore = Math.max(40, 70 - ((overage / student.budget) * 50));
      console.log(`[roomy-ai-core] Dorm ${dorm.dorm_name || dorm.name} is over budget: ${budgetWarning}, penalized score: ${budgetScore}`);
    }

    // Apply feedback boost from historical data
    const { data: feedbacks } = await supabase
      .from('ai_feedback')
      .select('helpful_score')
      .eq('ai_action', 'match_dorm')
      .eq('target_id', dorm.id);
    
    if (feedbacks && feedbacks.length > 0) {
      const avgScore = feedbacks.reduce((sum: number, f: any) => sum + f.helpful_score, 0) / feedbacks.length;
      const feedbackBoost = (avgScore - 3) * 5; // Range: -10 to +10
      overallScore = Math.min(100, Math.max(0, overallScore + feedbackBoost));
    }

    return {
      ...dorm,
      type: 'dorm',
      score: overallScore,
      budgetWarning,
      subScores: {
        location_score: locationScore,
        budget_score: budgetScore,
        room_type_score: roomTypeScore,
        amenities_score: amenitiesScore,
        ai_heuristics_score: 60,
        feedback_boost: feedbacks?.length || 0
      }
    };
  }));
  
  return scoredDorms.sort((a: any, b: any) => b.score - a.score);
}

/**
 * Fetch individual room matches with scoring
 */
async function fetchRoomMatches(supabase: any, student: any, context: any = {}, exclude_ids?: string[]) {
  // Fetch available rooms with dorm info
  let query = supabase
    .from('rooms')
    .select('*, dorm:dorms!dorm_id(id, name, dorm_name, area, university, gender_preference, amenities, shuttle, verification_status)')
    .eq('available', true);

  // Exclude dismissed rooms
  if (exclude_ids && exclude_ids.length > 0) {
    query = query.not('id', 'in', `(${exclude_ids.join(',')})`);
  }

  const { data, error } = await query.limit(50);
  
  if (error) throw error;

  // Filter rooms based on capacity, dorm verification, gender compatibility, and room type preference
  const validRooms = (data || []).filter((room: any) => {
    // Must have available capacity
    if ((room.capacity_occupied || 0) >= (room.capacity || 0)) return false;
    
    // Dorm must be verified
    if (room.dorm?.verification_status !== 'Verified') return false;
    
    // Gender compatibility check
    if (student.gender && room.dorm?.gender_preference) {
      const genderLower = student.gender.toLowerCase();
      const dormGender = room.dorm.gender_preference.toLowerCase();
      
      if (genderLower === 'male' && (dormGender === 'female' || dormGender === 'female_only')) {
        return false;
      }
      if (genderLower === 'female' && (dormGender === 'male' || dormGender === 'male_only')) {
        return false;
      }
    }
    
    // If student selected "Any" room type AND needs roommate, exclude single rooms
    const studentRoomType = student.room_type;
    if ((studentRoomType === 'Any' || !studentRoomType) && student.need_roommate) {
      if (room.type?.toLowerCase().includes('single')) {
        console.log(`[roomy-ai-core] Excluding single room "${room.name}" - student needs roommate with "Any" room type`);
        return false;
      }
    }
    
    return true;
  });

  // Score rooms
  const scoredRooms = validRooms.map((room: any) => {
    let score = 50;
    
    // Budget scoring
    if (student.budget && room.price) {
      if (room.price <= student.budget) {
        const diff = student.budget - room.price;
        const percentSaved = diff / student.budget;
        score += 20 + (percentSaved * 10); // Bonus for under budget
      } else {
        const overage = room.price - student.budget;
        const percentOver = overage / student.budget;
        score -= Math.min(30, percentOver * 50); // Penalty for over budget
      }
    }
    
    // Area preference scoring
    if (student.favorite_areas?.length > 0 && room.dorm?.area) {
      const areaMatch = student.favorite_areas.some((area: string) => 
        room.dorm.area.toLowerCase().includes(area.toLowerCase())
      );
      if (areaMatch) score += 15;
    }
    
    // University proximity scoring
    if (student.preferred_university && room.dorm?.university) {
      if (room.dorm.university.toLowerCase().includes(student.preferred_university.toLowerCase())) {
        score += 15;
      }
    }
    
    // Room type preference scoring
    if (student.preferred_room_types?.length > 0 && room.type) {
      const typeMatch = student.preferred_room_types.some((type: string) =>
        room.type.toLowerCase().includes(type.toLowerCase())
      );
      if (typeMatch) score += 10;
    }
    
    // Budget warning
    let budgetWarning = null;
    if (student.budget && room.price > student.budget) {
      budgetWarning = `$${room.price - student.budget} over your budget`;
    }

    return {
      ...room,
      type: 'room',
      dorm_name: room.dorm?.dorm_name || room.dorm?.name,
      dorm_area: room.dorm?.area,
      dorm_university: room.dorm?.university,
      score: Math.min(100, Math.max(0, score)),
      budgetWarning,
      subScores: {
        budget_score: student.budget && room.price ? (room.price <= student.budget ? 80 : 50) : 50,
        location_score: student.favorite_areas?.length > 0 ? (validRooms.some((r: any) => 
          student.favorite_areas.some((a: string) => r.dorm?.area?.toLowerCase().includes(a.toLowerCase()))
        ) ? 75 : 50) : 50,
        room_type_score: student.preferred_room_types?.length > 0 ? 70 : 50
      }
    };
  });

  return scoredRooms.sort((a: any, b: any) => b.score - a.score);
}

async function fetchRoommateMatches(
  supabase: any, 
  student: any, 
  usePersonality: boolean,
  limit: number,
  exclude_ids?: string[]
) {
  // Determine matching strategy based on student's needs
  const hasCurrentPlace = !student.needs_dorm && student.current_dorm_id;
  const seekingRoommateForCurrentPlace = student.needs_roommate_current_place && hasCurrentPlace;
  
  let query = supabase
    .from('students')
    .select('*, current_dorm:dorms!current_dorm_id(name, dorm_name, area), current_room:rooms!current_room_id(name, type, capacity, capacity_occupied)')
    .neq('id', student.id);

  // Exclude dismissed roommates
  if (exclude_ids && exclude_ids.length > 0) {
    query = query.not('id', 'in', `(${exclude_ids.join(',')})`);
  }

  // CRITICAL: Gender hard rejection - roommates must match gender
  if (student.gender) {
    query = query.ilike('gender', student.gender);
  }

  if (seekingRoommateForCurrentPlace) {
    // Prioritize candidates who need a dorm (will join student's current place)
    query = query.or('needs_dorm.eq.true,needs_roommate_new_dorm.eq.true');
    
    // Check if current room has available spots
    if (student.current_room_id) {
      const { data: currentRoom } = await supabase
        .from('rooms')
        .select('capacity, capacity_occupied, dorm_id')
        .eq('id', student.current_room_id)
        .single();
      
      // If room is full, return empty matches
      if (currentRoom && currentRoom.capacity_occupied >= currentRoom.capacity) {
        return [];
      }
      
      // Apply additional gender compatibility based on dorm policy
      const { data: currentDorm } = await supabase
        .from('dorms')
        .select('gender_preference')
        .eq('id', currentRoom.dorm_id)
        .single();
      
      if (currentDorm?.gender_preference && student.gender) {
        const genderLower = student.gender.toLowerCase();
        const dormGenderLower = currentDorm.gender_preference.toLowerCase();
        
        // Double-check gender alignment with dorm policy
        if (dormGenderLower === 'female_only' || dormGenderLower === 'female') {
          if (genderLower !== 'female') {
            return []; // Hard reject - student gender doesn't match dorm policy
          }
        } else if (dormGenderLower === 'male_only' || dormGenderLower === 'male') {
          if (genderLower !== 'male') {
            return []; // Hard reject - student gender doesn't match dorm policy
          }
        }
      }
    }
  } else {
    // Standard matching: both parties seeking roommates
    query = query.or('needs_roommate_current_place.eq.true,needs_roommate_new_dorm.eq.true');
  }

  if (student.preferred_university) {
    query = query.eq('university', student.preferred_university);
  }

  const { data, error } = await query.limit(30);
  
  if (error) throw error;

  // Calculate compatibility scores with sub-scores + dealbreaker enforcement
  const scored = (data || []).map((candidate: any) => {
    // DEALBREAKER CHECK: Hard reject if dealbreakers mismatch
    if (student.dealbreakers?.includes('smoking') && candidate.personality_smoking === 'yes') {
      console.log(`[roomy-ai-core] DEALBREAKER: Candidate ${candidate.full_name} smokes, student has smoking dealbreaker`);
      return null; // Hard reject
    }
    if (student.dealbreakers?.includes('drinking') && candidate.personality_drinking === 'yes') {
      console.log(`[roomy-ai-core] DEALBREAKER: Candidate ${candidate.full_name} drinks, student has drinking dealbreaker`);
      return null;
    }
    
    const lifestyleScore = calculateLifestyleScore(student, candidate);
    const cleanlinessScore = calculateCleanlinessScore(student, candidate);
    const studyFocusScore = calculateStudyFocusScore(student, candidate);
    
    // Calculate personality if enabled
    let personalityResult: any = null;
    if (usePersonality && student.personality_test_completed && candidate.personality_test_completed) {
      personalityResult = calculatePersonalityCompatibility(student, candidate);
    }
    
    const overallScore = usePersonality 
      ? calculateCompatibilityScore(student, candidate, true, student.ai_match_plan || 'basic')
      : Math.random() * 100;

    return {
      ...candidate,
      type: 'roommate',
      score: overallScore,
      compatibility_score: usePersonality ? overallScore : null,
      // Add confirmed room info for display
      current_room_name: candidate.room_confirmed && candidate.current_room ? candidate.current_room.name : null,
      current_dorm_name: candidate.room_confirmed && candidate.current_dorm ? (candidate.current_dorm.dorm_name || candidate.current_dorm.name) : null,
      subScores: {
        lifestyle_score: lifestyleScore,
        cleanliness_score: cleanlinessScore,
        study_focus_score: studyFocusScore,
        personality_score: personalityResult ? personalityResult.overall * 100 : null,
        personality_breakdown: personalityResult?.breakdown || null
      }
    };
  }).filter(Boolean); // Remove null rejections

  return scored.sort((a: any, b: any) => b.score - a.score).slice(0, limit);
}

function calculateDormScore(dorm: any, student: any): number {
  // Calculate sub-scores
  const locationScore = calculateLocationScore(dorm, student);
  const budgetScore = calculateBudgetScore(dorm, student);
  const roomTypeScore = calculateRoomTypeScore(dorm, student);
  const amenitiesScore = calculateAmenitiesScore(dorm, student);
  const aiHeuristicsScore = 60; // Base AI heuristics

  // Weighted average (30% location, 25% budget, 15% room, 10% amenities, 20% AI)
  const overall = 
    (locationScore * 0.30) +
    (budgetScore * 0.25) +
    (roomTypeScore * 0.15) +
    (amenitiesScore * 0.10) +
    (aiHeuristicsScore * 0.20);

  return Math.min(100, Math.round(overall));
}

function calculateLocationScore(dorm: any, student: any): number {
  let score = 50;

  // University proximity
  if (student.preferred_university && dorm.university) {
    if (dorm.university.toLowerCase().includes(student.preferred_university.toLowerCase())) {
      score += 35;
    }
  }

  // Area preference
  if (student.favorite_areas?.length > 0 && dorm.area) {
    const areaMatch = student.favorite_areas.some((area: string) => 
      dorm.area.toLowerCase().includes(area.toLowerCase())
    );
    if (areaMatch) score += 15;
  }

  return Math.min(100, score);
}

function calculateBudgetScore(dorm: any, student: any): number {
  if (!student.budget || !dorm.monthly_price) return 50;

  const diff = Math.abs(student.budget - dorm.monthly_price);
  const percentDiff = diff / student.budget;

  if (dorm.monthly_price <= student.budget) {
    // Within budget - score based on how close
    return Math.max(70, 100 - (percentDiff * 30));
  } else {
    // Over budget - penalize more
    return Math.max(20, 50 - (percentDiff * 100));
  }
}

function calculateRoomTypeScore(dorm: any, student: any): number {
  if (!student.preferred_room_types || student.preferred_room_types.length === 0) return 50;
  if (!dorm.room_types) return 50;

  const dormTypes = typeof dorm.room_types === 'string' 
    ? dorm.room_types.toLowerCase() 
    : JSON.stringify(dorm.room_types).toLowerCase();
  
  const matchCount = student.preferred_room_types.filter((type: string) =>
    dormTypes.includes(type.toLowerCase())
  ).length;

  return matchCount > 0 ? 80 + (matchCount * 10) : 40;
}

function calculateAmenitiesScore(dorm: any, student: any): number {
  if (!student.preferred_amenities || student.preferred_amenities.length === 0) return 50;
  if (!dorm.amenities || dorm.amenities.length === 0) return 30;

  const matchedAmenities = dorm.amenities.filter((amenity: string) =>
    student.preferred_amenities.some((pref: string) =>
      amenity.toLowerCase().includes(pref.toLowerCase())
    )
  );

  const matchRatio = matchedAmenities.length / student.preferred_amenities.length;
  return 40 + (matchRatio * 60);
}

function calculateCompatibilityScore(student: any, candidate: any, usePersonality: boolean = false, matchTier: string = 'basic'): number {
  // Phase 11: Enhanced Personality Matching Formula
  const lifestyleScore = calculateLifestyleScore(student, candidate);
  const cleanlinessScore = calculateCleanlinessScore(student, candidate);
  const studyFocusScore = calculateStudyFocusScore(student, candidate);
  
  // Calculate additional compatibility metrics
  const sleepScore = calculateSleepScheduleScore(
    student.personality_sleep_schedule,
    candidate.personality_sleep_schedule
  );
  const noiseScore = calculateNoiseCompatibility(
    student.personality_noise_tolerance,
    candidate.personality_noise_tolerance,
    student.personality_environment || 'moderate',
    candidate.personality_environment || 'moderate'
  );
  const socialScore = calculateSocialStyleScore(
    student.personality_introversion_extroversion,
    candidate.personality_introversion_extroversion
  );
  const petsScore = student.personality_pets === candidate.personality_pets ? 100 : 50;
  const guestsScore = Math.abs((student.personality_guest_policy || 0) - (candidate.personality_guest_policy || 0)) <= 2 ? 80 : 50;
  
  // Calculate budget closeness
  const budgetScore = student.budget && candidate.budget
    ? Math.max(0, 100 - Math.abs(student.budget - candidate.budget) / Math.max(student.budget, candidate.budget) * 100)
    : 50;
  
  // Phase 11 weights: More balanced distribution
  if (usePersonality && student.personality_test_completed && candidate.personality_test_completed) {
    // Use advanced personality-based scoring
    const overall = 
      (lifestyleScore * 0.35) +
      (cleanlinessScore * 0.20) +
      (sleepScore * 0.10) +
      (noiseScore * 0.10) +
      (socialScore * 0.10) +
      (petsScore * 0.05) +
      (guestsScore * 0.05) +
      (budgetScore * 0.05);
    
    return Math.min(100, Math.round(overall));
  } else {
    // Basic tier: simplified formula without personality
    const overall = 
      (lifestyleScore * 0.40) +
      (cleanlinessScore * 0.30) +
      (studyFocusScore * 0.20) +
      (budgetScore * 0.10);
    
    return Math.min(100, Math.round(overall));
  }
}

// New: Calculate personality compatibility with question-by-question scoring
function calculatePersonalityCompatibility(student: any, candidate: any): { overall: number, breakdown: Record<string, number> } {
  const scores: Record<string, number> = {};
  
  // Sleep schedule compatibility
  scores.sleep_schedule = calculateSleepScheduleScore(
    student.personality_sleep_schedule,
    candidate.personality_sleep_schedule
  );
  
  // Cleanliness level compatibility
  scores.cleanliness = calculatePersonalityCleanlinessScore(
    student.personality_cleanliness_level,
    candidate.personality_cleanliness_level,
    student.personality_shared_space_cleanliness_importance,
    candidate.personality_shared_space_cleanliness_importance
  );
  
  // Noise tolerance vs study environment
  scores.noise_compatibility = calculateNoiseCompatibility(
    student.personality_noise_tolerance,
    candidate.personality_noise_tolerance,
    student.personality_study_environment,
    candidate.personality_study_environment
  );
  
  // Social style (intro/extro)
  scores.social_style = calculateSocialStyleScore(
    student.personality_intro_extro,
    candidate.personality_intro_extro
  );
  
  // Smoking compatibility
  scores.smoking = calculateSmokingScore(
    student.personality_smoking,
    candidate.personality_smoking
  );
  
  // Cooking frequency similarity
  scores.cooking = calculateCookingScore(
    student.personality_cooking_frequency,
    candidate.personality_cooking_frequency
  );
  
  // Sleep sensitivity
  scores.sleep_sensitivity = calculateSleepSensitivityScore(
    student.personality_sleep_sensitivity,
    candidate.personality_sleep_sensitivity
  );
  
  // Study time compatibility
  scores.study = calculateStudyTimeScore(
    student.personality_study_time,
    candidate.personality_study_time
  );
  
  // Calculate overall as average of all scores
  const validScores = Object.values(scores).filter(s => !isNaN(s));
  const overall = validScores.length > 0 
    ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
    : 0.5;
  
  return { overall, breakdown: scores };
}

// Question-by-question scoring functions
function calculateSleepScheduleScore(s1: string, s2: string): number {
  if (!s1 || !s2) return 0.5;
  if (s1 === s2) return 1.0; // Exact match
  
  const order = ['early', 'regular', 'late'];
  const i1 = order.indexOf(s1);
  const i2 = order.indexOf(s2);
  
  if (i1 === -1 || i2 === -1) return 0.5;
  
  const diff = Math.abs(i1 - i2);
  if (diff === 1) return 0.6; // One step difference
  if (diff === 2) return 0.2; // Opposites
  return 0.5;
}

function calculatePersonalityCleanlinessScore(c1: string, c2: string, imp1: number, imp2: number): number {
  if (!c1 || !c2) return 0.5;
  if (c1 === c2) return 1.0; // Same level
  
  const order = ['messy', 'average', 'clean', 'very_clean'];
  const i1 = order.indexOf(c1);
  const i2 = order.indexOf(c2);
  
  if (i1 === -1 || i2 === -1) return 0.5;
  
  const diff = Math.abs(i1 - i2);
  let baseScore = 0.5;
  
  if (diff === 1) baseScore = 0.6; // One step difference
  else if (diff === 2) baseScore = 0.3;
  else if (diff === 3) baseScore = 0; // Clean with messy = conflict
  
  // Adjust by importance
  const avgImportance = ((imp1 || 3) + (imp2 || 3)) / 2;
  const importanceMultiplier = avgImportance / 5; // Higher importance = weight differences more
  
  return baseScore * (1 + importanceMultiplier * 0.3);
}

function calculateNoiseCompatibility(n1: string, n2: string, env1: string, env2: string): number {
  if (!n1 || !n2) return 0.5;
  
  const noiseOrder = ['very_quiet', 'quiet', 'normal', 'loud'];
  const envOrder = ['silent', 'quiet', 'moderate_noise', 'flexible'];
  
  const nIdx1 = noiseOrder.indexOf(n1);
  const nIdx2 = noiseOrder.indexOf(n2);
  
  if (nIdx1 === -1 || nIdx2 === -1) return 0.5;
  
  const noiseDiff = Math.abs(nIdx1 - nIdx2);
  
  // Compatible if similar noise tolerance
  if (noiseDiff === 0) return 1.0;
  if (noiseDiff === 1) return 0.7;
  if (noiseDiff === 2) return 0.4;
  return 0.2; // Very different
}

function calculateSocialStyleScore(s1: string, s2: string): number {
  if (!s1 || !s2) return 0.5;
  if (s1 === s2) return 1.0; // Same type
  
  // Ambivert pairs well with anyone
  if (s1 === 'ambivert' || s2 === 'ambivert') return 0.7;
  
  // Intro + Extro = less compatible
  if ((s1 === 'introvert' && s2 === 'extrovert') || 
      (s1 === 'extrovert' && s2 === 'introvert')) {
    return 0.3;
  }
  
  return 0.5;
}

function calculateSmokingScore(sm1: string, sm2: string): number {
  if (!sm1 || !sm2) return 0.5;
  
  // Both non-smokers = perfect
  if (sm1 === 'no' && sm2 === 'no') return 1.0;
  
  // One smoker = incompatible
  return 0;
}

function calculateCookingScore(c1: string, c2: string): number {
  if (!c1 || !c2) return 0.5;
  if (c1 === c2) return 1.0;
  
  const order = ['never', 'rarely', 'sometimes', 'often'];
  const i1 = order.indexOf(c1);
  const i2 = order.indexOf(c2);
  
  if (i1 === -1 || i2 === -1) return 0.5;
  
  const diff = Math.abs(i1 - i2);
  if (diff === 1) return 0.7;
  if (diff === 2) return 0.5;
  return 0.3;
}

function calculateSleepSensitivityScore(s1: string, s2: string): number {
  if (!s1 || !s2) return 0.5;
  
  const order = ['heavy', 'normal', 'light', 'very_light'];
  const i1 = order.indexOf(s1);
  const i2 = order.indexOf(s2);
  
  if (i1 === -1 || i2 === -1) return 0.5;
  
  // If one is very light sleeper and other is not, potential issues
  if ((s1 === 'very_light' && s2 === 'heavy') || 
      (s1 === 'heavy' && s2 === 'very_light')) {
    return 0.3;
  }
  
  const diff = Math.abs(i1 - i2);
  if (diff === 0) return 1.0;
  if (diff === 1) return 0.7;
  if (diff === 2) return 0.5;
  return 0.3;
}

function calculateStudyTimeScore(t1: string, t2: string): number {
  if (!t1 || !t2) return 0.5;
  if (t1 === t2) return 1.0;
  
  // Similar study times are better
  const order = ['morning', 'afternoon', 'evening', 'late_night'];
  const i1 = order.indexOf(t1);
  const i2 = order.indexOf(t2);
  
  if (i1 === -1 || i2 === -1) return 0.5;
  
  const diff = Math.abs(i1 - i2);
  if (diff === 1) return 0.7;
  if (diff === 2) return 0.5;
  return 0.4; // Morning vs late night
}

function calculateLifestyleScore(student: any, candidate: any): number {
  let score = 50;

  // Sleep schedule similarity (habit_noise as proxy)
  if (student.habit_noise && candidate.habit_noise) {
    const diff = Math.abs(student.habit_noise - candidate.habit_noise);
    score += 20 * (1 - diff / 5);
  }

  // Social habits (habit_social)
  if (student.habit_social && candidate.habit_social) {
    const diff = Math.abs(student.habit_social - candidate.habit_social);
    score += 15 * (1 - diff / 5);
  }

  // Budget similarity
  if (student.budget && candidate.budget) {
    const budgetDiff = Math.abs(student.budget - candidate.budget);
    score += 15 * (1 - Math.min(budgetDiff / student.budget, 1));
  }

  return Math.min(100, score);
}

function calculateCleanlinessScore(student: any, candidate: any): number {
  if (!student.habit_cleanliness || !candidate.habit_cleanliness) return 50;

  const diff = Math.abs(student.habit_cleanliness - candidate.habit_cleanliness);
  const score = 100 - (diff * 20); // Each point diff = -20
  return Math.max(30, score);
}

function calculateStudyFocusScore(student: any, candidate: any): number {
  let score = 50;

  // University match (strong indicator of study compatibility)
  if (student.university === candidate.university) {
    score += 30;
  }

  // Year of study similarity
  if (student.year_of_study && candidate.year_of_study) {
    const yearDiff = Math.abs(student.year_of_study - candidate.year_of_study);
    score += 20 * (1 - Math.min(yearDiff / 4, 1));
  }

  return Math.min(100, score);
}

async function enhanceWithGemini(
  matches: any[],
  student: any,
  mode: string,
  usePersonality: boolean,
  apiKey: string
) {
  const topMatches = matches.slice(0, 10);
  
  // Skip AI if no matches - prevent hallucinations
  if (topMatches.length === 0) {
    return {
      rankedMatches: [],
      insights: ''
    };
  }
  
  // Enhanced prompt with sub-scores - handle each mode explicitly
  let prompt = '';
  
  if (mode === 'rooms') {
    // ROOMS MODE - Generate room-specific insights
    const roomMatches = topMatches.filter(m => m.type === 'room');
    const roomDetails = roomMatches.map(m => 
      `${m.name || m.type || 'Room'} at ${m.dorm_name} ($${m.price}/month, ${m.dorm_area || 'Area N/A'})`
    ).join('\n- ');
    
    prompt = `Analyze these room matches for a Lebanese student:
Budget: $${student.budget}, Near: ${student.preferred_university}

Top room matches:
- ${roomDetails}

Write 1-2 warm, concise sentences about these ROOM matches. Focus on price, location, and room availability. DO NOT mention roommates or invent any names.`;
  } else if (mode === 'dorm' || mode === 'combined') {
    const dormMatches = topMatches.filter(m => m.type === 'dorm');
    const dormDetails = dormMatches.map(m => 
      `${m.dorm_name || m.name} (Score: ${m.score}%, Location: ${m.subScores?.location_score}%, Budget fit: ${m.subScores?.budget_score}%, Room type: ${m.subScores?.room_type_score}%)`
    ).join('\n- ');
    
    prompt = `Analyze these dorm matches for a Lebanese student:
Budget: $${student.budget}, Near: ${student.preferred_university}, Areas: ${student.favorite_areas?.join(', ') || 'Any'}

Top matches with scores:
- ${dormDetails}

Write 1-2 warm, concise sentences explaining why these are good matches. Be specific about budget, location, or room type when relevant. DO NOT mention roommates or invent any names.`;
  } else {
    // ROOMMATE MODE
    const roommateMatches = topMatches.filter(m => m.type === 'roommate');
    const roommateDetails = roommateMatches.map(m => 
      `${m.full_name} (Score: ${m.score}%, Lifestyle: ${m.subScores?.lifestyle_score}%, Study habits: ${m.subScores?.study_focus_score}%, Cleanliness: ${m.subScores?.cleanliness_score}%)`
    ).join('\n- ');
    
    prompt = `Analyze roommate compatibility for a student at ${student.university}:
${usePersonality ? 'Using personality matching enabled.' : 'Basic preference matching only - DO NOT mention personality traits.'}

Top matches:
- ${roommateDetails}

Write 1-2 warm sentences about compatibility. ${usePersonality 
  ? 'Mention lifestyle traits like sleep schedule or study style.' 
  : 'Focus ONLY on preferences like university and budget. DO NOT mention personality scores or traits.'}
ONLY use names from the matches above. NEVER invent or fabricate names.`;
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are Roomy AI, a friendly Lebanese housing assistant. Be warm, concise, and specific. CRITICAL: NEVER invent or fabricate names. ONLY mention data explicitly provided. If no matches provided, say 'Looking for options...' Do not create fictional people." 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      throw new Error("Gemini API error");
    }

    const data = await response.json();
    const insights = data.choices?.[0]?.message?.content || "Great matches found based on your preferences!";

    // Add detailed reasoning to each match
    const rankedMatches = topMatches.map((match) => {
      let reasoning = '';
      
      if (match.type === 'dorm') {
        const reasons = [];
        if (match.subScores?.budget_score >= 80) reasons.push('within budget');
        if (match.subScores?.location_score >= 80) reasons.push('great location');
        if (match.subScores?.room_type_score >= 80) reasons.push('preferred room type');
        reasoning = reasons.length > 0 
          ? `Great match: ${reasons.join(', ')}`
          : `Fits your location and budget preferences`;
      } else {
        const reasons = [];
        if (match.subScores?.lifestyle_score >= 80) reasons.push('similar lifestyle');
        if (match.subScores?.study_focus_score >= 80) reasons.push('compatible study habits');
        if (match.subScores?.cleanliness_score >= 80) reasons.push('matching cleanliness standards');
        reasoning = reasons.length > 0
          ? `Compatible: ${reasons.join(', ')}`
          : 'Matches your university and preferences';
      }
      
      return {
        ...match,
        reasoning
      };
    });

    return { rankedMatches, insights };
  } catch (error) {
    console.error('Gemini enhancement failed:', error);
    return {
      rankedMatches: topMatches.map(m => ({
        ...m,
        reasoning: m.type === 'dorm' 
          ? 'Matches your preferences' 
          : 'Compatible lifestyle and habits'
      })),
      insights: 'AI insights are currently unavailable, but we still found matches based on your preferences.'
    };
  }
}
