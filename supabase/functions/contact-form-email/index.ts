import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "hassan.mokdad01@lau.edu";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting - 5 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

interface ContactPayload {
  first_name: string;
  last_name?: string;
  email: string;
  university?: string;
  message: string;
}

// Roomy branded contact form notification email
function generateContactNotificationHtml(
  firstName: string,
  lastName: string | undefined,
  email: string,
  university: string | undefined,
  message: string
): string {
  const year = new Date().getFullYear();
  const fullName = `${firstName} ${lastName || ''}`.trim();
  const timestamp = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>New Contact Form Submission - Roomy</title>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      background: #F9FAFB;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .wrapper { width: 100%; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 0 20px; }
    .header { text-align: center; padding: 32px 0 24px 0; }
    .tagline { font-size: 14px; color: #64748B; margin: 8px 0 0 0; }
    .card { background: #ffffff; border-radius: 12px; padding: 48px 40px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); border: 1px solid #E5E7EB; }
    .icon { text-align: center; font-size: 56px; margin-bottom: 16px; }
    .heading { font-size: 28px; font-weight: 700; color: #0F172A; text-align: center; margin: 0 0 8px 0; }
    .subheading { font-size: 16px; color: #64748B; text-align: center; margin: 0 0 32px 0; }
    .info-box { background: #F9FAFB; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #E5E7EB; }
    .info-title { font-size: 14px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-size: 14px; color: #64748B; }
    .info-value { font-size: 14px; font-weight: 600; color: #0F172A; }
    .info-value a { color: #BD00FF; text-decoration: none; }
    .message-box { background: #F0F9FF; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #00D2FF; }
    .message-label { font-size: 12px; font-weight: 600; color: #0369A1; text-transform: uppercase; margin: 0 0 12px 0; }
    .message-text { font-size: 15px; color: #0C4A6E; margin: 0; line-height: 1.7; white-space: pre-wrap; }
    .timestamp { font-size: 12px; color: #64748B; text-align: center; margin: 24px 0 0 0; }
    .button-container { text-align: center; margin: 32px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #00D2FF 0%, #BD00FF 100%); color: #ffffff !important; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 12px; text-decoration: none; }
    .footer { text-align: center; padding: 32px 0; }
    .footer-text { font-size: 12px; color: #64748B; margin: 0; }
    
    @media only screen and (max-width: 480px) {
      .container { padding: 0 16px; }
      .card { padding: 32px 24px; border-radius: 12px; }
      .heading { font-size: 24px; }
      .button { display: block; width: 100%; text-align: center; }
    }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">
    New message from ${fullName} via Roomy contact form &nbsp;‌&nbsp;‌&nbsp;‌
  </div>
  
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="https://roomylb.com/roomy-logo.png" alt="Roomy" width="80" height="80" style="border-radius: 16px; margin-bottom: 12px;" />
        <p class="tagline">Admin Notification</p>
      </div>

      <div class="card">
        <div class="icon">📬</div>
        <h1 class="heading">New Contact Form Submission</h1>
        <p class="subheading">Someone reached out via the Roomy website</p>
        
        <div class="info-box">
          <p class="info-title">Contact Details</p>
          <div class="info-row">
            <span class="info-label">Name</span>
            <span class="info-value">${fullName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value"><a href="mailto:${email}">${email}</a></span>
          </div>
          ${university ? `
          <div class="info-row">
            <span class="info-label">University</span>
            <span class="info-value">${university}</span>
          </div>
          ` : ''}
        </div>

        <div class="message-box">
          <p class="message-label">Message</p>
          <p class="message-text">${message}</p>
        </div>

        <p class="timestamp">Received on ${timestamp}</p>

        <div class="button-container">
          <a href="mailto:${email}?subject=Re: Your Roomy Inquiry" class="button">Reply to ${firstName}</a>
        </div>
      </div>

      <div class="footer">
        <p class="footer-text">Roomy Security • <a href="https://roomylb.com" style="color: #BD00FF; text-decoration: none;">roomylb.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   req.headers.get("x-real-ip") || 
                   "unknown";
  
  if (isRateLimited(clientIp)) {
    console.log("[contact-form-email] Rate limit exceeded for IP:", clientIp);
    
    // Log rate limit event
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("security_events").insert({
        event_type: "rate_limit_exceeded",
        severity: "warning",
        ip_region: clientIp,
        details: { function: "contact-form-email", limit: RATE_LIMIT, window: "1min" }
      });
    } catch (e) {
      console.error("Failed to log rate limit event:", e);
    }
    
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
    const payload: ContactPayload = await req.json();

    console.log("[contact-form-email] Processing notification for:", payload.email);

    if (!RESEND_API_KEY) {
      console.warn("[contact-form-email] RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: true, message: "Email skipped (no API key)" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate Roomy branded email
    const emailHtml = generateContactNotificationHtml(
      payload.first_name,
      payload.last_name,
      payload.email,
      payload.university,
      payload.message
    );

    // Send email using Resend with verified domain
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Roomy <notifications@roomylb.com>",
        to: [ADMIN_EMAIL],
        subject: `📬 New Contact Form: ${payload.first_name} ${payload.last_name || ""}`,
        html: emailHtml,
        reply_to: payload.email,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Resend API error: ${emailResponse.statusText} - ${errorText}`);
    }

    console.log("[contact-form-email] ✅ Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[contact-form-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
