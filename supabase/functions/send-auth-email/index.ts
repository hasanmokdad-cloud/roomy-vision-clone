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

// Email template generator
function generateEmailHtml(type: string, actionUrl: string): { html: string; subject: string } {
  const baseStyles = `
    body { background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 32px; font-weight: 700; color: #4A00E0; margin: 0 0 8px 0; }
    .tagline { font-size: 14px; color: #71717a; margin: 0; }
    .card { background-color: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .heading { font-size: 24px; font-weight: 700; color: #18181b; text-align: center; margin: 0 0 16px 0; }
    .text { font-size: 16px; color: #3f3f46; line-height: 24px; text-align: center; margin: 0 0 24px 0; }
    .button { background: linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%); border-radius: 12px; color: #ffffff; font-size: 16px; font-weight: 600; padding: 14px 24px; text-align: center; text-decoration: none; display: block; width: fit-content; margin: 24px auto; }
    .disclaimer { font-size: 14px; color: #71717a; text-align: center; margin: 24px 0 0 0; }
    .footer { text-align: center; margin-top: 32px; }
    .footer-text { font-size: 12px; color: #71717a; margin: 0 0 12px 0; }
    .footer-link { color: #4A00E0; text-decoration: none; }
    .copyright { font-size: 11px; color: #a1a1aa; margin: 0; }
  `;

  const templates: Record<string, { heading: string; text: string; buttonText: string; disclaimer: string; subject: string }> = {
    signup: {
      heading: "Verify your email",
      text: "Welcome to Roomy! Click the button below to activate your account and start finding your perfect dorm or roommate.",
      buttonText: "Verify Email",
      disclaimer: "If you didn't create this account, you can safely ignore this email.",
      subject: "Verify your email for Roomy"
    },
    email: {
      heading: "Verify your email",
      text: "Welcome to Roomy! Click the button below to activate your account and start finding your perfect dorm or roommate.",
      buttonText: "Verify Email",
      disclaimer: "If you didn't create this account, you can safely ignore this email.",
      subject: "Verify your email for Roomy"
    },
    recovery: {
      heading: "Reset your password",
      text: "You requested to reset your Roomy account password. Click the button below to choose a new password.",
      buttonText: "Reset Password",
      disclaimer: "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.",
      subject: "Reset your Roomy password"
    },
    magiclink: {
      heading: "Log in to Roomy",
      text: "Click the button below to instantly sign in to your Roomy account. This link will expire in 1 hour.",
      buttonText: "Log in to Roomy",
      disclaimer: "If you didn't request this login link, you can safely ignore this email.",
      subject: "Your Roomy login link"
    },
    email_change: {
      heading: "Confirm email change",
      text: "You requested to update your email address on Roomy. Click the button below to confirm your new email.",
      buttonText: "Confirm Email Change",
      disclaimer: "If you didn't request this change, please contact our support team immediately.",
      subject: "Confirm your new Roomy email"
    },
    invite: {
      heading: "Welcome to Roomy for Owners",
      text: "You've been invited to manage your dorm listing on Roomy. Join thousands of owners connecting with students looking for their perfect living space.",
      buttonText: "Accept Invitation",
      disclaimer: "If you were not expecting this invitation, you can safely ignore this email.",
      subject: "You're invited to manage your dorm on Roomy"
    }
  };

  const template = templates[type] || templates.signup;
  const year = new Date().getFullYear();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.subject}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <p class="logo">🏠 Roomy</p>
      <p class="tagline">AI-Powered Dorm & Roommate Matching</p>
    </div>

    <!-- Main Content Card -->
    <div class="card">
      <h1 class="heading">${template.heading}</h1>
      <p class="text">${template.text}</p>
      <a href="${actionUrl}" class="button" style="color: #ffffff;">${template.buttonText}</a>
      <p class="disclaimer">${template.disclaimer}</p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">You're receiving this email because you signed up for Roomy.</p>
      <p class="footer-text">
        <a href="https://roomy.app/support" class="footer-link">Support</a> • 
        <a href="https://roomy.app/privacy" class="footer-link">Privacy Policy</a> • 
        <a href="https://roomy.app/terms" class="footer-link">Terms of Service</a>
      </p>
      <p class="copyright">© ${year} Roomy. All rights reserved.</p>
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
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? site_url;
  const actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

  console.log(`Processing ${email_action_type} email for ${user.email}`);

  try {
    const { html, subject } = generateEmailHtml(email_action_type, actionUrl);

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: "Roomy <noreply@roomy.app>",
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log(`Successfully sent ${email_action_type} email to ${user.email}`);

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending email:", error);
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
