import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter (5 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return true;
  }
  
  entry.count++;
  return false;
}

// Validate UUID format
function isValidUUID(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Sanitize string input
function sanitizeString(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str.slice(0, 200).replace(/[<>'"]/g, '');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    if (isRateLimited(clientIP)) {
      console.warn(`[generate-tour-questions] Rate limit exceeded for IP: ${clientIP.slice(0, 10)}...`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } 
        }
      );
    }

    const body = await req.json();
    const dormId = body?.dormId;
    const dormName = sanitizeString(body?.dormName);

    // Input validation
    if (!dormId || !isValidUUID(dormId)) {
      console.warn(`[generate-tour-questions] Invalid dormId provided`);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request",
          questions: getDefaultQuestions()
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("[generate-tour-questions] LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ questions: getDefaultQuestions() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch dorm details to personalize questions
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: dorm, error: dormError } = await supabase
      .from("dorms")
      .select("area, university, amenities, monthly_price")
      .eq("id", dormId)
      .maybeSingle();

    if (dormError) {
      console.error("[generate-tour-questions] Error fetching dorm:", dormError.message);
    }

    // Generate AI tour questions using Lovable AI
    const prompt = `You are a helpful assistant for Lebanese university students looking for dorms. 

Generate 5-7 specific, practical questions a student should ask during a virtual tour of this dorm:

Dorm Name: ${dormName || 'Unknown'}
${dorm?.area ? `Area: ${dorm.area}` : ""}
${dorm?.university ? `Near: ${dorm.university}` : ""}
${dorm?.amenities ? `Amenities: ${dorm.amenities.join(", ")}` : ""}
${dorm?.monthly_price ? `Price: $${dorm.monthly_price}/month` : ""}

Generate questions about:
- Practical living concerns (WiFi, water, electricity, heating/cooling)
- Safety and security
- Social environment and noise levels
- Maintenance and cleanliness standards
- Nearby facilities and transportation

Return ONLY a JSON array of strings, nothing else. Format: ["question 1", "question 2", ...]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a helpful assistant that generates practical questions for dorm tours. Always respond with valid JSON arrays only." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error("[generate-tour-questions] AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ questions: getDefaultQuestions() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the AI response
    let questions;
    try {
      questions = JSON.parse(content);
      if (!Array.isArray(questions)) {
        throw new Error("Response is not an array");
      }
    } catch {
      console.warn("[generate-tour-questions] Failed to parse AI response, using defaults");
      questions = getDefaultQuestions();
    }

    console.log(`[generate-tour-questions] Generated ${questions.length} questions for dorm ${dormId.slice(0, 8)}...`);

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[generate-tour-questions] Error:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ 
        error: "An error occurred",
        questions: getDefaultQuestions()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getDefaultQuestions(): string[] {
  return [
    "What is the WiFi speed and reliability?",
    "Are utilities (water, electricity) included in the rent?",
    "What are the quiet hours and house rules?",
    "Is there 24/7 security or access control?",
    "How quickly are maintenance issues addressed?",
    "What is the policy on guests and visitors?",
    "Are there laundry facilities on-site?",
  ];
}
