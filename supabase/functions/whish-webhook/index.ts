import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify Whish webhook signature
    const whishWebhookSecret = Deno.env.get('WHISH_WEBHOOK_SECRET');
    
    if (whishWebhookSecret && whishWebhookSecret !== '__REPLACE_ME__') {
      // Get signature from header (adjust based on Whish docs)
      const signature = req.headers.get('x-whish-signature') || req.headers.get('whish-signature');
      
      if (!signature) {
        console.error('Missing webhook signature');
        return new Response(
          JSON.stringify({ error: 'Missing signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Verify signature (implement based on Whish documentation)
      // For now, just log that verification is enabled
      console.log('Webhook signature verification enabled');
      
      // TODO: Implement actual signature verification
      // const isValid = verifySignature(payload, signature, whishWebhookSecret);
      // if (!isValid) {
      //   return new Response(
      //     JSON.stringify({ error: 'Invalid signature' }),
      //     { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      //   );
      // }
    } else {
      console.warn('Webhook signature verification disabled (preview mode)');
    }

    const payload = await req.json();
    console.log('Whish webhook received:', { type: payload.type, id: payload.id });

    // Handle different webhook event types
    switch (payload.type) {
      case 'payment.succeeded':
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(supabaseClient, payload);
        break;

      case 'payment.failed':
      case 'payment_intent.failed':
        await handlePaymentFailure(supabaseClient, payload);
        break;

      default:
        console.log('Unhandled webhook event type:', payload.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function handlePaymentSuccess(supabaseClient: any, payload: any) {
  const metadata = payload.metadata || {};
  const paymentType = metadata.payment_type;

  if (paymentType === 'reservation') {
    await handleReservationPayment(supabaseClient, payload, metadata);
  } else if (paymentType === 'match_plan') {
    await handleMatchPlanPayment(supabaseClient, payload, metadata);
  }
}

async function handleReservationPayment(supabaseClient: any, payload: any, metadata: any) {
  const reservationId = metadata.reservation_id;

  if (!reservationId) {
    console.error('No reservation_id in metadata');
    return;
  }

  // Get reservation
  const { data: reservation, error: resError } = await supabaseClient
    .from('reservations')
    .select('*, rooms!inner(*)')
    .eq('id', reservationId)
    .single();

  if (resError || !reservation) {
    console.error('Reservation not found:', reservationId);
    return;
  }

  // Update reservation status
  await supabaseClient
    .from('reservations')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      whish_payment_id: payload.id,
    })
    .eq('id', reservationId);

  // Create payment record
  await supabaseClient
    .from('payments')
    .insert({
      student_id: reservation.student_id,
      payment_type: 'reservation',
      reservation_id: reservationId,
      amount: reservation.reservation_fee_amount,
      currency: payload.currency || 'USD',
      provider: 'whish',
      whish_payment_id: payload.id,
      status: 'succeeded',
      raw_payload: payload,
    });

  // Update room capacity
  const { data: room } = await supabaseClient
    .from('rooms')
    .select('capacity, capacity_occupied')
    .eq('id', reservation.room_id)
    .single();

  if (room) {
    const newCapacity = (room.capacity_occupied || 0) + 1;
    const isAvailable = newCapacity < room.capacity;

    await supabaseClient
      .from('rooms')
      .update({
        capacity_occupied: newCapacity,
        available: isAvailable,
      })
      .eq('id', reservation.room_id);
  }

  console.log('Reservation payment processed:', {
    reservationId,
    roomId: reservation.room_id,
    studentId: reservation.student_id,
  });

  // TODO: Send notifications to owner and student
}

async function handleMatchPlanPayment(supabaseClient: any, payload: any, metadata: any) {
  const studentId = metadata.student_id;
  const planType = metadata.plan_type;

  if (!studentId || !planType) {
    console.error('Missing student_id or plan_type in metadata');
    return;
  }

  // Create payment record
  const { data: payment, error: paymentError } = await supabaseClient
    .from('payments')
    .insert({
      student_id: studentId,
      payment_type: 'match_plan',
      match_plan_type: planType,
      amount: payload.amount / 100, // Convert cents to dollars
      currency: payload.currency || 'USD',
      provider: 'whish',
      whish_payment_id: payload.id,
      status: 'succeeded',
      raw_payload: payload,
    })
    .select()
    .single();

  if (paymentError) {
    console.error('Failed to create payment record:', paymentError);
    return;
  }

  // Create or update match plan
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  // Deactivate any existing active plans
  await supabaseClient
    .from('student_match_plans')
    .update({ status: 'expired' })
    .eq('student_id', studentId)
    .eq('status', 'active');

  // Create new plan
  await supabaseClient
    .from('student_match_plans')
    .insert({
      student_id: studentId,
      plan_type: planType,
      status: 'active',
      expires_at: expiresAt.toISOString(),
      payment_id: payment.id,
    });

  // Update student record
  await supabaseClient
    .from('students')
    .update({
      ai_match_plan: planType,
      ai_match_tier_last_paid_at: new Date().toISOString(),
    })
    .eq('id', studentId);

  console.log('Match plan activated:', {
    studentId,
    planType,
    expiresAt: expiresAt.toISOString(),
  });

  // TODO: Send confirmation notification to student
}

async function handlePaymentFailure(supabaseClient: any, payload: any) {
  const metadata = payload.metadata || {};
  const paymentType = metadata.payment_type;

  console.log('Payment failed:', { type: paymentType, id: payload.id });

  // Create failed payment record
  if (metadata.student_id) {
    await supabaseClient
      .from('payments')
      .insert({
        student_id: metadata.student_id,
        payment_type: paymentType,
        reservation_id: metadata.reservation_id,
        match_plan_type: metadata.plan_type,
        amount: payload.amount / 100,
        currency: payload.currency || 'USD',
        provider: 'whish',
        whish_payment_id: payload.id,
        status: 'failed',
        raw_payload: payload,
      });
  }

  // Update reservation if applicable
  if (paymentType === 'reservation' && metadata.reservation_id) {
    await supabaseClient
      .from('reservations')
      .update({ status: 'expired' })
      .eq('id', metadata.reservation_id);
  }
}
