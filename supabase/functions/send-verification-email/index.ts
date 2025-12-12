import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate cryptographically secure token
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, tokenType = 'signup' } = await req.json();

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing userId or email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate secure token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete any existing unused tokens for this user/type
    await supabaseAdmin
      .from("email_verification_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("token_type", tokenType)
      .is("used_at", null);

    // Store new token
    const { error: insertError } = await supabaseAdmin
      .from("email_verification_tokens")
      .insert({
        user_id: userId,
        email,
        token,
        token_type: tokenType,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Token insert error:", insertError);
      throw new Error("Failed to create verification token");
    }

    // Construct verification URL
    const verifyUrl = `https://roomylb.com/auth/verify?token=${token}&type=${tokenType}`;

    // Determine email content based on type
    let subject: string;
    let heading: string;
    let message: string;
    let buttonText: string;

    switch (tokenType) {
      case 'recovery':
        subject = "Reset your Roomy password";
        heading = "Reset Your Password";
        message = "We received a request to reset your password. Click the button below to create a new password.";
        buttonText = "Reset Password";
        break;
      case 'email_change':
        subject = "Confirm your new email for Roomy";
        heading = "Confirm Email Change";
        message = "Please confirm your new email address by clicking the button below.";
        buttonText = "Confirm Email";
        break;
      default: // signup
        subject = "Confirm your Roomy email";
        heading = "Welcome to Roomy!";
        message = "Thank you for signing up! Please verify your email address to get started finding your perfect student housing.";
        buttonText = "Verify Email";
    }

    // Send branded email via Resend
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0E1A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B0E1A; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.3);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px;">
              <img src="https://roomylb.com/roomy-logo.png" alt="Roomy" width="80" height="80" style="display: block;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h1 style="color: #1a1a2e; font-size: 24px; font-weight: 600; margin: 0 0 16px; text-align: center;">
                ${heading}
              </h1>
              <p style="color: #4a4a68; font-size: 16px; line-height: 1.6; margin: 0 0 32px; text-align: center;">
                ${message}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #00E0FF 0%, #BD00FF 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 12px; box-shadow: 0 4px 16px rgba(189, 0, 255, 0.3);">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #8888a0; font-size: 14px; line-height: 1.5; margin: 32px 0 0; text-align: center;">
                If you didn't request this, you can safely ignore this email.
              </p>
              <p style="color: #8888a0; font-size: 12px; line-height: 1.5; margin: 24px 0 0; text-align: center; word-break: break-all;">
                Or copy this link: ${verifyUrl}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fc; padding: 24px 40px; border-top: 1px solid #e8e8f0;">
              <p style="color: #8888a0; font-size: 12px; margin: 0; text-align: center;">
                Roomy Security • <a href="https://roomylb.com" style="color: #BD00FF; text-decoration: none;">roomylb.com</a>
              </p>
              <p style="color: #aaaab8; font-size: 11px; margin: 8px 0 0; text-align: center;">
                This link expires in 24 hours.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Roomy Security <security@roomylb.com>",
        to: [email],
        subject,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[send-verification-email] Resend error:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log(`[send-verification-email] Email sent to ${email}, type: ${tokenType}`);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResult.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-verification-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
