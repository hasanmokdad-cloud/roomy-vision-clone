import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  notificationId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notificationId }: NotificationPayload = await req.json();

    // Fetch notification details
    const { data: notification, error: notifError } = await supabase
      .from("notifications_log")
      .select(`
        *,
        owner:owners(full_name, email),
        dorm:dorms(dorm_name, name, monthly_price, area, university)
      `)
      .eq("id", notificationId)
      .single();

    if (notifError || !notification) {
      throw new Error("Notification not found");
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

    let subject = "";
    let html = "";

    if (notification.event_type === "verified") {
      subject = "🎉 Your Roomy listing is now Verified!";
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">🎉</div>
              <h1>Listing Verified!</h1>
            </div>
            <div class="content">
              <p>Hi ${ownerName},</p>
              <p>Great news! Your listing <strong>"${dormName}"</strong> has been verified on Roomy and is now visible to students searching for housing.</p>
              <p><strong>Next steps:</strong></p>
              <ul>
                <li>Keep your price and amenities up to date</li>
                <li>Respond quickly to student inquiries via WhatsApp</li>
                <li>Upload quality photos if you haven't already</li>
              </ul>
              <p>Students can now see and contact you about this listing!</p>
              <a href="${supabaseUrl.replace('https://vtdtmhgzisigtqryojwl.supabase.co', 'https://main-roomy.lovable.app')}/owner/listings" class="button">
                Manage Your Listing
              </a>
            </div>
            <div class="footer">
              <p>— The Roomy Team</p>
              <p style="font-size: 12px; margin-top: 10px;">
                Don't want these emails? <a href="${supabaseUrl.replace('https://vtdtmhgzisigtqryojwl.supabase.co', 'https://main-roomy.lovable.app')}/owner/account">Update your preferences</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (notification.event_type === "edited") {
      subject = "📝 Your Roomy listing was updated";
      
      // Build changes table
      let changesHtml = "<ul style='list-style: none; padding: 0;'>";
      const fields = notification.fields_changed || {};
      
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
              <a href="${supabaseUrl.replace('https://vtdtmhgzisigtqryojwl.supabase.co', 'https://main-roomy.lovable.app')}/owner/listings" class="button">
                View Your Listing
              </a>
            </div>
            <div class="footer">
              <p>— The Roomy Team</p>
              <p style="font-size: 12px; margin-top: 10px;">
                Don't want these emails? <a href="${supabaseUrl.replace('https://vtdtmhgzisigtqryojwl.supabase.co', 'https://main-roomy.lovable.app')}/owner/account">Update your preferences</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Roomy Support <onboarding@resend.dev>",
      to: [notification.sent_to],
      subject,
      html,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      
      // Update notification as failed
      await supabase
        .from("notifications_log")
        .update({
          status: "failed",
          error_message: emailError.message,
          retry_count: notification.retry_count + 1,
        })
        .eq("id", notificationId);

      throw emailError;
    }

    console.log("Email sent successfully:", emailData);

    // Update notification as sent
    await supabase
      .from("notifications_log")
      .update({ status: "sent" })
      .eq("id", notificationId);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
