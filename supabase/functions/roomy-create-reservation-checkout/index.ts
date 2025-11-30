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

    // Whish API integration (Codnloc Pay)
    const whishSecretKey = Deno.env.get('WHISH_SECRET_KEY');
    const whishApiBase = Deno.env.get('WHISH_API_BASE') || 'https://pay.codnloc.com';
    
    let checkoutUrl: string;
    let whishPaymentId: string;
    
    // Check if in preview mode (keys not configured)
    if (!whishSecretKey || whishSecretKey === '__REPLACE_ME__') {
      console.log('Whish: Running in preview mode - no real API calls');
      checkoutUrl = `${Deno.env.get('SUPABASE_URL')}/reservation/confirmation?reservationId=${reservation.id}&preview=true`;
      whishPaymentId = `preview_${reservation.id}`;
    } else {
      // Real Whish API call
      try {
        const successUrl = `${Deno.env.get('SUPABASE_URL')}/reservation/confirmation?reservationId=${reservation.id}&status=success`;
        const cancelUrl = `${Deno.env.get('SUPABASE_URL')}/reservation/confirmation?reservationId=${reservation.id}&status=cancelled`;
        
        const whishResponse = await fetch(`${whishApiBase}/api/v1/payments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whishSecretKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: reservationFee,
            currency: 'USD',
            description: `Room reservation for ${room.name} at ${room.dorms.name}`,
            metadata: {
              payment_type: 'reservation',
              reservation_id: reservation.id,
              student_id: student.id,
              room_id: roomId,
              dorm_id: room.dorm_id
            },
            success_url: successUrl,
            cancel_url: cancelUrl
          })
        });

        if (!whishResponse.ok) {
          throw new Error(`Whish API error: ${whishResponse.status}`);
        }

        const whishData = await whishResponse.json();
        checkoutUrl = whishData.checkout_url;
        whishPaymentId = whishData.payment_id;
      } catch (error) {
        console.error('Whish API error:', error);
        throw new Error('Failed to create payment session');
      }
    }

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
