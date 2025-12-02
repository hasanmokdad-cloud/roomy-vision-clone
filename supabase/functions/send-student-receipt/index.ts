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
      console.log('Resend: Running in preview mode - no email sent');
      return new Response(
        JSON.stringify({ success: true, preview: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send receipt email via Resend
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .receipt-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .line-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total { font-size: 18px; font-weight: bold; color: #22c55e; padding-top: 10px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Payment Confirmed</h1>
              <p>Thank you for your reservation!</p>
            </div>
            <div class="content">
              <p>Hi ${student.full_name},</p>
              <p>Your payment has been successfully processed. Here are your reservation details:</p>
              
              <div class="receipt-box">
                <h3>Reservation Details</h3>
                <div class="line-item">
                  <span>Dorm:</span>
                  <strong>${dorm_name}</strong>
                </div>
                <div class="line-item">
                  <span>Room:</span>
                  <strong>${room_name}</strong>
                </div>
                <div class="line-item">
                  <span>Date:</span>
                  <span>${new Date(timestamp).toLocaleDateString()}</span>
                </div>
              </div>

              <div class="receipt-box">
                <h3>Payment Breakdown</h3>
                <div class="line-item">
                  <span>Room Deposit</span>
                  <span>$${deposit.toFixed(2)}</span>
                </div>
                <div class="line-item">
                  <span>Roomy Fee (10%)</span>
                  <span>$${fee.toFixed(2)}</span>
                </div>
                <div class="line-item total">
                  <span>Total Paid</span>
                  <span>$${total.toFixed(2)}</span>
                </div>
                <div style="margin-top: 15px; font-size: 12px; color: #666;">
                  <strong>Payment ID:</strong> ${whish_payment_id}
                </div>
              </div>

              <p style="margin-top: 30px;">
                <strong>What's Next?</strong><br>
                The dorm owner will contact you soon with move-in details and next steps.
                You can view your reservation anytime in your Roomy profile.
              </p>

              <div class="footer">
                <p>Questions? Contact us at support@roomy.com</p>
                <p>&copy; ${new Date().getFullYear()} Roomy. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Roomy <noreply@roomy.com>',
        to: [student.email],
        subject: `Payment Confirmed - ${room_name} at ${dorm_name}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      throw new Error(`Resend API error: ${errorText}`);
    }

    console.log('Student receipt email sent to:', student.email);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending student receipt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
