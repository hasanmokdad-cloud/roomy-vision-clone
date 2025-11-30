import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReservationCheckoutRequest {
  roomId: string;
  depositAmount?: number;
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

    const { roomId, depositAmount: providedDeposit } = await req.json() as ReservationCheckoutRequest;

    // Get room details
    const { data: room, error: roomError } = await supabaseClient
      .from('rooms')
      .select('*, dorms!inner(*)')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      throw new Error('Room not found');
    }

    // Check availability
    if (!room.available) {
      throw new Error('Room is not available');
    }

    if (room.capacity_occupied >= room.capacity) {
      throw new Error('Room is fully booked');
    }

    // Calculate reservation fee (10% of deposit)
    const depositAmount = providedDeposit || room.deposit || room.price;
    const reservationFee = depositAmount * 0.10;

    // Create reservation record
    const { data: reservation, error: reservationError } = await supabaseClient
      .from('reservations')
      .insert({
        student_id: student.id,
        room_id: roomId,
        dorm_id: room.dorm_id,
        status: 'pending_payment',
        deposit_amount: depositAmount,
        reservation_fee_amount: reservationFee,
      })
      .select()
      .single();

    if (reservationError || !reservation) {
      throw new Error('Failed to create reservation');
    }

    // TODO: Call Whish API to create checkout session
    // For now, return a placeholder URL
    const whishPublicKey = Deno.env.get('WHISH_PUBLIC_KEY');
    const whishSecretKey = Deno.env.get('WHISH_SECRET_KEY');
    
    console.log('Whish integration - Keys configured:', {
      publicKey: !!whishPublicKey,
      secretKey: !!whishSecretKey,
    });

    // Placeholder checkout URL (replace with actual Whish API call)
    const checkoutUrl = `${Deno.env.get('SUPABASE_URL')}/reservation/confirmation?reservationId=${reservation.id}&status=pending`;
    const whishPaymentId = `whish_${reservation.id}`;

    // Update reservation with Whish details
    await supabaseClient
      .from('reservations')
      .update({
        whish_payment_id: whishPaymentId,
        whish_checkout_url: checkoutUrl,
      })
      .eq('id', reservation.id);

    console.log('Reservation checkout created:', {
      reservationId: reservation.id,
      roomId,
      depositAmount,
      reservationFee,
      studentId: student.id,
    });

    return new Response(
      JSON.stringify({
        checkoutUrl,
        paymentId: whishPaymentId,
        reservationId: reservation.id,
        amount: reservationFee,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating reservation checkout:', error);
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
