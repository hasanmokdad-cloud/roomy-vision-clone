import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HMAC-SHA256 signature verification for production webhook security
async function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Import the secret key for HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Compute the HMAC signature
    const payloadData = encoder.encode(payload);
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
    
    // Convert to hex string
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Handle different signature formats (with or without prefix)
    const normalizedSignature = signature.replace(/^sha256=/, '').toLowerCase();
    const normalizedComputed = computedSignature.toLowerCase();
    
    // Constant-time comparison to prevent timing attacks
    if (normalizedSignature.length !== normalizedComputed.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < normalizedSignature.length; i++) {
      result |= normalizedSignature.charCodeAt(i) ^ normalizedComputed.charCodeAt(i);
    }
    
    return result === 0;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

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

    // Read raw body FIRST (before parsing) for signature verification
    const rawBody = await req.text();
    
    // Verify Whish webhook signature
    const whishWebhookSecret = Deno.env.get('WHISH_WEBHOOK_SECRET');
    
    if (whishWebhookSecret && whishWebhookSecret !== '__REPLACE_ME__') {
      const signature = req.headers.get('x-whish-signature') || req.headers.get('whish-signature');
      
      if (!signature) {
        console.error('Missing webhook signature');
        return new Response(
          JSON.stringify({ error: 'Missing signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Cryptographically verify the signature
      const isValid = await verifyHmacSignature(rawBody, signature, whishWebhookSecret);
      
      if (!isValid) {
        console.error('Invalid webhook signature - possible tampering detected');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Webhook signature verified successfully');
    } else {
      console.warn('Webhook signature verification disabled (preview mode)');
    }

    // Parse the payload after signature verification
    const payload = JSON.parse(rawBody);
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

  // Get reservation with room and dorm info
  const { data: reservation, error: resError } = await supabaseClient
    .from('reservations')
    .select('*, rooms!inner(*, dorms!inner(owner_id, name, dorm_name))')
    .eq('id', reservationId)
    .single();

  if (resError || !reservation) {
    console.error('Reservation not found:', reservationId);
    return;
  }

  // Calculate payout amounts (server-side, never trust client)
  const baseDeposit = reservation.deposit_amount;
  const roomyFee = baseDeposit * 0.10;
  const ownerPayout = baseDeposit; // Owner gets full deposit amount
  const ownerId = reservation.rooms?.dorms?.owner_id;

  // Update reservation status with payout details
  await supabaseClient
    .from('reservations')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      whish_payment_id: payload.id,
      owner_payout_amount: ownerPayout,
      roomy_commission_amount: roomyFee,
      owner_payout_status: 'pending',
      roomy_commission_captured: false,
    })
    .eq('id', reservationId);

  console.log('Payout calculated:', {
    baseDeposit,
    roomyFee,
    ownerPayout,
    total: baseDeposit + roomyFee,
    ownerId,
  });

  // Create payment record with total amount
  const { data: payment } = await supabaseClient
    .from('payments')
    .insert({
      student_id: reservation.student_id,
      payment_type: 'reservation',
      reservation_id: reservationId,
      amount: reservation.total_amount || reservation.reservation_fee_amount,
      currency: payload.currency || 'USD',
      provider: 'whish',
      whish_payment_id: payload.id,
      status: 'succeeded',
      raw_payload: payload,
    })
    .select()
    .single();

  // Insert payout_history record for owner
  if (ownerId) {
    await supabaseClient
      .from('payout_history')
      .insert({
        owner_id: ownerId,
        student_id: reservation.student_id,
        room_id: reservation.room_id,
        dorm_id: reservation.dorm_id,
        deposit_amount: baseDeposit,
        roomy_fee: roomyFee,
        owner_receives: ownerPayout,
        payment_id: payment?.id,
        reservation_id: reservationId,
        status: 'paid',
        currency: 'USD',
      });

    // Insert admin_income_history record for Roomy's 10% commission
    await supabaseClient
      .from('admin_income_history')
      .insert({
        reservation_id: reservationId,
        student_id: reservation.student_id,
        owner_id: ownerId,
        commission_amount: roomyFee,
        payment_id: payment?.id,
        currency: 'USD',
        status: 'captured',
      });

    // Increment owner's wallet balance
    await supabaseClient.rpc('increment_owner_balance', {
      p_owner_id: ownerId,
      p_amount: ownerPayout,
    });

    // Increment admin wallet balance with Roomy's 10% commission
    const { data: adminWallet } = await supabaseClient
      .from('admin_wallet')
      .select('admin_id')
      .limit(1)
      .single();

    if (adminWallet) {
      await supabaseClient.rpc('increment_admin_balance', {
        p_admin_id: adminWallet.admin_id,
        p_amount: roomyFee,
      });
      console.log('Admin commission recorded:', { adminId: adminWallet.admin_id, amount: roomyFee });
    }

    console.log('Owner payout recorded:', {
      ownerId,
      ownerPayout,
      roomyFee,
    });
  }

  // Increment room capacity using database function
  await supabaseClient.rpc('increment_room_occupancy', { 
    room_id: reservation.room_id 
  });

  // Increment roomy_confirmed_occupants for reservation-based bookings
  const { data: currentRoom } = await supabaseClient
    .from('rooms')
    .select('roomy_confirmed_occupants')
    .eq('id', reservation.room_id)
    .single();

  if (currentRoom) {
    await supabaseClient
      .from('rooms')
      .update({ 
        roomy_confirmed_occupants: (currentRoom.roomy_confirmed_occupants || 0) + 1 
      })
      .eq('id', reservation.room_id);
  }

  // Update student's current dorm/room after successful payment with room confirmation
  await supabaseClient
    .from('students')
    .update({
      current_dorm_id: reservation.dorm_id,
      current_room_id: reservation.room_id,
      accommodation_status: 'have_dorm',
      room_confirmed: true,
      room_confirmed_at: new Date().toISOString(),
      confirmation_type: 'reservation'
    })
    .eq('id', reservation.student_id);

  // Create a confirmed room_occupancy_claim for consistency tracking
  await supabaseClient
    .from('room_occupancy_claims')
    .insert({
      student_id: reservation.student_id,
      room_id: reservation.room_id,
      dorm_id: reservation.dorm_id,
      owner_id: ownerId,
      status: 'confirmed',
      claim_type: 'reservation',
      confirmed_at: new Date().toISOString()
    });

  console.log('Reservation payment processed:', {
    reservationId,
    roomId: reservation.room_id,
    studentId: reservation.student_id,
    autoUpdatedStudentProfile: true,
    roomConfirmed: true,
    claimCreated: true
  });

  // Get room and dorm details for notifications
  const { data: room } = await supabaseClient
    .from('rooms')
    .select('name, price, dorms!inner(dorm_name, name, owner_id)')
    .eq('id', reservation.room_id)
    .single();

  if (room) {
    // Get student details
    const { data: student } = await supabaseClient
      .from('students')
      .select('full_name')
      .eq('id', reservation.student_id)
      .single();

    // Send owner notification
    if (room.dorms.owner_id && student) {
      await supabaseClient.functions.invoke('send-owner-notification', {
        body: {
          owner_id: room.dorms.owner_id,
          event_type: 'new_reservation',
          dorm_id: reservation.dorm_id,
          room_name: room.name,
          student_name: student.full_name,
          deposit_amount: reservation.deposit_amount,
          commission_amount: reservation.commission_amount,
        }
      }).catch((err: any) => console.error('Error sending owner notification:', err));
    }

    // Send student receipt email
    await supabaseClient.functions.invoke('send-student-receipt', {
      body: {
        student_id: reservation.student_id,
        reservation_id: reservationId,
        room_name: room.name,
        dorm_name: room.dorms.dorm_name || room.dorms.name,
        deposit: reservation.deposit_amount,
        fee: reservation.commission_amount,
        total: reservation.total_amount,
        whish_payment_id: payload.id,
        timestamp: new Date().toISOString(),
      }
    }).catch((err: any) => console.error('Error sending student receipt:', err));
  }
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
      amount: payload.amount / 100,
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
