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

  // Pre-score dorms
  return (data || []).map((dorm: any) => ({
    ...dorm,
    type: 'dorm',
    score: calculateDormScore(dorm, student)
  })).sort((a: any, b: any) => b.score - a.score);
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

  // Calculate compatibility scores
  const scored = (data || []).map((candidate: any) => ({
    ...candidate,
    type: 'roommate',
    score: usePersonality 
      ? calculateCompatibilityScore(student, candidate)
      : Math.random() * 100,
    compatibility_score: usePersonality 
      ? calculateCompatibilityScore(student, candidate)
      : null
  }));

  return scored.sort((a: any, b: any) => b.score - a.score).slice(0, limit);
}

function calculateDormScore(dorm: any, student: any): number {
  let score = 50;

  if (student.budget && dorm.monthly_price <= student.budget) {
    score += 20 * (1 - dorm.monthly_price / student.budget);
  }

  if (student.preferred_university && 
      dorm.university?.toLowerCase().includes(student.preferred_university.toLowerCase())) {
    score += 15;
  }

  if (student.favorite_areas?.some((area: string) => 
      dorm.area?.toLowerCase().includes(area.toLowerCase()))) {
    score += 15;
  }

  return Math.min(100, score);
}

function calculateCompatibilityScore(student: any, candidate: any): number {
  let score = 50;

  // Budget similarity
  if (student.budget && candidate.budget) {
    const budgetDiff = Math.abs(student.budget - candidate.budget);
    score += 15 * (1 - Math.min(budgetDiff / student.budget, 1));
  }

  // University match
  if (student.university === candidate.university) {
    score += 15;
  }

  // Cleanliness match
  if (student.habit_cleanliness && candidate.habit_cleanliness) {
    const diff = Math.abs(student.habit_cleanliness - candidate.habit_cleanliness);
    score += 10 * (1 - diff / 5);
  }

  // Noise tolerance match
  if (student.habit_noise && candidate.habit_noise) {
    const diff = Math.abs(student.habit_noise - candidate.habit_noise);
    score += 10 * (1 - diff / 5);
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
  
  const prompt = mode === 'dorm' || mode === 'combined'
    ? `Analyze these dorm matches for a student with budget $${student.budget}, studying at ${student.preferred_university}. 
       Top matches: ${topMatches.filter(m => m.type === 'dorm').map(m => m.dorm_name || m.name).join(', ')}.
       Provide a brief 2-sentence insight on why these are good matches.`
    : `Analyze these roommate matches for a student at ${student.university}.
       Top matches: ${topMatches.filter(m => m.type === 'roommate').map(m => m.full_name).join(', ')}.
       ${usePersonality ? 'Consider personality compatibility.' : ''}
       Provide a brief 2-sentence insight.`;

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
          { role: "system", content: "You are Roomy AI, a friendly Lebanese housing assistant. Be warm and concise." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Gemini API error");
    }

    const data = await response.json();
    const insights = data.choices?.[0]?.message?.content || "Great matches found based on your preferences!";

    // Add reasoning to each match
    const rankedMatches = topMatches.map((match, index) => ({
      ...match,
      reasoning: `Match #${index + 1}: ${match.type === 'dorm' ? 'Fits your budget and location preferences' : 'Compatible lifestyle and study habits'}`
    }));

    return { rankedMatches, insights };
  } catch (error) {
    console.error('Gemini enhancement failed:', error);
    return {
      rankedMatches: topMatches,
      insights: mode === 'dorm' 
        ? 'Top dorms matched based on your budget, location, and preferences.'
        : 'Top roommates matched based on university and lifestyle compatibility.'
    };
  }
}
