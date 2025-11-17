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

  try {
    const { dormId, dormName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch dorm details to personalize questions
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: dorm } = await supabase
      .from("dorms")
      .select("*")
      .eq("id", dormId)
      .maybeSingle();

    // Generate AI tour questions using Lovable AI
    const prompt = `You are a helpful assistant for Lebanese university students looking for dorms. 

Generate 5-7 specific, practical questions a student should ask during a virtual tour of this dorm:

Dorm Name: ${dormName}
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
      console.error("AI gateway error:", response.status, await response.text());
      // Return default questions if AI fails
      return new Response(
        JSON.stringify({
          questions: [
            "What is the WiFi speed and reliability?",
            "Are utilities (water, electricity) included in the rent?",
            "What are the quiet hours and house rules?",
            "Is there 24/7 security or access control?",
            "How quickly are maintenance issues addressed?",
            "What is the policy on guests and visitors?",
            "Are there laundry facilities on-site?",
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the AI response
    let questions;
    try {
      questions = JSON.parse(content);
    } catch {
      // If AI didn't return valid JSON, extract questions from text
      questions = [
        "What is the WiFi speed and reliability?",
        "Are utilities included in the rent?",
        "What are the quiet hours?",
        "Is there security on-site?",
        "How is the maintenance handled?",
      ];
    }

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating tour questions:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        questions: [
          "What is the WiFi speed like?",
          "Are utilities included in the rent?",
          "What are the quiet hours?",
          "Is there a security deposit required?",
          "How is the water pressure?",
        ]
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
