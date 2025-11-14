// Deno Edge Function: placeholder "trainer" — aggregates simple engagement weights per dorm.
// You can cron this daily via Supabase Scheduler.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  console.log('[train-recommender] Request received');
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('[train-recommender] Recomputing engagement scores');
    // Example: recompute a lightweight score per dorm from analytics_events
    const { data, error } = await supabase.rpc("recompute_dorm_engagement_scores");
    if (error) {
      console.error('[train-recommender] RPC error:', error);
      throw error;
    }

    console.log('[train-recommender] Scores recomputed, updated:', data?.length ?? 0);
    return new Response(JSON.stringify({ ok: true, updated: data?.length ?? 0 }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error('[train-recommender] Error:', e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
