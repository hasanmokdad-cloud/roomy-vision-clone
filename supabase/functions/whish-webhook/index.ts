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
  const dormName = reservation.rooms?.dorms?.dorm_name || reservation.rooms?.dorms?.name || 'Dorm';
  const roomName = reservation.rooms?.name || 'Room';

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

  // Fetch student details with user_id for notifications
  const { data: student } = await supabaseClient
    .from('students')
    .select('id, user_id, full_name, email')
    .eq('id', reservation.student_id)
    .single();

  // Fetch owner details for notifications
  const { data: owner } = await supabaseClient
    .from('owners')
    .select('id, user_id, full_name, email')
    .eq('id', ownerId)
    .single();

  const studentFullName = student?.full_name || 'A student';
  const ownerFullName = owner?.full_name || 'Owner';
  const totalAmount = reservation.total_amount || (baseDeposit + roomyFee);

  // ========== SEND IN-APP NOTIFICATIONS ==========

  // 1. Student in-app notification
  if (student?.user_id) {
    await supabaseClient.from('notifications').insert({
      user_id: student.user_id,
      title: 'Payment Confirmed!',
      message: `Your room "${roomName}" at ${dormName} is now reserved. You paid $${totalAmount.toFixed(2)} deposit.`,
      lang: 'en',
      metadata: {
        type: 'reservation_payment',
        reservation_id: reservationId,
        room_name: roomName,
        dorm_name: dormName,
        amount: totalAmount
      }
    });
    console.log('Student in-app notification sent:', student.user_id);
  }

  // 2. Owner in-app notification (enhanced with student, room, dorm details)
  if (ownerId) {
    await supabaseClient.from('owner_notifications').insert({
      owner_id: ownerId,
      dorm_id: reservation.dorm_id,
      title: 'New Reservation Payment!',
      body: `${studentFullName} has reserved "${roomName}" in ${dormName}. You received $${ownerPayout.toFixed(2)}.`
    });
    console.log('Owner in-app notification sent:', ownerId);
  }

  // 3. Admin in-app notifications (notify all admins)
  const { data: admins } = await supabaseClient
    .from('admins')
    .select('id');

  if (admins && admins.length > 0) {
    const adminNotifications = admins.map((admin: { id: string }) => ({
      admin_id: admin.id,
      title: 'New Reservation Payment',
      body: `${studentFullName} reserved "${roomName}" in ${dormName} (owned by ${ownerFullName}). Roomy earned $${roomyFee.toFixed(2)} commission.`,
      type: 'payment',
      metadata: {
        reservation_id: reservationId,
        student_name: studentFullName,
        owner_name: ownerFullName,
        room_name: roomName,
        dorm_name: dormName,
        commission: roomyFee,
        owner_payout: ownerPayout,
        total_amount: totalAmount
      }
    }));

    await supabaseClient.from('admin_notifications').insert(adminNotifications);
    console.log('Admin in-app notifications sent to', admins.length, 'admins');
  }

  // ========== SEND EMAIL & WHATSAPP NOTIFICATIONS ==========

  // Queue owner email + WhatsApp notification via notifications_log (triggers send-owner-notification)
  if (owner && ownerId) {
    // Check if owner has WhatsApp notifications enabled
    const { data: ownerPrefs } = await supabaseClient
      .from('owners')
      .select('notify_whatsapp, notify_email, phone_number')
      .eq('id', ownerId)
      .single();

    // Determine notification channel based on owner preferences
    let notificationChannel = 'email';
    if (ownerPrefs?.notify_whatsapp && ownerPrefs?.phone_number) {
      if (ownerPrefs?.notify_email !== false) {
        notificationChannel = 'both'; // Send both email and WhatsApp
      } else {
        notificationChannel = 'whatsapp'; // Only WhatsApp
      }
    }

    const { data: notifLog } = await supabaseClient
      .from('notifications_log')
      .insert({
        owner_id: ownerId,
        dorm_id: reservation.dorm_id,
        event_type: 'new_reservation',
        sent_to: owner.email,
        status: 'pending',
        channel: notificationChannel,
        language: ownerPrefs?.phone_number?.startsWith('+961') ? 'AR' : 'EN',
        fields_changed: {
          student_name: studentFullName,
          room_name: roomName,
          dorm_name: dormName,
          deposit_amount: ownerPayout,
          total_amount: totalAmount,
          reservation_id: reservationId
        }
      })
      .select()
      .single();

    // Invoke the send-owner-notification function (handles both email and WhatsApp)
    if (notifLog) {
      await supabaseClient.functions.invoke('send-owner-notification', {
        body: { notificationId: notifLog.id }
      }).catch((err: any) => console.error('Error sending owner payout notification:', err));
    }

    console.log('Owner notification queued:', { channel: notificationChannel, ownerId });
  }

  // ========== SEND PUSH NOTIFICATIONS ==========

  // Send push notification to student's registered devices
  if (student?.user_id) {
    await supabaseClient.functions.invoke('send-push-notification', {
      body: {
        user_id: student.user_id,
        title: 'Payment Confirmed!',
        body: `Your room "${roomName}" at ${dormName} is now reserved.`,
        url: '/my-reservations',
        icon: '/favicon.ico'
      }
    }).catch((err: any) => console.error('Error sending student push notification:', err));
  }

  // Send push notification to owner's registered devices
  if (owner?.user_id) {
    await supabaseClient.functions.invoke('send-push-notification', {
      body: {
        user_id: owner.user_id,
        title: 'New Reservation Payment!',
        body: `${studentFullName} reserved "${roomName}" in ${dormName}. You received $${ownerPayout.toFixed(2)}.`,
        url: '/owner/finance',
        icon: '/favicon.ico'
      }
    }).catch((err: any) => console.error('Error sending owner push notification:', err));
  }

  // Send student receipt email
  await supabaseClient.functions.invoke('send-student-receipt', {
    body: {
      student_id: reservation.student_id,
      reservation_id: reservationId,
      room_name: roomName,
      dorm_name: dormName,
      deposit: reservation.deposit_amount,
      fee: reservation.commission_amount || roomyFee,
      total: totalAmount,
      whish_payment_id: payload.id,
      timestamp: new Date().toISOString(),
    }
  }).catch((err: any) => console.error('Error sending student receipt:', err));

  console.log('All payment notifications sent successfully');
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

  // Get student details for notification
  const { data: student } = await supabaseClient
    .from('students')
    .select('user_id, full_name')
    .eq('id', studentId)
    .single();

  // Send student in-app notification for match plan
  if (student?.user_id) {
    await supabaseClient.from('notifications').insert({
      user_id: student.user_id,
      title: 'AI Match Plan Activated!',
      message: `Your ${planType} plan is now active. Enjoy enhanced AI matching for 30 days!`,
      lang: 'en',
      metadata: {
        type: 'match_plan_payment',
        plan_type: planType,
        expires_at: expiresAt.toISOString()
      }
    });
    console.log('Student match plan notification sent');
  }

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

    // Get student for notification
    const { data: student } = await supabaseClient
      .from('students')
      .select('user_id')
      .eq('id', metadata.student_id)
      .single();

    // Send student notification about failed payment
    if (student?.user_id) {
      await supabaseClient.from('notifications').insert({
        user_id: student.user_id,
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please try again or use a different payment method.',
        lang: 'en',
        metadata: {
          type: 'payment_failed',
          payment_type: paymentType
        }
      });
    }
  }

  // Update reservation if applicable
  if (paymentType === 'reservation' && metadata.reservation_id) {
    await supabaseClient
      .from('reservations')
      .update({ status: 'expired' })
      .eq('id', metadata.reservation_id);
  }
}
