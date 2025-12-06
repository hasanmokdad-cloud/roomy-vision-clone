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
        JSON.stringify({ error: "Missing verification token" }),
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
        JSON.stringify({ error: "Invalid or expired verification token", code: "INVALID_TOKEN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token expired
    const now = new Date();
    const expiresAt = new Date(device.verification_expires_at);
    
    if (expiresAt < now) {
      // Log failed verification attempt
      await supabase.from("security_events").insert({
        event_type: "device_verification_failed",
        user_id: device.user_id,
        ip_region: device.ip_region,
        details: { reason: "expired_token", device_name: device.device_name },
        severity: "warning"
      });
      
      return new Response(
        JSON.stringify({ error: "Verification link has expired. Please log in again to receive a new link.", code: "EXPIRED_TOKEN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark device as verified
    const { error: updateError } = await supabase
      .from("user_devices")
      .update({
        is_verified: true,
        is_current: true,
        verification_token: null,
        verification_expires_at: null,
        last_used_at: new Date().toISOString()
      })
      .eq("id", device.id);

    if (updateError) {
      console.error("Error updating device:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to verify device" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set other devices as not current
    await supabase
      .from("user_devices")
      .update({ is_current: false })
      .eq("user_id", device.user_id)
      .neq("id", device.id);

    // Log security event to device_security_logs
    await supabase.from("device_security_logs").insert({
      user_id: device.user_id,
      event_type: "device_verified",
      device_fingerprint: device.fingerprint_hash,
      ip_region: device.ip_region,
      metadata: { device_name: device.device_name }
    });

    // Log to centralized security_events table for monitoring
    await supabase.from("security_events").insert({
      event_type: "device_verified",
      user_id: device.user_id,
      ip_region: device.ip_region,
      details: { device_name: device.device_name, device_id: device.id },
      severity: "info"
    });

    console.log(`Device verified for user ${device.user_id}: ${device.device_name}`);

    // Get the user's email to generate magic link for auto-login
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(device.user_id);
    
    let autoLoginUrl = null;
    
    if (!userError && userData?.user?.email) {
      // Generate a magic link for auto-login
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: userData.user.email,
        options: {
          redirectTo: "https://roomylb.com/auth/callback"
        }
      });

      if (!linkError && linkData?.properties?.action_link) {
        autoLoginUrl = linkData.properties.action_link;
        console.log(`Generated auto-login URL for user ${device.user_id}`);
      } else {
        console.error("Failed to generate magic link:", linkError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        deviceName: device.device_name,
        userId: device.user_id,
        autoLoginUrl
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in confirm-device:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
