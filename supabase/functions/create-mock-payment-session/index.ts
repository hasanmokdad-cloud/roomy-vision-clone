import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentSessionRequest {
  mode: 'room_deposit' | 'ai_match_plan';
  amount: number;
  currency: string;
  description: string;
  metadata: {
    roomId?: string;
    dormId?: string;
    dormName?: string;
    roomName?: string;
    monthlyPrice?: number;
    ownerId?: string;
    studentId?: string;
    planType?: 'advanced' | 'vip';
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get student record
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (studentError || !student) {
      throw new Error('Student profile not found');
    }

    const { mode, amount, currency, description, metadata } = await req.json() as PaymentSessionRequest;

    // Validate request
    if (!mode || !amount || amount <= 0) {
      throw new Error('Invalid payment request');
    }

    let reservationId: string | null = null;

    // For room deposits, create a reservation record first
    if (mode === 'room_deposit' && metadata.roomId) {
      // Check for existing pending reservation
      const { data: existingReservation } = await supabaseClient
        .from('reservations')
        .select('id')
        .eq('student_id', student.id)
        .eq('room_id', metadata.roomId)
        .eq('status', 'pending_payment')
        .maybeSingle();

      if (existingReservation) {
        throw new Error('You already have a pending reservation for this room');
      }

      // Get room details
      const { data: room, error: roomError } = await supabaseClient
        .from('rooms')
        .select('*, dorms!inner(*)')
        .eq('id', metadata.roomId)
        .single();

      if (roomError || !room) {
        throw new Error('Room not found');
      }

      // Check availability
      if (!room.available || (room.capacity && room.capacity_occupied >= room.capacity)) {
        throw new Error('Room is not available');
      }

      // Check if owner has a payout card configured
      if (room.dorms?.owner_id) {
        const { data: ownerCard } = await supabaseClient
          .from('owner_payment_methods')
          .select('id')
          .eq('owner_id', room.dorms.owner_id)
          .eq('is_default', true)
          .maybeSingle();

        if (!ownerCard) {
          throw new Error('This dorm is not ready to receive online reservation payments. Please try another listing or contact support.');
        }
      }

      // Calculate amounts
      const baseDeposit = room.deposit || room.price;
      const commission = baseDeposit * 0.10;
      const totalDue = baseDeposit + commission;

      // Set expiry (15 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Create reservation record
      const { data: reservation, error: reservationError } = await supabaseClient
        .from('reservations')
        .insert({
          student_id: student.id,
          room_id: metadata.roomId,
          dorm_id: room.dorm_id,
          status: 'pending_payment',
          deposit_amount: baseDeposit,
          commission_amount: commission,
          total_amount: totalDue,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (reservationError) {
        console.error('Reservation error:', reservationError);
        throw new Error('Failed to create reservation');
      }

      reservationId = reservation.id;
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        student_id: student.id,
        payment_type: mode === 'room_deposit' ? 'room_deposit' : 'match_plan',
        amount,
        currency,
        status: 'pending',
        provider: 'whish',
        reservation_id: reservationId,
        match_plan_type: mode === 'ai_match_plan' ? metadata.planType : null,
        raw_payload: {
          description,
          metadata,
        },
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error('Payment error:', paymentError);
      throw new Error('Failed to create payment record');
    }

    // Generate mock hosted checkout URL
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.dev') || '';
    const hostedUrl = `/mock-whish-checkout?paymentId=${payment.id}`;

    console.log('Mock payment session created:', {
      paymentId: payment.id,
      mode,
      amount,
      studentId: student.id,
      reservationId,
    });

    return new Response(
      JSON.stringify({
        paymentId: payment.id,
        hostedUrl,
        reservationId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating payment session:', error);
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