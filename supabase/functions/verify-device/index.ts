import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeviceVerifyRequest {
  userId: string;
  fingerprintHash: string;
  deviceName: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceType?: string;
  ipRegion?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: DeviceVerifyRequest = await req.json();
    const { userId, fingerprintHash, deviceName, browserName, browserVersion, osName, osVersion, deviceType, ipRegion } = body;

    if (!userId || !fingerprintHash) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limiting - max 5 new device attempts per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentAttempts } = await supabase
      .from("device_security_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_type", "new_device_detected")
      .gte("created_at", oneHourAgo);

    if ((recentAttempts || 0) >= 5) {
      // Log rate limit exceeded
      await supabase.from("device_security_logs").insert({
        user_id: userId,
        event_type: "rate_limit_exceeded",
        device_fingerprint: fingerprintHash,
        ip_region: ipRegion,
        metadata: { reason: "Too many new device attempts" }
      });

      return new Response(
        JSON.stringify({ 
          error: "Too many login attempts from new devices. Please try again later.",
          rateLimited: true 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if device exists
    const { data: existingDevice } = await supabase
      .from("user_devices")
      .select("*")
      .eq("user_id", userId)
      .eq("fingerprint_hash", fingerprintHash)
      .single();

    if (existingDevice) {
      if (existingDevice.is_verified) {
        // Known & verified device - update last_used and allow login
        await supabase
          .from("user_devices")
          .update({ 
            last_used_at: new Date().toISOString(),
            is_current: true 
          })
          .eq("id", existingDevice.id);

        // Set other devices as not current
        await supabase
          .from("user_devices")
          .update({ is_current: false })
          .eq("user_id", userId)
          .neq("id", existingDevice.id);

        return new Response(
          JSON.stringify({ needsVerification: false, deviceId: existingDevice.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Device exists but not verified - check if token is still valid
        const now = new Date();
        const expiresAt = existingDevice.verification_expires_at ? new Date(existingDevice.verification_expires_at) : null;
        
        if (expiresAt && expiresAt > now) {
          // Token still valid, just return needs verification
          return new Response(
            JSON.stringify({ 
              needsVerification: true, 
              message: "Please check your email to verify this device.",
              deviceId: existingDevice.id 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Token expired, generate new one
        const verificationToken = crypto.randomUUID();
        const verificationExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 mins

        await supabase
          .from("user_devices")
          .update({ 
            verification_token: verificationToken,
            verification_expires_at: verificationExpiresAt
          })
          .eq("id", existingDevice.id);

        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const userEmail = userData?.user?.email;

        if (userEmail) {
          // Send verification email
          await supabase.functions.invoke("send-device-email", {
            body: {
              email: userEmail,
              deviceName,
              ipRegion: ipRegion || "Unknown",
              verificationToken,
              userId
            }
          });
        }

        return new Response(
          JSON.stringify({ 
            needsVerification: true, 
            message: "A new verification email has been sent.",
            deviceId: existingDevice.id 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // New device detected - create record and send verification email
    const verificationToken = crypto.randomUUID();
    const verificationExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 mins

    const { data: newDevice, error: insertError } = await supabase
      .from("user_devices")
      .insert({
        user_id: userId,
        fingerprint_hash: fingerprintHash,
        device_name: deviceName,
        browser_name: browserName,
        browser_version: browserVersion,
        os_name: osName,
        os_version: osVersion,
        device_type: deviceType,
        ip_region: ipRegion,
        is_verified: false,
        verification_token: verificationToken,
        verification_expires_at: verificationExpiresAt
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting device:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to register device" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log security event
    await supabase.from("device_security_logs").insert({
      user_id: userId,
      event_type: "new_device_detected",
      device_fingerprint: fingerprintHash,
      ip_region: ipRegion,
      metadata: { device_name: deviceName, browser: browserName, os: osName }
    });

    // Get user email and send verification
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email;

    if (userEmail) {
      await supabase.functions.invoke("send-device-email", {
        body: {
          email: userEmail,
          deviceName,
          ipRegion: ipRegion || "Unknown",
          verificationToken,
          userId
        }
      });
    }

    console.log(`New device detected for user ${userId}: ${deviceName}`);

    return new Response(
      JSON.stringify({ 
        needsVerification: true, 
        message: "New device detected. Please check your email to verify.",
        deviceId: newDevice.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in verify-device:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
