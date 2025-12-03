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

// Roomy branded email base styles with dark mode support
function getRoomyEmailStyles(): string {
  return `
    /* Reset */
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    
    /* Base styles */
    body { 
      margin: 0 !important; 
      padding: 0 !important; 
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      min-height: 100vh;
    }
    
    .email-wrapper {
      width: 100%;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
      padding: 40px 0;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    /* Header */
    .email-header {
      text-align: center;
      padding: 32px 0 24px 0;
    }
    
    .logo-container {
      display: inline-block;
      background: linear-gradient(135deg, rgba(142, 45, 226, 0.2) 0%, rgba(74, 0, 224, 0.2) 100%);
      padding: 16px 32px;
      border-radius: 16px;
      margin-bottom: 12px;
    }
    
    .logo-text {
      font-size: 36px;
      font-weight: 800;
      background: linear-gradient(135deg, #A855F7 0%, #8B5CF6 50%, #6366F1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
      letter-spacing: -0.5px;
    }
    
    .tagline {
      font-size: 14px;
      color: #94A3B8;
      margin: 8px 0 0 0;
      letter-spacing: 0.5px;
    }
    
    /* Card */
    .email-card {
      background: #ffffff;
      border-radius: 24px;
      padding: 48px 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    }
    
    .email-heading {
      font-size: 28px;
      font-weight: 700;
      color: #0F172A;
      text-align: center;
      margin: 0 0 8px 0;
      line-height: 1.3;
    }
    
    .email-subheading {
      font-size: 16px;
      color: #64748B;
      text-align: center;
      margin: 0 0 32px 0;
      line-height: 1.6;
    }
    
    .email-text {
      font-size: 16px;
      color: #334155;
      line-height: 26px;
      text-align: center;
      margin: 0 0 32px 0;
    }
    
    /* Button */
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    
    .email-button {
      display: inline-block;
      background: linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%);
      color: #ffffff !important;
      font-size: 16px;
      font-weight: 600;
      padding: 16px 40px;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 10px 25px -5px rgba(142, 45, 226, 0.4);
      transition: all 0.2s ease;
    }
    
    .email-button:hover {
      box-shadow: 0 15px 35px -5px rgba(142, 45, 226, 0.5);
      transform: translateY(-2px);
    }
    
    /* Backup URL */
    .backup-url {
      font-size: 12px;
      color: #94A3B8;
      text-align: center;
      margin: 24px 0 0 0;
      word-break: break-all;
    }
    
    .backup-url a {
      color: #8B5CF6;
      text-decoration: none;
    }
    
    /* Disclaimer */
    .disclaimer {
      font-size: 14px;
      color: #64748B;
      text-align: center;
      margin: 32px 0 0 0;
      padding-top: 24px;
      border-top: 1px solid #E2E8F0;
    }
    
    /* Footer */
    .email-footer {
      text-align: center;
      padding: 32px 0;
    }
    
    .footer-links {
      margin: 0 0 16px 0;
    }
    
    .footer-link {
      color: #94A3B8;
      text-decoration: none;
      font-size: 13px;
      margin: 0 12px;
    }
    
    .footer-link:hover {
      color: #A855F7;
    }
    
    .footer-divider {
      color: #475569;
    }
    
    .copyright {
      font-size: 12px;
      color: #64748B;
      margin: 16px 0 0 0;
    }
    
    .social-links {
      margin: 16px 0 0 0;
    }
    
    .social-link {
      display: inline-block;
      margin: 0 8px;
      color: #94A3B8;
      text-decoration: none;
      font-size: 12px;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .email-card {
        background: #1E293B !important;
      }
      .email-heading {
        color: #F8FAFC !important;
      }
      .email-subheading,
      .email-text {
        color: #CBD5E1 !important;
      }
      .disclaimer {
        color: #94A3B8 !important;
        border-top-color: #334155 !important;
      }
    }
    
    /* Mobile responsiveness */
    @media only screen and (max-width: 480px) {
      .email-container {
        padding: 0 16px !important;
      }
      .email-card {
        padding: 32px 24px !important;
        border-radius: 20px !important;
      }
      .email-heading {
        font-size: 24px !important;
      }
      .logo-text {
        font-size: 28px !important;
      }
      .email-button {
        display: block !important;
        width: 100% !important;
        padding: 16px 24px !important;
        text-align: center !important;
      }
      .footer-link {
        display: block !important;
        margin: 8px 0 !important;
      }
      .footer-divider {
        display: none !important;
      }
    }
  `;
}

// Email template generator with Roomy branding
function generateEmailHtml(type: string, actionUrl: string): { html: string; subject: string } {
  const styles = getRoomyEmailStyles();
  const year = new Date().getFullYear();

  const templates: Record<string, { 
    emoji: string;
    heading: string; 
    subheading: string;
    text: string; 
    buttonText: string; 
    disclaimer: string; 
    subject: string;
    expiry?: string;
  }> = {
    signup: {
      emoji: "🎉",
      heading: "Welcome to Roomy!",
      subheading: "You're one step away from finding your perfect student home.",
      text: "Click the button below to verify your email and start exploring AI-powered dorm and roommate matches.",
      buttonText: "Verify Email",
      disclaimer: "If you didn't create this account, you can safely ignore this email.",
      subject: "Verify your email for Roomy"
    },
    email: {
      emoji: "🎉",
      heading: "Welcome to Roomy!",
      subheading: "You're one step away from finding your perfect student home.",
      text: "Click the button below to verify your email and start exploring AI-powered dorm and roommate matches.",
      buttonText: "Verify Email",
      disclaimer: "If you didn't create this account, you can safely ignore this email.",
      subject: "Verify your email for Roomy"
    },
    recovery: {
      emoji: "🔐",
      heading: "Reset your password",
      subheading: "Someone requested a password reset for your account.",
      text: "Click the button below to choose a new password. If you didn't request this, you can safely ignore this email.",
      buttonText: "Reset Password",
      disclaimer: "Your password will remain unchanged if you ignore this email. This link expires in 1 hour.",
      subject: "Reset your Roomy password"
    },
    magiclink: {
      emoji: "🔑",
      heading: "Sign in to Roomy",
      subheading: "Click below to instantly access your account.",
      text: "Use this magic link to sign in to your Roomy account without entering your password.",
      buttonText: "Log in to Roomy",
      disclaimer: "If you didn't request this login link, you can safely ignore this email.",
      subject: "Your Roomy login link",
      expiry: "This link expires in 10 minutes."
    },
    email_change: {
      emoji: "✉️",
      heading: "Confirm your new email",
      subheading: "You requested to update your email address.",
      text: "Click the button below to confirm your new email address on Roomy.",
      buttonText: "Confirm Email Change",
      disclaimer: "If you didn't request this change, please contact our support team immediately.",
      subject: "Confirm your new Roomy email"
    },
    invite: {
      emoji: "🏠",
      heading: "Welcome to Roomy for Owners",
      subheading: "You've been invited to manage your dorm listing.",
      text: "Join thousands of owners connecting with students looking for their perfect living space. Accept your invitation to get started.",
      buttonText: "Accept Invitation",
      disclaimer: "If you were not expecting this invitation, you can safely ignore this email.",
      subject: "You're invited to manage your dorm on Roomy"
    }
  };

  const template = templates[type] || templates.signup;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${template.subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>${styles}</style>
</head>
<body>
  <!-- Hidden preheader text -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${template.subheading} &nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌
  </div>
  
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <div class="logo-container">
          <p class="logo-text">🏠 Roomy</p>
        </div>
        <p class="tagline">AI-Powered Student Housing</p>
      </div>

      <!-- Main Card -->
      <div class="email-card">
        <div style="text-align: center; font-size: 48px; margin-bottom: 16px;">${template.emoji}</div>
        <h1 class="email-heading">${template.heading}</h1>
        <p class="email-subheading">${template.subheading}</p>
        <p class="email-text">${template.text}</p>
        
        <div class="button-container">
          <a href="${actionUrl}" class="email-button" style="color: #ffffff !important;">${template.buttonText}</a>
        </div>
        
        ${template.expiry ? `<p style="text-align: center; font-size: 13px; color: #F59E0B; margin: 16px 0 0 0;">⏱️ ${template.expiry}</p>` : ''}
        
        <p class="backup-url">
          Or copy and paste this link into your browser:<br>
          <a href="${actionUrl}">${actionUrl}</a>
        </p>
        
        <p class="disclaimer">${template.disclaimer}</p>
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <div class="footer-links">
          <a href="https://roomylb.com/contact" class="footer-link">Support</a>
          <span class="footer-divider">•</span>
          <a href="https://roomylb.com/legal#privacy" class="footer-link">Privacy Policy</a>
          <span class="footer-divider">•</span>
          <a href="https://roomylb.com/legal#terms" class="footer-link">Terms of Service</a>
        </div>
        <p class="copyright">© ${year} Roomy — Student Housing Reinvented</p>
        <div class="social-links">
          <a href="https://instagram.com/roomy" class="social-link">Instagram</a>
          <span class="footer-divider">•</span>
          <a href="https://roomylb.com" class="social-link">roomylb.com</a>
        </div>
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
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? site_url;
  const actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

  console.log(`[send-auth-email] Processing ${email_action_type} email for ${user.email}`);

  try {
    const { html, subject } = generateEmailHtml(email_action_type, actionUrl);

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: "Roomy <onboarding@resend.dev>",
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
