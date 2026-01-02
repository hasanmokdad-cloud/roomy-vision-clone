import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Category-based email routing
const SUPPORT_EMAIL = "support@roomylb.com";
const INFO_EMAIL = "info@roomylb.com";

const SUPPORT_CATEGORIES = ["Customer Support", "Technical Issue", "Feedback"];
const INFO_CATEGORIES = ["General Inquiry", "Business Partnership", "Press & Media", "Careers"];

function getRecipientEmail(category: string): string {
  if (SUPPORT_CATEGORIES.includes(category)) {
    return SUPPORT_EMAIL;
  }
  return INFO_EMAIL;
}

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
  full_name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}

// Generate reference ID for tracking
function generateReferenceId(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timePart = Math.floor(now.getTime() / 1000).toString().slice(-4);
  return `REF-${datePart}-${timePart}`;
}

// Generate auto-reply confirmation email to user
function generateAutoReplyHtml(
  fullName: string,
  category: string,
  subject: string,
  referenceId: string
): string {
  const firstName = fullName.split(' ')[0];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>We received your message - Roomy</title>
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
    .card { background: #ffffff; border-radius: 12px; padding: 48px 40px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); border: 1px solid #E5E7EB; }
    .greeting { font-size: 24px; font-weight: 700; color: #0F172A; margin: 0 0 24px 0; }
    .message-text { font-size: 16px; color: #374151; line-height: 1.7; margin: 0 0 24px 0; }
    .summary-box { background: #F0F9FF; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #BAE6FD; }
    .summary-title { font-size: 14px; font-weight: 600; color: #0369A1; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0; }
    .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E0F2FE; }
    .summary-row:last-child { border-bottom: none; }
    .summary-label { font-size: 14px; color: #64748B; }
    .summary-value { font-size: 14px; font-weight: 600; color: #0F172A; text-align: right; max-width: 60%; }
    .help-section { background: #F9FAFB; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
    .help-text { font-size: 14px; color: #64748B; margin: 0 0 12px 0; }
    .help-link { color: #BD00FF; font-weight: 600; text-decoration: none; }
    .signature { margin-top: 40px; padding-top: 24px; border-top: 1px solid #E5E7EB; }
    .sig-name { font-size: 14px; font-weight: 600; color: #0F172A; margin: 0 0 4px 0; }
    .sig-link { font-size: 13px; color: #64748B; margin: 0 0 2px 0; }
    .sig-link a { color: #BD00FF; text-decoration: none; }
    .sig-location { font-size: 13px; color: #64748B; margin: 0 0 12px 0; }
    .sig-tagline { font-size: 12px; color: #8B5CF6; margin: 0; font-style: italic; }
    .footer { text-align: center; padding: 24px 0; }
    .footer-text { font-size: 12px; color: #9CA3AF; margin: 0; }
    
    @media only screen and (max-width: 480px) {
      .container { padding: 0 16px; }
      .card { padding: 32px 24px; }
      .greeting { font-size: 20px; }
      .summary-row { flex-direction: column; gap: 4px; }
      .summary-value { text-align: left; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">
    Thank you for contacting us! We've received your message and will respond within 24-48 hours. &nbsp;‌&nbsp;‌&nbsp;‌
  </div>
  
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="https://roomylb.com/roomy-logo.png" alt="Roomy" width="80" height="80" style="border-radius: 16px;" />
      </div>

      <div class="card">
        <h1 class="greeting">Hi ${firstName},</h1>
        
        <p class="message-text">
          Thank you for reaching out! We've received your message and our team will get back to you within <strong>24-48 business hours</strong>.
        </p>
        
        <div class="summary-box">
          <p class="summary-title">Your Inquiry Summary</p>
          <div class="summary-row">
            <span class="summary-label">Category</span>
            <span class="summary-value">${category}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Subject</span>
            <span class="summary-value">${subject}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Reference</span>
            <span class="summary-value">${referenceId}</span>
          </div>
        </div>

        <div class="help-section">
          <p class="help-text">In the meantime, you might find answers in our Help Center:</p>
          <a href="https://roomylb.com/help" class="help-link">Visit Help Center →</a>
        </div>

        <div class="signature">
          <p class="sig-name">Roomy Team</p>
          <p class="sig-link"><a href="https://roomylb.com">https://roomylb.com</a></p>
          <p class="sig-location">Lebanon</p>
          <p class="sig-tagline">Roomy — AI-Powered Student Housing Platform</p>
        </div>
      </div>

      <div class="footer">
        <p class="footer-text">© ${new Date().getFullYear()} Roomy. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Generate plain text auto-reply for deliverability
function generateAutoReplyText(
  fullName: string,
  category: string,
  subject: string,
  referenceId: string
): string {
  const firstName = fullName.split(' ')[0];

  return `
Hi ${firstName},

Thank you for reaching out! We've received your message and our team will get back to you within 24-48 business hours.

YOUR INQUIRY SUMMARY
--------------------
Category: ${category}
Subject: ${subject}
Reference: ${referenceId}

In the meantime, you might find answers in our Help Center:
https://roomylb.com/help

--
Roomy Team
https://roomylb.com
Lebanon

Roomy — AI-Powered Student Housing Platform
  `.trim();
}

// Generate professional contact form notification email
function generateContactNotificationHtml(
  fullName: string,
  email: string,
  category: string,
  subject: string,
  message: string
): string {
  const year = new Date().getFullYear();
  const timestamp = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Category badge color
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Customer Support":
      case "Technical Issue":
        return { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" };
      case "Feedback":
        return { bg: "#D1FAE5", text: "#065F46", border: "#10B981" };
      case "Business Partnership":
      case "Careers":
        return { bg: "#EDE9FE", text: "#5B21B6", border: "#8B5CF6" };
      case "Press & Media":
        return { bg: "#FCE7F3", text: "#9D174D", border: "#EC4899" };
      default:
        return { bg: "#E0F2FE", text: "#0369A1", border: "#0EA5E9" };
    }
  };

  const catColor = getCategoryColor(category);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>[${category}] ${subject} - Roomy Contact Form</title>
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
    .category-badge { 
      display: inline-block; 
      background: ${catColor.bg}; 
      color: ${catColor.text}; 
      border: 1px solid ${catColor.border};
      font-size: 12px; 
      font-weight: 600; 
      padding: 6px 12px; 
      border-radius: 20px; 
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }
    .subject-line { font-size: 24px; font-weight: 700; color: #0F172A; text-align: center; margin: 0 0 8px 0; line-height: 1.3; }
    .from-line { font-size: 16px; color: #64748B; text-align: center; margin: 0 0 32px 0; }
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
      .subject-line { font-size: 20px; }
      .button { display: block; width: 100%; text-align: center; }
    }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">
    [${category}] ${subject} - from ${fullName} &nbsp;‌&nbsp;‌&nbsp;‌
  </div>
  
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="https://roomylb.com/roomy-logo.png" alt="Roomy" width="80" height="80" style="border-radius: 16px; margin-bottom: 12px;" />
        <p class="tagline">Contact Form Submission</p>
      </div>

      <div class="card">
        <div style="text-align: center;">
          <span class="category-badge">${category}</span>
        </div>
        <h1 class="subject-line">${subject}</h1>
        <p class="from-line">from ${fullName}</p>
        
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
          <div class="info-row">
            <span class="info-label">Category</span>
            <span class="info-value">${category}</span>
          </div>
        </div>

        <div class="message-box">
          <p class="message-label">Message</p>
          <p class="message-text">${message}</p>
        </div>

        <p class="timestamp">Received on ${timestamp}</p>

        <div class="button-container">
          <a href="mailto:${email}?subject=Re: ${subject}" class="button">Reply to ${fullName.split(' ')[0]}</a>
        </div>
      </div>

      <div class="footer">
        <div style="border-top: 1px solid #E5E7EB; margin-top: 16px; padding-top: 16px; text-align: center;">
          <p style="font-weight: 600; color: #0F172A; margin: 0; font-size: 14px;">Roomy Contact Form</p>
          <p style="color: #64748B; margin: 4px 0; font-size: 13px;"><a href="https://roomylb.com/contact" style="color: #BD00FF; text-decoration: none;">roomylb.com/contact</a></p>
          <p style="color: #8B5CF6; margin: 8px 0 0 0; font-size: 12px;">Roomy — AI-Powered Student Housing Platform</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Generate plain text version for better deliverability
function generatePlainTextEmail(
  fullName: string,
  email: string,
  category: string,
  subject: string,
  message: string
): string {
  const timestamp = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
ROOMY CONTACT FORM SUBMISSION
=============================

[${category}] ${subject}
From: ${fullName}

CONTACT DETAILS
---------------
Name: ${fullName}
Email: ${email}
Category: ${category}

MESSAGE
-------
${message}

---
Received on ${timestamp}

To reply, email: ${email}

--
Roomy — AI-Powered Student Housing Platform
https://roomylb.com
  `.trim();
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

    console.log("[contact-form-email] Processing contact form from:", payload.email);
    console.log("[contact-form-email] Category:", payload.category);

    if (!RESEND_API_KEY) {
      console.warn("[contact-form-email] RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: true, message: "Email skipped (no API key)" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Determine recipient based on category
    const recipientEmail = getRecipientEmail(payload.category);
    console.log("[contact-form-email] Routing to:", recipientEmail);

    // Generate email content
    const emailHtml = generateContactNotificationHtml(
      payload.full_name,
      payload.email,
      payload.category,
      payload.subject,
      payload.message
    );

    const emailText = generatePlainTextEmail(
      payload.full_name,
      payload.email,
      payload.category,
      payload.subject,
      payload.message
    );

    // Generate reference ID for tracking
    const referenceId = generateReferenceId();
    console.log("[contact-form-email] Reference ID:", referenceId);

    // Format subject: [Category] Subject - Full Name
    const teamEmailSubject = `[${payload.category}] ${payload.subject} - ${payload.full_name}`;

    // 1. Send auto-reply confirmation to user first
    const autoReplyHtml = generateAutoReplyHtml(
      payload.full_name,
      payload.category,
      payload.subject,
      referenceId
    );
    const autoReplyText = generateAutoReplyText(
      payload.full_name,
      payload.category,
      payload.subject,
      referenceId
    );

    try {
      const autoReplyResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Roomy <noreply@roomylb.com>",
          to: [payload.email],
          subject: "We received your message - Roomy",
          html: autoReplyHtml,
          text: autoReplyText,
          headers: {
            "X-Priority": "1",
            "X-Mailer": "Roomy-Platform"
          }
        }),
      });

      if (autoReplyResponse.ok) {
        const autoReplyResult = await autoReplyResponse.json();
        console.log("[contact-form-email] ✅ Auto-reply sent to", payload.email);
        console.log("[contact-form-email] Auto-reply Resend ID:", autoReplyResult.id);
      } else {
        const errorText = await autoReplyResponse.text();
        console.error("[contact-form-email] Auto-reply failed:", errorText);
      }
    } catch (autoReplyError) {
      console.error("[contact-form-email] Auto-reply error:", autoReplyError);
      // Continue with team notification even if auto-reply fails
    }

    // 2. Send notification to team
    const teamEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Roomy Contact Form <noreply@roomylb.com>",
        to: [recipientEmail],
        subject: teamEmailSubject,
        html: emailHtml,
        text: emailText,
        reply_to: payload.email,
        headers: {
          "X-Priority": "1",
          "X-Mailer": "Roomy-Platform"
        }
      }),
    });

    if (!teamEmailResponse.ok) {
      const errorText = await teamEmailResponse.text();
      throw new Error(`Resend API error: ${teamEmailResponse.statusText} - ${errorText}`);
    }

    const teamResult = await teamEmailResponse.json();
    console.log("[contact-form-email] ✅ Team notification sent to", recipientEmail);
    console.log("[contact-form-email] Team Resend ID:", teamResult.id);

    return new Response(JSON.stringify({ 
      success: true, 
      recipient: recipientEmail,
      referenceId: referenceId 
    }), {
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
