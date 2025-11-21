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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
      .select("email, full_name, notify_email")
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

    // Send email notification using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Roomy <onboarding@resend.dev>",
        to: [owner.email],
        subject: `New Viewing Request for ${dormName}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">New Viewing Request</h1>
          <p>Hi ${owner.full_name},</p>
          <p>You have a new viewing request for <strong>${dormName}</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Request Details:</h3>
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Date:</strong> ${requestedDate}</p>
            <p><strong>Time:</strong> ${requestedTime}</p>
            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
          </div>

          <p>Please log in to your Roomy dashboard to approve or decline this request.</p>
          
          <a href="${supabaseUrl.replace('//', '//www.')}/owner/bookings" 
             style="display: inline-block; padding: 12px 24px; background-color: #7C3AED; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            View Request
          </a>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            You're receiving this because you have a property listed on Roomy. 
            You can manage your notification preferences in your account settings.
          </p>
        </div>
      `,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.json();
      throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify(emailResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-notification function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
