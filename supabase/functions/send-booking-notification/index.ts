import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  ownerId: string;
  dormId: string;
  dormName: string;
  studentName: string;
  requestedDate: string;
  requestedTime: string;
  message: string;
}

// Rate limiting: 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
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

// Roomy branded booking notification email
function generateBookingNotificationHtml(
  ownerName: string,
  dormName: string,
  studentName: string,
  requestedDate: string,
  requestedTime: string,
  message: string
): string {
  const year = new Date().getFullYear();
  const formattedDate = new Date(requestedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>New Viewing Request - Roomy</title>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .wrapper { width: 100%; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 0 20px; }
    .header { text-align: center; padding: 32px 0 24px 0; }
    .logo { font-size: 36px; font-weight: 800; color: #A855F7; margin: 0; }
    .tagline { font-size: 14px; color: #94A3B8; margin: 8px 0 0 0; }
    .card { background: #ffffff; border-radius: 24px; padding: 48px 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .icon { text-align: center; font-size: 56px; margin-bottom: 16px; }
    .heading { font-size: 28px; font-weight: 700; color: #0F172A; text-align: center; margin: 0 0 8px 0; }
    .subheading { font-size: 16px; color: #64748B; text-align: center; margin: 0 0 32px 0; }
    .greeting { font-size: 16px; color: #334155; margin: 0 0 16px 0; }
    .details-box { background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #E2E8F0; }
    .details-title { font-size: 14px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E2E8F0; }
    .details-row:last-child { border-bottom: none; }
    .details-label { font-size: 14px; color: #64748B; }
    .details-value { font-size: 14px; font-weight: 600; color: #0F172A; }
    .message-box { background: #FEF3C7; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #F59E0B; }
    .message-label { font-size: 12px; font-weight: 600; color: #B45309; text-transform: uppercase; margin: 0 0 8px 0; }
    .message-text { font-size: 14px; color: #92400E; margin: 0; line-height: 1.6; font-style: italic; }
    .tip-box { background: #ECFDF5; border-radius: 12px; padding: 16px; margin: 24px 0; }
    .tip-text { font-size: 13px; color: #047857; margin: 0; }
    .tip-text strong { color: #059669; }
    .button-container { text-align: center; margin: 32px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%); color: #ffffff !important; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 12px; text-decoration: none; }
    .footer { text-align: center; padding: 32px 0; }
    .footer-links { margin: 0 0 16px 0; }
    .footer-link { color: #94A3B8; text-decoration: none; font-size: 13px; margin: 0 12px; }
    .copyright { font-size: 12px; color: #64748B; margin: 16px 0 0 0; }
    .unsubscribe { font-size: 11px; color: #94A3B8; margin: 12px 0 0 0; }
    .unsubscribe a { color: #8B5CF6; text-decoration: none; }
    
    @media (prefers-color-scheme: dark) {
      .card { background: #1E293B; }
      .heading { color: #F8FAFC; }
      .subheading, .greeting { color: #CBD5E1; }
      .details-box { background: #334155; border-color: #475569; }
      .details-row { border-color: #475569; }
      .details-value { color: #F8FAFC; }
    }
    
    @media only screen and (max-width: 480px) {
      .container { padding: 0 16px; }
      .card { padding: 32px 24px; border-radius: 20px; }
      .heading { font-size: 24px; }
      .button { display: block; width: 100%; text-align: center; }
    }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${studentName} wants to view ${dormName}. Respond quickly! &nbsp;‌&nbsp;‌&nbsp;‌
  </div>
  
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <p class="logo">🏠 Roomy</p>
        <p class="tagline">AI-Powered Student Housing</p>
      </div>

      <div class="card">
        <div class="icon">📅</div>
        <h1 class="heading">New Viewing Request!</h1>
        <p class="subheading">A student wants to see your listing</p>
        
        <p class="greeting">Hi ${ownerName},</p>
        <p style="font-size: 16px; color: #334155; margin: 0 0 24px 0; line-height: 1.6;">
          Great news! You have a new viewing request for <strong>${dormName}</strong>.
        </p>
        
        <div class="details-box">
          <p class="details-title">Request Details</p>
          <div class="details-row">
            <span class="details-label">Student</span>
            <span class="details-value">${studentName}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Requested Date</span>
            <span class="details-value">${formattedDate}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Preferred Time</span>
            <span class="details-value">${requestedTime}</span>
          </div>
        </div>

        ${message ? `
        <div class="message-box">
          <p class="message-label">Student's Message</p>
          <p class="message-text">"${message}"</p>
        </div>
        ` : ''}

        <div class="tip-box">
          <p class="tip-text">💡 <strong>Tip:</strong> Respond quickly to increase your chances of booking! Students often choose the first owner who responds.</p>
        </div>

        <div class="button-container">
          <a href="https://roomylb.com/owner/bookings" class="button">View & Respond</a>
        </div>
      </div>

      <div class="footer">
        <div class="footer-links">
          <a href="https://roomylb.com/contact" class="footer-link">Support</a>
          <span style="color: #475569;">•</span>
          <a href="https://roomylb.com/legal#privacy" class="footer-link">Privacy</a>
          <span style="color: #475569;">•</span>
          <a href="https://roomylb.com/legal#terms" class="footer-link">Terms</a>
        </div>
        <!-- Signature -->
        <div style="border-top: 1px solid #475569; margin-top: 16px; padding-top: 16px;">
          <p style="font-weight: 600; color: #F8FAFC; margin: 0; font-size: 14px;">Roomy Support Team</p>
          <p style="color: #94A3B8; margin: 4px 0; font-size: 13px;"><a href="mailto:support@roomylb.com" style="color: #A78BFA; text-decoration: none;">support@roomylb.com</a></p>
          <p style="color: #94A3B8; margin: 4px 0; font-size: 13px;"><a href="https://roomylb.com" style="color: #A78BFA; text-decoration: none;">roomylb.com</a> • Lebanon</p>
          <p style="color: #A78BFA; margin: 8px 0 0 0; font-size: 12px;">Roomy — AI-Powered Student Housing Platform</p>
        </div>
        <p class="unsubscribe" style="margin-top: 16px;">
          Don't want booking emails? <a href="https://roomylb.com/owner/account">Update preferences</a>
        </p>
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

  const clientIP = getClientIP(req);

  // Check rate limit
  if (isRateLimited(clientIP)) {
    console.log(`[send-booking-notification] Rate limit exceeded for IP: ${clientIP}`);
    
    // Log rate limit event
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabaseAdmin.from('security_events').insert({
        event_type: 'rate_limit_exceeded',
        ip_address: clientIP,
        endpoint: 'send-booking-notification',
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      ownerId,
      dormId,
      dormName,
      studentName,
      requestedDate,
      requestedTime,
      message,
    }: BookingNotificationRequest = await req.json();

    // Get owner details
    const { data: owner, error: ownerError } = await supabase
      .from("owners")
      .select("email, full_name, notify_email, user_id")
      .eq("id", ownerId)
      .single();

    if (ownerError || !owner) {
      throw new Error("Owner not found");
    }

    // Only send email if owner has email notifications enabled
    if (owner.notify_email === false) {
      return new Response(
        JSON.stringify({ message: "Owner has email notifications disabled" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if Resend API key is configured
    if (!RESEND_API_KEY) {
      console.log('[send-booking-notification] Resend: Running in preview mode - no email sent');
      return new Response(
        JSON.stringify({ success: true, preview: true }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate Roomy branded email
    const emailHtml = generateBookingNotificationHtml(
      owner.full_name,
      dormName,
      studentName,
      requestedDate,
      requestedTime,
      message
    );

    // Send email notification using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Roomy Support Team <support@roomylb.com>",
        to: [owner.email],
        subject: `📅 New Viewing Request for ${dormName}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.json();
      throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
    }

    const emailResult = await emailResponse.json();
    console.log("[send-booking-notification] Email sent successfully:", emailResult);

    // Also send push notification to owner
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: owner.user_id || ownerId, // Try user_id first, fall back to ownerId
          title: '📅 New Viewing Request!',
          body: `${studentName} wants to view ${dormName} on ${new Date(requestedDate).toLocaleDateString()}.`,
          url: '/owner/bookings',
          icon: '/favicon.ico'
        }
      });
      console.log("[send-booking-notification] Push notification sent");
    } catch (pushError) {
      console.error("[send-booking-notification] Push notification failed:", pushError);
      // Don't fail the request if push fails
    }

    return new Response(JSON.stringify(emailResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[send-booking-notification] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
