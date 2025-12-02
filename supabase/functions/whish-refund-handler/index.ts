import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefundRequest {
  reservation_id: string;
  refund_request_id: string;
  initiated_by: string; // admin user_id
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
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user is admin
    const { data: roleData } = await supabaseClient.rpc('get_user_role', {
      p_user_id: user.id,
    });

    if (roleData !== 'admin') {
      throw new Error('Admin access required');
    }

    const { reservation_id, refund_request_id, initiated_by } = await req.json() as RefundRequest;

    console.log('Processing refund:', {
      reservation_id,
      refund_request_id,
      initiated_by,
    });

    // 1. Lookup reservation - verify status is 'paid'
    const { data: reservation, error: reservationError } = await supabaseClient
      .from('reservations')
      .select('*, rooms(capacity, capacity_occupied, dorm_id), students(user_id, current_room_id, current_dorm_id)')
      .eq('id', reservation_id)
      .single();

    if (reservationError || !reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== 'paid') {
      throw new Error(`Cannot refund reservation with status: ${reservation.status}`);
    }

    // 2. Lookup refund_request - verify status is 'approved'
    const { data: refundRequest, error: refundError } = await supabaseClient
      .from('refund_requests')
      .select('*')
      .eq('id', refund_request_id)
      .single();

    if (refundError || !refundRequest) {
      throw new Error('Refund request not found');
    }

    if (refundRequest.status !== 'approved') {
      throw new Error(`Cannot process refund with status: ${refundRequest.status}`);
    }

    // 3. Check if already processed
    if (refundRequest.status === 'processed') {
      throw new Error('Refund already processed');
    }

    // 4. (Placeholder) "Call Whish refund API"
    const whishSecretKey = Deno.env.get('WHISH_SECRET_KEY');
    const whishApiBase = Deno.env.get('WHISH_API_BASE') || 'https://pay.codnloc.com';

    let refundSuccess = false;
    let whishRefundId = null;

    if (!whishSecretKey || whishSecretKey === '__REPLACE_ME__') {
      // Preview mode - simulate success
      console.log('🔄 Whish Refund (PREVIEW MODE):', {
        reservation_id,
        amount: reservation.total_amount,
        whish_payment_id: reservation.whish_payment_id,
      });
      refundSuccess = true;
      whishRefundId = `preview_refund_${reservation_id}`;
    } else {
      // Real Whish API call (when credentials are available)
      try {
        const whishResponse = await fetch(`${whishApiBase}/api/v1/refunds`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whishSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_id: reservation.whish_payment_id,
            amount: reservation.total_amount,
            reason: refundRequest.reason,
          }),
        });

        if (!whishResponse.ok) {
          throw new Error(`Whish API error: ${whishResponse.status}`);
        }

        const whishData = await whishResponse.json();
        refundSuccess = true;
        whishRefundId = whishData.refund_id;
      } catch (error) {
        console.error('Whish refund API error:', error);
        throw new Error('Failed to process refund with payment provider');
      }
    }

    // 5. On success: Update database
    if (refundSuccess) {
      // Update reservation status
      await supabaseClient
        .from('reservations')
        .update({
          status: 'refunded',
        })
        .eq('id', reservation_id);

      // Update refund request status
      await supabaseClient
        .from('refund_requests')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
          processed_by: initiated_by,
        })
        .eq('id', refund_request_id);

      // Decrement room occupancy using RPC function
      if (reservation.rooms) {
        await supabaseClient.rpc('decrement_room_occupancy', {
          room_id: reservation.room_id,
        });
      }

      // Clear student's current_dorm_id and current_room_id if they match
      if (reservation.students) {
        const student = reservation.students;
        if (student.current_room_id === reservation.room_id) {
          await supabaseClient
            .from('students')
            .update({
              current_room_id: null,
              current_dorm_id: null,
              accommodation_status: 'need_dorm',
            })
            .eq('user_id', student.user_id);
        }
      }

      console.log('✅ Refund processed successfully:', {
        reservation_id,
        refund_request_id,
        whish_refund_id: whishRefundId,
      });

      return new Response(
        JSON.stringify({
          success: true,
          reservation_id,
          refund_request_id,
          whish_refund_id: whishRefundId,
          amount_refunded: reservation.total_amount,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      throw new Error('Refund processing failed');
    }
  } catch (error) {
    console.error('Error processing refund:', error);
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
