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

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Generate secure token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour for password reset

    // Delete any existing unused recovery tokens for this user
    await supabaseAdmin
      .from("email_verification_tokens")
      .delete()
      .eq("user_id", user.id)
      .eq("token_type", "recovery")
      .is("used_at", null);

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

    // Construct reset URL
    const resetUrl = `https://roomylb.com/auth/reset?token=${token}&type=recovery`;

    // Send branded email via Resend
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your Roomy password</title>
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
                Roomy Security • <a href="https://roomylb.com" style="color: #BD00FF; text-decoration: none;">roomylb.com</a>
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

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Roomy Security <security@roomylb.com>",
        to: [user.email],
        subject: "Reset your Roomy password",
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[send-password-reset] Resend error:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log(`[send-password-reset] Password reset email sent to ${user.email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-password-reset] Error:", error);
    // Return success to prevent email enumeration
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
