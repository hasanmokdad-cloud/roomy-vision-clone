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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
  <title>New Login Attempt - Roomy</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .button { padding: 16px 32px !important; }
  </style>
  <![endif]-->
  <style>
    @media (prefers-color-scheme: dark) {
      .email-body { background: #F9FAFB !important; }
      .email-card { background-color: #ffffff !important; border-color: #E5E7EB !important; }
      .email-text { color: #0F172A !important; }
      .email-muted { color: #64748B !important; }
    }
    @media only screen and (max-width: 480px) {
      .container { padding: 16px !important; }
      .card { padding: 24px 16px !important; margin: 0 8px !important; }
      .button { width: 100% !important; display: block !important; text-align: center !important; }
      .logo { width: 60px !important; height: 60px !important; }
      .device-info { padding: 12px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div class="email-body" style="background: #F9FAFB; min-height: 100vh; padding: 40px 20px;">
    <div class="container" style="max-width: 520px; margin: 0 auto;">
      
      <!-- Header with Logo -->
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="https://roomylb.com/roomy-logo.png" alt="Roomy" width="80" height="80" style="border-radius: 16px; margin-bottom: 12px;" />
        <p style="color: #64748B; font-size: 14px; margin: 8px 0 0 0;">AI-Powered Student Housing</p>
      </div>

      <!-- Card -->
      <div class="card email-card" style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); border: 1px solid #E5E7EB;">
        
        <!-- Alert Icon -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #FEF3C7, #FDE68A); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px;">🔔</span>
          </div>
        </div>

        <h1 class="email-text" style="color: #0F172A; font-size: 22px; font-weight: 700; text-align: center; margin: 0 0 16px 0;">
          New Login Attempt Detected
        </h1>
        
        <p class="email-muted" style="color: #64748B; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 24px 0;">
          Someone tried to access your Roomy account from a new device. Was this you?
        </p>

        <!-- Device Info Box -->
        <div class="device-info" style="background-color: #F9FAFB; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #E5E7EB;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Device</td>
              <td style="padding: 8px 0; color: #0F172A; font-size: 14px; text-align: right; font-weight: 600;">${deviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Location</td>
              <td style="padding: 8px 0; color: #0F172A; font-size: 14px; text-align: right; font-weight: 600;">${ipRegion}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Date & Time</td>
              <td style="padding: 8px 0; color: #0F172A; font-size: 14px; text-align: right; font-weight: 600;">${now}</td>
            </tr>
          </table>
        </div>

        <!-- Buttons -->
        <div style="text-align: center; margin-bottom: 16px;">
          <a href="${approveUrl}" class="button" style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; margin-bottom: 12px;">
            ✓ Yes, This Was Me
          </a>
        </div>
        
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${secureUrl}" class="button" style="display: inline-block; background: linear-gradient(135deg, #EF4444, #DC2626); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
            ✗ No, Secure My Account
          </a>
        </div>

        <!-- Disclaimer -->
        <p style="color: #64748B; font-size: 13px; text-align: center; margin: 0; line-height: 1.5;">
          If you recognize this activity, click "Yes, This Was Me" to approve the device.
          <br>If you don't recognize this, click "Secure My Account" to protect your account immediately.
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 32px; padding: 0 16px;">
        <p style="color: #64748B; font-size: 13px; margin: 0 0 8px 0;">
          <a href="https://roomylb.com/contact" style="color: #BD00FF; text-decoration: none;">Support</a>
          &nbsp;•&nbsp;
          <a href="https://roomylb.com/legal#privacy" style="color: #BD00FF; text-decoration: none;">Privacy</a>
          &nbsp;•&nbsp;
          <a href="https://roomylb.com/legal#terms" style="color: #BD00FF; text-decoration: none;">Terms</a>
        </p>
        <p style="color: #64748B; font-size: 12px; margin: 0;">
          Roomy Security • <a href="https://roomylb.com" style="color: #BD00FF; text-decoration: none;">roomylb.com</a>
        </p>
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
        subject: "🔔 New Login Attempt on Your Roomy Account",
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
