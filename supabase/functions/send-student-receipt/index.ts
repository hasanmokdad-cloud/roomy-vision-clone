import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReceiptRequest {
  student_id: string;
  reservation_id: string;
  room_name: string;
  dorm_name: string;
  deposit: number;
  fee: number;
  total: number;
  whish_payment_id: string;
  timestamp: string;
}

// Roomy branded email template for payment receipts
function generateReceiptHtml(
  studentName: string,
  dormName: string,
  roomName: string,
  deposit: number,
  fee: number,
  total: number,
  whishPaymentId: string,
  timestamp: string
): string {
  const year = new Date().getFullYear();
  const formattedDate = new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>Payment Confirmed - Roomy</title>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      min-height: 100vh;
    }
    .wrapper { width: 100%; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 0 20px; }
    .header { text-align: center; padding: 32px 0 24px 0; }
    .logo { font-size: 36px; font-weight: 800; color: #A855F7; margin: 0; }
    .tagline { font-size: 14px; color: #94A3B8; margin: 8px 0 0 0; }
    .card { background: #ffffff; border-radius: 24px; padding: 48px 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .success-icon { text-align: center; font-size: 56px; margin-bottom: 16px; }
    .heading { font-size: 28px; font-weight: 700; color: #0F172A; text-align: center; margin: 0 0 8px 0; }
    .subheading { font-size: 16px; color: #64748B; text-align: center; margin: 0 0 32px 0; }
    .greeting { font-size: 16px; color: #334155; margin: 0 0 24px 0; }
    .receipt-box { background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #E2E8F0; }
    .receipt-title { font-size: 14px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0; }
    .receipt-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E2E8F0; }
    .receipt-row:last-child { border-bottom: none; }
    .receipt-label { font-size: 14px; color: #64748B; }
    .receipt-value { font-size: 14px; font-weight: 600; color: #0F172A; }
    .total-row { background: linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%); margin: 16px -24px -24px -24px; padding: 20px 24px; border-radius: 0 0 16px 16px; display: flex; justify-content: space-between; }
    .total-label { font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.9); }
    .total-value { font-size: 20px; font-weight: 700; color: #ffffff; }
    .payment-id { font-size: 12px; color: #94A3B8; text-align: center; margin: 16px 0 0 0; }
    .payment-id code { background: #F1F5F9; padding: 4px 8px; border-radius: 6px; font-family: monospace; color: #64748B; }
    .next-steps { background: #ECFDF5; border-radius: 12px; padding: 20px; margin: 32px 0; border-left: 4px solid #10B981; }
    .next-steps-title { font-size: 14px; font-weight: 600; color: #059669; margin: 0 0 8px 0; }
    .next-steps-text { font-size: 14px; color: #047857; margin: 0; line-height: 1.6; }
    .button-container { text-align: center; margin: 32px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%); color: #ffffff !important; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 12px; text-decoration: none; }
    .footer { text-align: center; padding: 32px 0; }
    .footer-links { margin: 0 0 16px 0; }
    .footer-link { color: #94A3B8; text-decoration: none; font-size: 13px; margin: 0 12px; }
    .copyright { font-size: 12px; color: #64748B; margin: 16px 0 0 0; }
    
    @media (prefers-color-scheme: dark) {
      .card { background: #1E293B; }
      .heading { color: #F8FAFC; }
      .subheading, .greeting { color: #CBD5E1; }
      .receipt-box { background: #334155; border-color: #475569; }
      .receipt-row { border-color: #475569; }
      .receipt-value { color: #F8FAFC; }
    }
    
    @media only screen and (max-width: 480px) {
      .container { padding: 0 16px; }
      .card { padding: 32px 24px; border-radius: 20px; }
      .heading { font-size: 24px; }
      .receipt-box { padding: 20px; }
      .total-row { margin: 16px -20px -20px -20px; padding: 16px 20px; }
    }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">
    Payment confirmed! Your room at ${dormName} is reserved. &nbsp;‌&nbsp;‌&nbsp;‌
  </div>
  
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <p class="logo">🏠 Roomy</p>
        <p class="tagline">AI-Powered Student Housing</p>
      </div>

      <div class="card">
        <div class="success-icon">✅</div>
        <h1 class="heading">Payment Confirmed!</h1>
        <p class="subheading">Your reservation is now secured</p>
        
        <p class="greeting">Hi ${studentName},</p>
        <p style="font-size: 16px; color: #334155; margin: 0 0 24px 0; line-height: 1.6;">
          Great news! Your payment has been successfully processed and your room is now reserved. Here are your reservation details:
        </p>
        
        <div class="receipt-box">
          <p class="receipt-title">Reservation Details</p>
          <div class="receipt-row">
            <span class="receipt-label">Dorm</span>
            <span class="receipt-value">${dormName}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Room</span>
            <span class="receipt-value">${roomName}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Date</span>
            <span class="receipt-value">${formattedDate}</span>
          </div>
        </div>

        <div class="receipt-box">
          <p class="receipt-title">Payment Summary</p>
          <div class="receipt-row">
            <span class="receipt-label">Room Deposit</span>
            <span class="receipt-value">$${deposit.toFixed(2)}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Service Fee</span>
            <span class="receipt-value">$${fee.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span class="total-label">Total Paid</span>
            <span class="total-value">$${total.toFixed(2)}</span>
          </div>
        </div>
        
        <p class="payment-id">
          Payment ID: <code>${whishPaymentId}</code>
        </p>

        <div class="next-steps">
          <p class="next-steps-title">🎯 What's Next?</p>
          <p class="next-steps-text">
            The dorm owner will contact you soon with move-in details and next steps. You can view your reservation anytime in your Roomy profile.
          </p>
        </div>

        <div class="button-container">
          <a href="https://roomylb.com/profile" class="button">View Your Reservation</a>
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
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const receiptData = await req.json() as ReceiptRequest;
    const { student_id, room_name, dorm_name, deposit, fee, total, whish_payment_id, timestamp } = receiptData;

    // Get student details
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('full_name, email')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      throw new Error('Student not found');
    }

    // Check if Resend API key is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey || resendApiKey === '__REPLACE_ME__') {
      console.log('[send-student-receipt] Resend: Running in preview mode - no email sent');
      return new Response(
        JSON.stringify({ success: true, preview: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate Roomy branded receipt email
    const emailHtml = generateReceiptHtml(
      student.full_name,
      dorm_name,
      room_name,
      deposit,
      fee,
      total,
      whish_payment_id,
      timestamp
    );

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Roomy <onboarding@resend.dev>',
        to: [student.email],
        subject: `✅ Payment Confirmed - ${room_name} at ${dorm_name}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      throw new Error(`Resend API error: ${errorText}`);
    }

    console.log('[send-student-receipt] Student receipt email sent to:', student.email);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[send-student-receipt] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
