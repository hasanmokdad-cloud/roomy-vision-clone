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
    const { email } = await req.json();

    console.log(`[send-password-reset] Processing request for email: ${email}`);

    if (!email) {
      console.log("[send-password-reset] Missing email in request");
      return new Response(
        JSON.stringify({ error: "Missing email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if RESEND_API_KEY is configured
    if (!RESEND_API_KEY) {
      console.error("[send-password-reset] RESEND_API_KEY is not configured!");
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-password-reset] RESEND_API_KEY configured: ${RESEND_API_KEY ? 'Yes' : 'No'}`);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("[send-password-reset] Error listing users:", userError);
      // Return success to prevent email enumeration
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
      console.log("[send-password-reset] User not found for email:", email);
      // Return success to prevent email enumeration
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-password-reset] Found user: ${user.id} for email: ${user.email}`);

    // Generate secure token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour for password reset

    // Delete any existing unused recovery tokens for this user
    const { error: deleteError } = await supabaseAdmin
      .from("email_verification_tokens")
      .delete()
      .eq("user_id", user.id)
      .eq("token_type", "recovery")
      .is("used_at", null);

    if (deleteError) {
      console.log("[send-password-reset] Delete old tokens result:", deleteError);
    }

    // Store new token
    const { error: insertError } = await supabaseAdmin
      .from("email_verification_tokens")
      .insert({
        user_id: user.id,
        email: user.email,
        token,
        token_type: "recovery",
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("[send-password-reset] Token insert error:", insertError);
      throw new Error("Failed to create reset token");
    }

    console.log(`[send-password-reset] Token created successfully, expires: ${expiresAt.toISOString()}`);

    // Construct reset URL
    const resetUrl = `https://roomylb.com/auth/reset?token=${token}&type=recovery`;

    // Plain text version for better deliverability
    const plainTextEmail = `
Roomy Password Reset

We received a request to reset your password.

Reset your password: ${resetUrl}

If you didn't request this, you can safely ignore this email.

This link expires in 1 hour.

--
Roomy | roomylb.com
    `.trim();

    // Send branded email via Resend
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roomy Password Reset</title>
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
                Reset Your Password
              </h1>
              <p style="color: #4a4a68; font-size: 16px; line-height: 1.6; margin: 0 0 32px; text-align: center;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="20%" strokecolor="#8E2DE2" fillcolor="#8E2DE2">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Reset Password</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#8E2DE2" style="border-radius: 8px;">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              <p style="color: #8888a0; font-size: 14px; line-height: 1.5; margin: 32px 0 0; text-align: center;">
                If you didn't request this, you can safely ignore this email.
              </p>
              <p style="color: #8888a0; font-size: 12px; line-height: 1.5; margin: 24px 0 0; text-align: center; word-break: break-all;">
                Or copy this link: ${resetUrl}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fc; padding: 24px 40px; border-top: 1px solid #e8e8f0;">
              <p style="color: #8888a0; font-size: 12px; margin: 0; text-align: center;">
                Roomy • <a href="https://roomylb.com" style="color: #BD00FF; text-decoration: none;">roomylb.com</a>
              </p>
              <p style="color: #aaaab8; font-size: 11px; margin: 8px 0 0; text-align: center;">
                This link expires in 1 hour.
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

    console.log(`[send-password-reset] Sending email to ${user.email} via Resend...`);
    console.log(`[send-password-reset] From: Roomy <noreply@roomylb.com>`);

    // Send email via Resend API with improved deliverability settings
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Roomy <noreply@roomylb.com>",
        reply_to: "support@roomylb.com",
        to: [user.email],
        subject: "Roomy Password Reset",
        html: emailHtml,
        text: plainTextEmail,
        headers: {
          "X-Priority": "1",
          "X-Mailer": "Roomy-Platform",
        },
        tags: [
          { name: "category", value: "password_reset" },
          { name: "user_id", value: user.id }
        ]
      }),
    });

    const emailResult = await emailResponse.json();

    console.log(`[send-password-reset] Resend API response status: ${emailResponse.status}`);
    console.log(`[send-password-reset] Resend API response body: ${JSON.stringify(emailResult)}`);

    if (!emailResponse.ok) {
      console.error("[send-password-reset] Resend API error:", emailResult);
      console.error(`[send-password-reset] Resend error details - status: ${emailResponse.status}, message: ${emailResult.message || 'Unknown'}, name: ${emailResult.name || 'Unknown'}`);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log(`[send-password-reset] ✅ Password reset email sent successfully to ${user.email}`);
    console.log(`[send-password-reset] Resend email ID: ${emailResult.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-password-reset] Error:", error);
    console.error(`[send-password-reset] Error stack: ${error.stack || 'No stack trace'}`);
    // Return success to prevent email enumeration
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
