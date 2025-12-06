import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 3; // max requests per window (stricter for security endpoint)
const RATE_WINDOW_MS = 60 * 1000; // 1 minute window

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         req.headers.get("x-real-ip") ||
         "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }
  
  record.count++;
  if (record.count > RATE_LIMIT) {
    return true;
  }
  return false;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check (stricter for security endpoint)
  const clientIP = getClientIP(req);
  if (isRateLimited(clientIP)) {
    console.warn(`[secure-account] Rate limit exceeded for IP: ${clientIP.substring(0, 10)}...`);
    
    // Log rate limit event (fire and forget)
    const supabaseForLog = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    supabaseForLog.from("security_events").insert({
      event_type: "rate_limit_exceeded",
      details: { 
        function: "secure-account", 
        ip_partial: clientIP.substring(0, 10) + "..." 
      },
      severity: "warning"
    });
    
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
