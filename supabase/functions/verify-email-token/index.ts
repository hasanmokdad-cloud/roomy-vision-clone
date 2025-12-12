import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, type = 'signup' } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing token", valid: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the token
    const { data: tokenRecord, error: lookupError } = await supabaseAdmin
      .from("email_verification_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (lookupError || !tokenRecord) {
      console.error("[verify-email-token] Token not found:", token);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token", valid: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is already used
    if (tokenRecord.used_at) {
      return new Response(
        JSON.stringify({ error: "Token already used", valid: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Token has expired", valid: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark token as used
    await supabaseAdmin
      .from("email_verification_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenRecord.id);

    // For signup verification, update the user's email_confirmed_at
    if (type === 'signup' || tokenRecord.token_type === 'signup') {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        tokenRecord.user_id,
        { email_confirm: true }
      );

      if (updateError) {
        console.error("[verify-email-token] Failed to confirm email:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to verify email", valid: false }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[verify-email-token] Email verified for user: ${tokenRecord.user_id}`);
    }

    return new Response(
      JSON.stringify({ 
        valid: true, 
        userId: tokenRecord.user_id,
        email: tokenRecord.email,
        tokenType: tokenRecord.token_type
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[verify-email-token] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message, valid: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
