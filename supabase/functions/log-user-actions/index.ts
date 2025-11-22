// Deno Edge Function: log analytics events (views, favorites, inquiries, chat)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  console.log('[log-user-actions] Request received');
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error('[log-user-actions] No authorization header');
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { ...cors, "Content-Type": "application/json" } 
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('[log-user-actions] Invalid token:', authError);
      return new Response(JSON.stringify({ error: "Invalid token" }), { 
        status: 401, 
        headers: { ...cors, "Content-Type": "application/json" } 
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    console.log('[log-user-actions] Body parsed:', { type: body?.type, user_id: body?.user_id, dorm_id: body?.dorm_id });
    const { type, user_id = null, dorm_id = null, meta = {} } = body ?? {};
    if (!type) {
      console.error('[log-user-actions] Missing type');
      return new Response(JSON.stringify({ error: "Missing type" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Validate that user_id matches authenticated user if provided
    if (user_id && user_id !== user.id) {
      console.error('[log-user-actions] User ID mismatch');
      return new Response(JSON.stringify({ error: "User ID mismatch" }), { 
        status: 403, 
        headers: { ...cors, "Content-Type": "application/json" } 
      });
    }

    // Use authenticated user's ID
    const validatedUserId = user.id;

    const { error } = await supabase.from("analytics_events").insert([{ type, user_id: validatedUserId, dorm_id, meta }]);
    if (error) {
      console.error('[log-user-actions] Insert error:', error);
      throw error;
    }

    console.log('[log-user-actions] Event logged successfully');
    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error('[log-user-actions] Error:', e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
