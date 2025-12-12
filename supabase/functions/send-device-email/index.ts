import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface DeviceEmailRequest {
  email: string;
  deviceName: string;
  ipRegion: string;
  verificationToken: string;
  userId: string;
}

// Rate limiting: 5 requests per minute per IP (sensitive endpoint)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return true;
  }
  
  entry.count++;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);

  // Check rate limit
  if (isRateLimited(clientIP)) {
    console.log(`[send-device-email] Rate limit exceeded for IP: ${clientIP}`);
    
    // Log rate limit event
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? '',
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ''
      );
      await supabaseAdmin.from('security_events').insert({
        event_type: 'rate_limit_exceeded',
        ip_address: clientIP,
        endpoint: 'send-device-email',
        metadata: { limit: RATE_LIMIT, window_ms: RATE_LIMIT_WINDOW_MS }
      });
    } catch (e) {
      console.error('Failed to log rate limit event:', e);
    }
    
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: DeviceEmailRequest = await req.json();
    const { email, deviceName, ipRegion, verificationToken, userId } = body;

    if (!email || !verificationToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const approveUrl = `https://roomylb.com/auth/approve-device?token=${verificationToken}`;
    const secureUrl = `https://roomylb.com/devices/secure?token=${verificationToken}`;
    const now = new Date().toLocaleString("en-US", { 
      dateStyle: "medium", 
      timeStyle: "short",
      timeZone: "Asia/Beirut"
    });

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Device Detected - Roomy</title>
  <style>
    @media only screen and (max-width: 480px) {
      .container { padding: 16px !important; }
      .card { padding: 24px 16px !important; }
      .button { width: 100% !important; display: block !important; text-align: center !important; margin-bottom: 12px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0E1A;">
  <div style="background: #0B0E1A; min-height: 100vh; padding: 40px 20px;">
    <div class="container" style="max-width: 520px; margin: 0 auto;">
      
      <!-- Card -->
      <div class="card" style="background: #FFFFFF; border-radius: 14px; padding: 32px; box-shadow: 0 8px 35px rgba(0,0,0,0.12);">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://roomylb.com/roomy-logo.png" alt="Roomy" width="80" height="80" style="display: block; margin: 0 auto;" />
        </div>

        <!-- Title -->
        <h2 style="text-align: center; color: #111827; font-size: 26px; font-weight: 700; margin: 0 0 16px 0;">
          New Device Detected
        </h2>
        
        <!-- Description -->
        <p style="color: #374151; font-size: 16px; line-height: 1.6; text-align: center; margin: 0 0 24px 0;">
          We noticed a new login attempt to your Roomy account. Click the button below to confirm this was you.
        </p>

        <!-- Device Info Box -->
        <div style="background: #F9FAFB; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #E5E7EB;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Device</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${deviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Location</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${ipRegion}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Date & Time</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${now}</td>
            </tr>
          </table>
        </div>

        <!-- Approve Button -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
          <tr>
            <td align="center">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${approveUrl}" style="height:44px;v-text-anchor:middle;width:180px;" arcsize="20%" strokecolor="#8E2DE2" fillcolor="#8E2DE2">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">Yes, This Was Me</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#8E2DE2" style="border-radius: 8px;">
                    <a href="${approveUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Yes, This Was Me
                    </a>
                  </td>
                </tr>
              </table>
              <!--<![endif]-->
            </td>
          </tr>
        </table>
        
        <!-- Secure Account Button -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${secureUrl}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="20%" strokecolor="#EF4444" fillcolor="#EF4444">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">No, Secure My Account</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#EF4444" style="border-radius: 8px;">
                    <a href="${secureUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      No, Secure My Account
                    </a>
                  </td>
                </tr>
              </table>
              <!--<![endif]-->
            </td>
          </tr>
        </table>

        <!-- Disclaimer -->
        <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 0; line-height: 1.5;">
          If this wasn't you, please reset your password immediately.
        </p>
      </div>

      <!-- Signature -->
      <div style="border-top: 1px solid #E5E7EB; margin-top: 32px; padding-top: 24px; text-align: center;">
        <p style="font-weight: 600; color: #FFFFFF; margin: 0;">Roomy Security Team</p>
        <p style="color: #9CA3AF; margin: 4px 0;"><a href="mailto:security@roomylb.com" style="color: #BD00FF; text-decoration: none;">security@roomylb.com</a></p>
        <p style="color: #9CA3AF; margin: 4px 0;"><a href="https://roomylb.com" style="color: #BD00FF; text-decoration: none;">roomylb.com</a> • Lebanon</p>
        <p style="color: #A78BFA; margin: 8px 0 0 0; font-size: 13px;">Roomy — AI-Powered Student Housing Platform</p>
      </div>

    </div>
  </div>
</body>
</html>
    `;

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Roomy Security <security@roomylb.com>",
        to: [email],
        subject: "Roomy • New Device Detected",
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Device verification email sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-device-email:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
