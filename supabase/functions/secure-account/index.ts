import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find device by token
    const { data: device, error: findError } = await supabase
      .from("user_devices")
      .select("*")
      .eq("verification_token", token)
      .single();

    if (findError || !device) {
      console.error("Device not found:", findError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token", code: "INVALID_TOKEN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = device.user_id;

    // 1. Revoke ALL sessions for this user
    const { error: signOutError } = await supabase.auth.admin.signOut(userId, "global");
    
    if (signOutError) {
      console.error("Error revoking sessions:", signOutError);
    }

    // 2. Delete ALL devices for this user
    const { error: deleteError } = await supabase
      .from("user_devices")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting devices:", deleteError);
    }

    // 3. Log security event to device_security_logs
    await supabase.from("device_security_logs").insert({
      user_id: userId,
      event_type: "all_sessions_revoked",
      device_fingerprint: device.fingerprint_hash,
      ip_region: device.ip_region,
      metadata: { 
        reason: "User denied suspicious device",
        suspicious_device: device.device_name 
      }
    });

    // 4. Log device denied event
    await supabase.from("device_security_logs").insert({
      user_id: userId,
      event_type: "device_denied",
      device_fingerprint: device.fingerprint_hash,
      ip_region: device.ip_region,
      metadata: { device_name: device.device_name }
    });

    // 5. Log to centralized security_events table for monitoring
    await supabase.from("security_events").insert({
      event_type: "all_sessions_revoked",
      user_id: userId,
      ip_region: device.ip_region,
      details: { 
        reason: "User denied suspicious device",
        suspicious_device: device.device_name,
        device_fingerprint: device.fingerprint_hash
      },
      severity: "critical"
    });

    await supabase.from("security_events").insert({
      event_type: "device_denied",
      user_id: userId,
      ip_region: device.ip_region,
      details: { device_name: device.device_name },
      severity: "warning"
    });

    console.log(`Account secured for user ${userId} - all sessions revoked`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "All sessions have been revoked and devices removed.",
        requirePasswordReset: true 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in secure-account:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
