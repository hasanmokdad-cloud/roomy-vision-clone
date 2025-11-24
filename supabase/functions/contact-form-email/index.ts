import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "hassan.mokdad01@lau.edu";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactPayload {
  first_name: string;
  last_name?: string;
  email: string;
  university?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ContactPayload = await req.json();

    console.log("[ContactEmail] Processing notification for:", payload.email);

    if (!RESEND_API_KEY) {
      console.warn("[ContactEmail] RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: true, message: "Email skipped (no API key)" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email using Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Roomy Support <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `New Contact Form: ${payload.first_name} ${payload.last_name || ""}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${payload.first_name} ${payload.last_name || ""}</p>
          <p><strong>Email:</strong> ${payload.email}</p>
          ${payload.university ? `<p><strong>University:</strong> ${payload.university}</p>` : ""}
          <p><strong>Message:</strong></p>
          <p>${payload.message}</p>
          <hr />
          <p><small>Reply directly to this email or check the Admin Support Inbox.</small></p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Resend API error: ${emailResponse.statusText} - ${errorText}`);
    }

    console.log("[ContactEmail] ✅ Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[ContactEmail] Error:", error);
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
