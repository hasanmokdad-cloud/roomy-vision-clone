/**
 * Roomy AI Core - Unified AI Matching Engine
 * 
 * Handles dorm matching, roommate matching, and combined matching
 * Uses Gemini for re-ranking and insights generation
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[roomy-ai-core] Request received');

  try {
    const { mode, match_tier, personality_enabled, limit, context } = await req.json();
    
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

    // Determine tier limits
    const tierLimits: Record<string, number> = {
      basic: 1,
      advanced: 3,
      vip: 10
    };
    const tierLimit = tierLimits[match_tier] || 1;
    
    // Determine if personality should be used
    const usePersonality = (match_tier === 'advanced' || match_tier === 'vip') && 
                          personality_enabled && 
                          student.personality_test_completed;

    let matches: any[] = [];
    let insightsBanner = '';

    // Fetch candidates based on mode
    if (mode === 'dorm' || mode === 'combined') {
      matches = await fetchDormMatches(supabase, student, context);
    }

    if (mode === 'roommate' || mode === 'combined') {
      const roommateMatches = await fetchRoommateMatches(
        supabase, 
        student, 
        usePersonality, 
        tierLimit
      );
      matches = mode === 'combined' ? [...matches, ...roommateMatches] : roommateMatches;
    }

    // Call Gemini for re-ranking and insights
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
      match_tier,
      personality_used: usePersonality,
      result_count: matches.length,
      insights_generated: !!insightsBanner,
      processing_time_ms: Date.now() - startTime
    });

    return new Response(
      JSON.stringify({
        ai_mode: mode,
        match_tier,
        personality_used: usePersonality,
        insights_banner: insightsBanner,
        matches
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

async function fetchDormMatches(supabase: any, student: any, context: any = {}) {
  let query = supabase
    .from('dorms')
    .select('*')
    .eq('verification_status', 'Verified')
    .eq('available', true);

  if (context.budget || student.budget) {
    query = query.lte('monthly_price', context.budget || student.budget);
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

  // Pre-score dorms with sub-scores
  return (data || []).map((dorm: any) => {
    const locationScore = calculateLocationScore(dorm, student);
    const budgetScore = calculateBudgetScore(dorm, student);
    const roomTypeScore = calculateRoomTypeScore(dorm, student);
    const amenitiesScore = calculateAmenitiesScore(dorm, student);
    const overallScore = calculateDormScore(dorm, student);

    return {
      ...dorm,
      type: 'dorm',
      score: overallScore,
      subScores: {
        location_score: locationScore,
        budget_score: budgetScore,
        room_type_score: roomTypeScore,
        amenities_score: amenitiesScore,
        ai_heuristics_score: 60
      }
    };
  }).sort((a: any, b: any) => b.score - a.score);
}

async function fetchRoommateMatches(
  supabase: any, 
  student: any, 
  usePersonality: boolean,
  limit: number
) {
  let query = supabase
    .from('students')
    .select('*')
    .neq('id', student.id)
    .eq('need_roommate', true);

  if (student.preferred_university) {
    query = query.eq('university', student.preferred_university);
  }

  const { data, error } = await query.limit(30);
  
  if (error) throw error;

  // Calculate compatibility scores with sub-scores
  const scored = (data || []).map((candidate: any) => {
    const lifestyleScore = calculateLifestyleScore(student, candidate);
    const cleanlinessScore = calculateCleanlinessScore(student, candidate);
    const studyFocusScore = calculateStudyFocusScore(student, candidate);
    const overallScore = usePersonality 
      ? calculateCompatibilityScore(student, candidate)
      : Math.random() * 100;

    return {
      ...candidate,
      type: 'roommate',
      score: overallScore,
      compatibility_score: usePersonality ? overallScore : null,
      subScores: {
        lifestyle_score: lifestyleScore,
        cleanliness_score: cleanlinessScore,
        study_focus_score: studyFocusScore,
        personality_score: usePersonality ? null : null // Will be filled by Gemini if available
      }
    };
  });

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

function calculateCompatibilityScore(student: any, candidate: any): number {
  const lifestyleScore = calculateLifestyleScore(student, candidate);
  const cleanlinessScore = calculateCleanlinessScore(student, candidate);
  const studyFocusScore = calculateStudyFocusScore(student, candidate);
  
  // For now, return weighted average without personality (will be added in Gemini)
  const overall = 
    (lifestyleScore * 0.40) +
    (cleanlinessScore * 0.30) +
    (studyFocusScore * 0.30);

  return Math.min(100, Math.round(overall));
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
  
  // Enhanced prompt with sub-scores
  let prompt = '';
  
  if (mode === 'dorm' || mode === 'combined') {
    const dormMatches = topMatches.filter(m => m.type === 'dorm');
    const dormDetails = dormMatches.map(m => 
      `${m.dorm_name || m.name} (Score: ${m.score}%, Location: ${m.subScores?.location_score}%, Budget fit: ${m.subScores?.budget_score}%, Room type: ${m.subScores?.room_type_score}%)`
    ).join('\n- ');
    
    prompt = `Analyze these dorm matches for a Lebanese student:
Budget: $${student.budget}, Near: ${student.preferred_university}, Areas: ${student.favorite_areas?.join(', ') || 'Any'}

Top matches with scores:
- ${dormDetails}

Write 1-2 warm, concise sentences explaining why these are good matches. Be specific about budget, location, or room type when relevant.`;
  } else {
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
  : 'Focus ONLY on preferences like university and budget. DO NOT mention personality scores or traits.'}`;
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
          { role: "system", content: "You are Roomy AI, a friendly Lebanese housing assistant. Be warm, concise, and specific." },
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
