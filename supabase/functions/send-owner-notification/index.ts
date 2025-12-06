import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // max requests per window (accommodate legitimate bursts)
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

interface NotificationPayload {
  notificationId: string;
}

interface WhatsAppTemplates {
  [key: string]: {
    EN: string;
    AR: string;
  };
}

// Bilingual WhatsApp message templates
const whatsappTemplates: WhatsAppTemplates = {
  verified: {
    EN: `Hi {{owner_name}} 👋
Your listing "{{dorm_name}}" has been verified on Roomy 🎉
Students can now find and contact you directly.
Manage your listing here:
{{owner_dashboard_url}}
— Roomy Team`,
    AR: `مرحباً {{owner_name}} 👋
تمّ التحقق من السكن "{{dorm_name}}" بنجاح ✅
يمكن للطلاب الآن العثور عليه والتواصل معك مباشرةً.
يمكنك إدارة السكن من هنا:
{{owner_dashboard_url}}
— فريق Roomy`
  },
  edited: {
    EN: `Hi {{owner_name}},
Your Roomy listing "{{dorm_name}}" was recently updated.
Updated fields: {{fields_changed_summary}}
View details in your dashboard:
{{owner_dashboard_url}}
— Roomy Team`,
    AR: `مرحباً {{owner_name}},
تمّ تعديل السكن "{{dorm_name}}" على Roomy.
التعديلات الجديدة: {{fields_changed_summary}}
شاهد التفاصيل من خلال لوحة التحكم:
{{owner_dashboard_url}}
— فريق Roomy`
  },
  inquiry: {
    EN: `Hi {{owner_name}}! 👋
A student is interested in "{{dorm_name}}" and has sent you a message.
Open your dashboard to read and reply:
{{owner_dashboard_url}}
— Roomy AI Assistant 🤖`,
    AR: `مرحباً {{owner_name}}! 👋
طالب مهتم بالسكن "{{dorm_name}}" وقد أرسل لك رسالة.
افتح لوحة التحكم لقراءة الرسالة والرد عليها:
{{owner_dashboard_url}}
— مساعد Roomy الذكي 🤖`
  }
};

// Roomy branded email base styles
function getRoomyOwnerEmailStyles(): string {
  return `
    body { 
      margin: 0; 
      padding: 0; 
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .wrapper { width: 100%; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 0 20px; }
    .header { text-align: center; padding: 32px 0 24px 0; }
    .logo { margin: 0 auto 12px auto; }
    .tagline { font-size: 14px; color: #94A3B8; margin: 8px 0 0 0; }
    .card { background: #ffffff; border-radius: 24px; padding: 48px 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .icon { text-align: center; font-size: 56px; margin-bottom: 16px; }
    .heading { font-size: 28px; font-weight: 700; color: #0F172A; text-align: center; margin: 0 0 8px 0; }
    .subheading { font-size: 16px; color: #64748B; text-align: center; margin: 0 0 32px 0; }
    .greeting { font-size: 16px; color: #334155; margin: 0 0 16px 0; }
    .text { font-size: 16px; color: #334155; line-height: 1.6; margin: 0 0 24px 0; }
    .highlight { background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #E2E8F0; }
    .highlight-title { font-size: 14px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0; }
    .list { list-style: none; padding: 0; margin: 0; }
    .list li { padding: 8px 0; color: #334155; font-size: 14px; }
    .list li::before { content: '✓'; color: #10B981; margin-right: 8px; font-weight: bold; }
    .changes-list { list-style: none; padding: 0; margin: 0; }
    .changes-list li { margin: 12px 0; padding: 12px; background: #F9FAFB; border-radius: 8px; font-size: 14px; }
    .changes-list .field { font-weight: 600; color: #0F172A; }
    .changes-list .old { color: #EF4444; text-decoration: line-through; }
    .changes-list .new { color: #10B981; font-weight: 600; }
    .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .warning-text { font-size: 14px; color: #92400E; margin: 0; }
    .inquiry-box { background: #F9FAFB; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #8B5CF6; }
    .inquiry-text { font-size: 15px; color: #334155; margin: 0; font-style: italic; line-height: 1.6; }
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
      .subheading, .greeting, .text { color: #CBD5E1; }
      .highlight { background: #334155; border-color: #475569; }
      .changes-list li { background: #475569; }
      .changes-list .field { color: #F8FAFC; }
    }
    
    @media only screen and (max-width: 480px) {
      .container { padding: 0 16px; }
      .card { padding: 32px 24px; border-radius: 20px; }
      .heading { font-size: 24px; }
      .button { display: block; width: 100%; text-align: center; }
    }
  `;
}

// Helper function to generate WhatsApp message from template
function generateWhatsAppMessage(
  eventType: string,
  language: string,
  variables: { [key: string]: string }
): string {
  const lang = (language === 'AR' ? 'AR' : 'EN') as 'EN' | 'AR';
  const template = whatsappTemplates[eventType]?.[lang] || whatsappTemplates[eventType]?.EN || '';
  
  let message = template;
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  return message;
}

// Helper function to send WhatsApp message via Twilio
async function sendWhatsAppMessage(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${twilioWhatsAppNumber}`,
          To: `whatsapp:${to}`,
          Body: message,
        }).toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio error:', error);
      return { success: false, error: error };
    }

    const data = await response.json();
    console.log('WhatsApp message sent:', data.sid);
    return { success: true };
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
}

// Validate UUID format
function isValidUUID(str: unknown): boolean {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIP = getClientIP(req);
  if (isRateLimited(clientIP)) {
    console.warn(`[send-owner-notification] Rate limit exceeded for IP: ${clientIP.substring(0, 10)}...`);
    
    // Log rate limit event (fire and forget)
    supabase.from("security_events").insert({
      event_type: "rate_limit_exceeded",
      details: { 
        function: "send-owner-notification", 
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
    const body = await req.json();
    const notificationId = body?.notificationId;

    // Input validation - require valid UUID
    if (!notificationId || !isValidUUID(notificationId)) {
      console.warn("[send-owner-notification] Invalid notificationId provided");
      return new Response(
        JSON.stringify({ error: "Invalid notification ID" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Fetch notification details
    const { data: notification, error: notifError } = await supabase
      .from("notifications_log")
      .select(`
        *,
        owner:owners(full_name, email, phone_number, notify_whatsapp, whatsapp_language),
        dorm:dorms(dorm_name, name, monthly_price, area, university)
      `)
      .eq("id", notificationId)
      .single();

    if (notifError || !notification) {
      console.warn(`[send-owner-notification] Notification not found: ${notificationId.slice(0, 8)}...`);
      return new Response(
        JSON.stringify({ error: "Notification not found" }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Skip if already sent or if owner has disabled notifications
    if (notification.status === "sent") {
      return new Response(JSON.stringify({ message: "Already sent" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const owner = notification.owner;
    const dorm = notification.dorm;
    const dormName = dorm?.dorm_name || dorm?.name || "Your listing";
    const ownerName = owner?.full_name || owner?.email || "Owner";
    const channel = notification.channel || 'email';
    const language = owner?.whatsapp_language || 'EN';
    const shouldSendEmail = channel === 'email' || channel === 'both';
    const shouldSendWhatsApp = (channel === 'whatsapp' || channel === 'both') && owner?.notify_whatsapp && owner?.phone_number;

    let subject = "";
    let html = "";
    let whatsappMessage = "";

    const year = new Date().getFullYear();
    const styles = getRoomyOwnerEmailStyles();

    if (notification.event_type === "verified") {
      subject = "🎉 Your Roomy listing is now Verified!";
      whatsappMessage = generateWhatsAppMessage('verified', language, {
        owner_name: ownerName,
        dorm_name: dormName,
        owner_dashboard_url: 'https://roomylb.com/owner/listings'
      });
      html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>Listing Verified - Roomy</title>
  <style>${styles}</style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">
    Your listing "${dormName}" is now live on Roomy! &nbsp;‌&nbsp;‌&nbsp;‌
  </div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="https://roomylb.com/roomy-logo.png" alt="Roomy" width="80" height="80" style="border-radius: 16px; margin-bottom: 12px;" />
        <p class="tagline">AI-Powered Student Housing</p>
      </div>
      <div class="card">
        <div class="icon">🎉</div>
        <h1 class="heading">Listing Verified!</h1>
        <p class="subheading">Students can now find your dorm</p>
        <p class="greeting">Hi ${ownerName},</p>
        <p class="text">Great news! Your listing <strong>"${dormName}"</strong> has been verified on Roomy and is now visible to students searching for housing.</p>
        <div class="highlight">
          <p class="highlight-title">Next Steps</p>
          <ul class="list">
            <li>Keep your price and amenities up to date</li>
            <li>Respond quickly to student inquiries</li>
            <li>Upload quality photos if you haven't already</li>
            <li>Add room details for better matching</li>
          </ul>
        </div>
        <div class="button-container">
          <a href="https://roomylb.com/owner/listings" class="button">Manage Your Listing</a>
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
        <p class="copyright">© ${year} Roomy — Student Housing Reinvented</p>
        <p class="unsubscribe">Don't want these emails? <a href="https://roomylb.com/owner/account">Update preferences</a></p>
      </div>
    </div>
  </div>
</body>
</html>
      `;
    } else if (notification.event_type === "edited") {
      subject = "📝 Your Roomy listing was updated";
      
      // Build changes summary for WhatsApp and email
      const fields = notification.fields_changed || {};
      const changedFields = Object.keys(fields).map(key => 
        key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      ).join(', ');
      
      whatsappMessage = generateWhatsAppMessage('edited', language, {
        owner_name: ownerName,
        dorm_name: dormName,
        fields_changed_summary: changedFields,
        owner_dashboard_url: 'https://roomylb.com/owner/listings'
      });
      
      // Build changes table
      let changesHtml = "<ul style='list-style: none; padding: 0;'>";
      
      for (const [key, value] of Object.entries(fields)) {
        const [oldVal, newVal] = value as [any, any];
        const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        changesHtml += `
          <li style='margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 6px;'>
            <strong>${fieldName}</strong><br/>
            <span style='color: #ef4444;'>Old: ${oldVal || 'None'}</span> → 
            <span style='color: #10b981;'>New: ${newVal || 'None'}</span>
          </li>
        `;
      }
      changesHtml += "</ul>";

      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
            .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
            h1 { margin: 0; font-size: 28px; }
            .emoji { font-size: 48px; margin-bottom: 10px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">📝</div>
              <h1>Listing Updated</h1>
            </div>
            <div class="content">
              <p>Hi ${ownerName},</p>
              <p>Your listing <strong>"${dormName}"</strong> was updated. Here's what changed:</p>
              ${changesHtml}
              <div class="warning">
                <strong>⚠️ Important:</strong> If you didn't make these changes, please contact support immediately at +961 81 858 026
              </div>
              <a href="${supabaseUrl.replace('https://vtdtmhgzisigtqryojwl.supabase.co', 'https://roomylb.com')}/owner/listings" class="button">
                View Your Listing
              </a>
            </div>
            <div class="footer">
              <p>— The Roomy Team</p>
              <p style="font-size: 12px; margin-top: 10px;">
                Don't want these emails? <a href="${supabaseUrl.replace('https://vtdtmhgzisigtqryojwl.supabase.co', 'https://roomylb.com')}/owner/account">Update your preferences</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (notification.event_type === "inquiry") {
      subject = "🔔 New Inquiry for Your Listing";
      const inquiryData = notification.fields_changed || {};
      const studentName = inquiryData.student_name || "A student";
      const message = inquiryData.message || "No message provided";
      
      whatsappMessage = generateWhatsAppMessage('inquiry', language, {
        owner_name: ownerName,
        dorm_name: dormName,
        owner_dashboard_url: 'https://roomylb.com/owner'
      });
      
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
            .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
            h1 { margin: 0; font-size: 28px; }
            .emoji { font-size: 48px; margin-bottom: 10px; }
            .inquiry-box { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #8B5CF6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">🔔</div>
              <h1>New Inquiry!</h1>
            </div>
            <div class="content">
              <p>Hi ${ownerName},</p>
              <p><strong>${studentName}</strong> is interested in your listing <strong>"${dormName}"</strong>.</p>
              <div class="inquiry-box">
                <strong>Message:</strong><br/>
                ${message}
              </div>
              <p>Reply quickly to increase your chances of booking!</p>
              <a href="${supabaseUrl.replace('https://vtdtmhgzisigtqryojwl.supabase.co', 'https://roomylb.com')}/owner" class="button">
                View Inquiry & Reply
              </a>
            </div>
            <div class="footer">
              <p>— The Roomy Team</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    let emailSuccess = true;
    let whatsappSuccess = true;
    let errors: string[] = [];

    // Send email via Resend if needed
    if (shouldSendEmail && subject && html) {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Roomy <notifications@roomylb.com>",
        to: [notification.sent_to],
        subject,
        html,
      });

      if (emailError) {
        console.error("Email send error:", emailError);
        emailSuccess = false;
        errors.push(`Email: ${emailError.message}`);
      } else {
        console.log("Email sent successfully:", emailData);
      }
    }

    // Send WhatsApp message if needed
    if (shouldSendWhatsApp && whatsappMessage) {
      const whatsappResult = await sendWhatsAppMessage(owner.phone_number, whatsappMessage);
      
      if (!whatsappResult.success) {
        console.error("WhatsApp send error:", whatsappResult.error);
        whatsappSuccess = false;
        errors.push(`WhatsApp: ${whatsappResult.error}`);
      }
    }

    // Determine final status
    const finalStatus = (emailSuccess || !shouldSendEmail) && (whatsappSuccess || !shouldSendWhatsApp) 
      ? "sent" 
      : "failed";
    
    const errorMessage = errors.length > 0 ? errors.join('; ') : null;

    // Update notification status with language tracking
    await supabase
      .from("notifications_log")
      .update({
        status: finalStatus,
        error_message: errorMessage,
        retry_count: finalStatus === "failed" ? notification.retry_count + 1 : notification.retry_count,
        language: language,
      })
      .eq("id", notificationId);

    return new Response(
      JSON.stringify({ 
        success: finalStatus === "sent", 
        emailSent: emailSuccess,
        whatsappSent: whatsappSuccess,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Notification error:", error);
    
    // Create client for error logging
    const logClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Log to system_logs
    try {
      await logClient.from("system_logs").insert({
        table_affected: "send-owner-notification",
        action: "notification_error",
        details: {
          severity: "error",
          message: "Error sending owner notification",
          error: error.message,
          stack: error.stack?.substring(0, 500)
        }
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    
    return new Response(
      JSON.stringify({ error: "An error occurred while sending the notification. Please try again later." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
