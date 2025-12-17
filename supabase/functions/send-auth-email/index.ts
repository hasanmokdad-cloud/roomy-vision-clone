import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

interface AuthEmailPayload {
  user: {
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

// Email template generator with Roomy branding
function generateEmailHtml(type: string, actionUrl: string): { html: string; subject: string } {
  const templates: Record<string, { 
    heading: string; 
    text: string; 
    buttonText: string; 
    disclaimer: string; 
    subject: string;
    expiry?: string;
  }> = {
    signup: {
      heading: "Verify your email for Roomy",
      text: "Welcome to Roomy! Click the button below to verify your email and activate your account.",
      buttonText: "Verify Email",
      disclaimer: "If you didn't create a Roomy account, you can safely ignore this email.",
      subject: "Verify your email for Roomy"
    },
    email: {
      heading: "Verify your email for Roomy",
      text: "Welcome to Roomy! Click the button below to verify your email and activate your account.",
      buttonText: "Verify Email",
      disclaimer: "If you didn't create a Roomy account, you can safely ignore this email.",
      subject: "Verify your email for Roomy"
    },
    recovery: {
      heading: "Reset your Roomy password",
      text: "We received a request to reset your Roomy password. Click the button below to continue.",
      buttonText: "Reset Password",
      disclaimer: "If you did not request this, ignore this email—your account is safe.",
      subject: "Reset your Roomy password"
    },
    magiclink: {
      heading: "Your Login Link",
      text: "Click the button below to log in securely to Roomy.",
      buttonText: "Log in to Roomy",
      disclaimer: "This link expires in 10 minutes.",
      subject: "Your Roomy login link",
      expiry: "This link expires in 10 minutes."
    },
    email_change: {
      heading: "Confirm your new email",
      text: "You requested to update your email address. Click the button below to confirm your new email address on Roomy.",
      buttonText: "Confirm Email Change",
      disclaimer: "If you didn't request this change, please contact our support team immediately.",
      subject: "Confirm your new Roomy email"
    },
    invite: {
      heading: "Welcome to Roomy for Owners",
      text: "You've been invited to manage your dorm listing on Roomy. Accept your invitation to get started.",
      buttonText: "Accept Invitation",
      disclaimer: "If you were not expecting this invitation, you can safely ignore this email.",
      subject: "You're invited to manage your dorm on Roomy"
    }
  };

  const template = templates[type] || templates.signup;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.subject}</title>
  <style>
    @media only screen and (max-width: 480px) {
      .container { padding: 16px !important; }
      .card { padding: 24px 16px !important; }
      .button { width: 100% !important; display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0E1A;">
  <div style="background: #0B0E1A; min-height: 100vh; padding: 40px 20px;">
    <div class="container" style="max-width: 520px; margin: 0 auto;">
      
      <!-- Card -->
      <div class="card" style="background: #FFFFFF; border-radius: 14px; padding: 32px; box-shadow: 0 8px 35px rgba(0,0,0,0.12);">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://roomylb.com/roomy-logo.png" alt="Roomy" width="80" height="80" style="display: block; margin: 0 auto;" />
        </div>

        <!-- Title -->
        <h2 style="text-align: center; color: #111827; font-size: 26px; font-weight: 700; margin: 0 0 16px 0;">
          ${template.heading}
        </h2>
        
        <!-- Description -->
        <p style="color: #374151; font-size: 16px; line-height: 1.6; text-align: center; margin: 0 0 28px 0;">
          ${template.text}
        </p>

        <!-- Button -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
          <tr>
            <td align="center">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:44px;v-text-anchor:middle;width:180px;" arcsize="20%" strokecolor="#8E2DE2" fillcolor="#8E2DE2">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${template.buttonText}</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#8E2DE2" style="border-radius: 8px;">
                    <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      ${template.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              <!--<![endif]-->
            </td>
          </tr>
        </table>

        ${template.expiry ? `<p style="text-align: center; font-size: 13px; color: #6B7280; margin: 0 0 16px 0;">${template.expiry}</p>` : ''}

        <!-- Disclaimer -->
        <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 0;">
          ${template.disclaimer}
        </p>
      </div>

      <!-- Signature -->
      <div style="border-top: 1px solid #E5E7EB; margin-top: 32px; padding-top: 24px; text-align: center;">
        <p style="font-weight: 600; color: #0F172A; margin: 0;">Roomy Security Team</p>
        <p style="color: #64748B; margin: 4px 0;"><a href="mailto:security@roomylb.com" style="color: #BD00FF; text-decoration: none;">security@roomylb.com</a></p>
        <p style="color: #64748B; margin: 4px 0;"><a href="https://roomylb.com" style="color: #BD00FF; text-decoration: none;">roomylb.com</a> • Lebanon</p>
        <p style="color: #8B5CF6; margin: 8px 0 0 0; font-size: 13px;">Roomy — AI-Powered Student Housing Platform</p>
      </div>

    </div>
  </div>
</body>
</html>
  `;

  return { html, subject: template.subject };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  let emailPayload: AuthEmailPayload;

  // Verify webhook signature if secret is configured
  if (hookSecret) {
    try {
      const wh = new Webhook(hookSecret);
      emailPayload = wh.verify(payload, headers) as AuthEmailPayload;
    } catch (error) {
      console.error("Webhook verification failed:", error);
      return new Response(
        JSON.stringify({ error: { message: "Invalid webhook signature" } }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  } else {
    // For development/testing without webhook secret
    emailPayload = JSON.parse(payload);
  }

  const { user, email_data } = emailPayload;
  const { token_hash, redirect_to, email_action_type, site_url } = email_data;

  // Build the action URL
  // For email verification (signup/email), use Supabase's native verification endpoint
  // which validates the token server-side and redirects back to our callback
  const baseUrl = "https://roomylb.com";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://vtdtmhgzisigtqryojwl.supabase.co";
  let actionUrl: string;
  
  switch (email_action_type) {
    case 'signup':
    case 'email':
      // Use Supabase's native verification endpoint - it validates token server-side
      // then redirects to our callback with the session established
      actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=signup&redirect_to=${encodeURIComponent(baseUrl + '/auth/callback')}`;
      break;
    case 'recovery':
      // Password reset - use Supabase native endpoint with redirect to our reset page
      actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=recovery&redirect_to=${encodeURIComponent(baseUrl + '/auth/reset')}`;
      break;
    case 'magiclink':
      // Magic link login
      actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=magiclink&redirect_to=${encodeURIComponent(baseUrl + '/auth/callback')}`;
      break;
    case 'email_change':
      // Email change confirmation
      actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=email_change&redirect_to=${encodeURIComponent(baseUrl + '/auth/callback')}`;
      break;
    case 'invite':
      // Owner invitation
      actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=invite&redirect_to=${encodeURIComponent(baseUrl + '/auth/callback')}`;
      break;
    default:
      actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(baseUrl + '/auth/callback')}`;
  }

  console.log(`[send-auth-email] Processing ${email_action_type} email for ${user.email}`);

  try {
    const { html, subject } = generateEmailHtml(email_action_type, actionUrl);

    // Send email via Resend with verified domain
    const { error } = await resend.emails.send({
      from: "Roomy Security <security@roomylb.com>",
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error("[send-auth-email] Resend error:", error);
      throw error;
    }

    console.log(`[send-auth-email] Successfully sent ${email_action_type} email to ${user.email}`);

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("[send-auth-email] Error sending email:", error);
    const err = error as { code?: number; message?: string };
    return new Response(
      JSON.stringify({
        error: {
          http_code: err.code || 500,
          message: err.message || "Failed to send email",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
