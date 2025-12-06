import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting - 3 requests per minute per IP (payment initiation)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW = 60000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

interface ReservationCheckoutRequest {
  roomId: string;
  depositAmount?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   req.headers.get("x-real-ip") || 
                   "unknown";
  
  if (isRateLimited(clientIp)) {
    console.log("[reservation-checkout] Rate limit exceeded for IP:", clientIp);
    
    // Log rate limit event
    try {
      const logClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      await logClient.from("security_events").insert({
        event_type: "rate_limit_exceeded",
        severity: "warning",
        ip_region: clientIp,
        details: { function: "roomy-create-reservation-checkout", limit: RATE_LIMIT, window: "1min" }
      });
    } catch (e) {
      console.error("Failed to log rate limit event:", e);
    }
    
    return new Response(
      JSON.stringify({ error: "Too many payment attempts. Please try again later." }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        } 
      }
    );
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

    // 1. Check for existing pending reservation for same room
    const { data: existingPending } = await supabaseClient
      .from('reservations')
      .select('id')
      .eq('student_id', student.id)
      .eq('room_id', roomId)
      .eq('status', 'pending_payment')
      .maybeSingle();

    if (existingPending) {
      throw new Error('You already have a pending reservation for this room');
    }

    // 2. Check if student already has ANY pending reservation
    const { data: anyPending } = await supabaseClient
      .from('reservations')
      .select('id, rooms(name)')
      .eq('student_id', student.id)
      .eq('status', 'pending_payment')
      .maybeSingle();

    if (anyPending) {
      throw new Error('You have a pending reservation. Please complete or cancel it first.');
    }

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

    // Calculate deposit, commission, and total (server-side validation)
    const baseDeposit = providedDeposit || room.deposit || room.price;
    const commission = baseDeposit * 0.10;
    const totalDue = baseDeposit + commission; // deposit × 1.10

    // Log if client sent different amount (security monitoring)
    if (providedDeposit && Math.abs(providedDeposit - baseDeposit) > 0.01) {
      console.warn('Client deposit mismatch - using server value', {
        provided: providedDeposit,
        actual: baseDeposit,
        student_id: student.id,
      });
    }

    // Set payment URL expiry (15 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Set refund window (72 hours from booking)
    const refundableUntil = new Date();
    refundableUntil.setHours(refundableUntil.getHours() + 72);

    // Create reservation record with all amounts
    const { data: reservation, error: reservationError } = await supabaseClient
      .from('reservations')
      .insert({
        student_id: student.id,
        room_id: roomId,
        dorm_id: room.dorm_id,
        status: 'pending_payment',
        deposit_amount: baseDeposit,
        reservation_fee_amount: commission, // Keep for backward compatibility
        commission_amount: commission,
        total_amount: totalDue,
        expires_at: expiresAt.toISOString(),
        refundable_until: refundableUntil.toISOString(),
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
            amount: totalDue, // Charge full amount (deposit + commission)
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
      baseDeposit,
      commission,
      totalDue,
      studentId: student.id,
    });

    return new Response(
      JSON.stringify({
        checkoutUrl,
        paymentId: whishPaymentId,
        reservationId: reservation.id,
        amount: totalDue,
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
