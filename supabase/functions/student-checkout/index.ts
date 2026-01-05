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

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the student profile
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('id, current_room_id, current_dorm_id, room_confirmed, confirmation_type')
      .eq('user_id', user.id)
      .single();

    if (studentError || !student) {
      console.error('Student not found:', studentError);
      return new Response(
        JSON.stringify({ error: 'Student profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!student.current_room_id) {
      return new Response(
        JSON.stringify({ error: 'No room to check out from' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing checkout for student:', student.id, 'from room:', student.current_room_id);

    // Get the student's current claim - use maybeSingle to handle no results gracefully
    const { data: claim, error: claimError } = await supabaseClient
      .from('room_occupancy_claims')
      .select('id, claim_type, status, room_id, dorm_id, owner_id')
      .eq('student_id', student.id)
      .eq('room_id', student.current_room_id)
      .in('status', ['confirmed', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (claimError) {
      console.error('Error finding claim:', claimError);
    }

    console.log('Found claim for checkout:', claim?.id || 'none', 'status:', claim?.status || 'N/A');

    // Get room info for occupancy update
    const { data: room } = await supabaseClient
      .from('rooms')
      .select('capacity, capacity_occupied, roomy_confirmed_occupants')
      .eq('id', student.current_room_id)
      .single();

    // Decrement occupancy counters based on claim type
    if (claim && room) {
      const isReservationBased = claim.claim_type === 'reservation' || student.confirmation_type === 'reservation';
      
      if (isReservationBased) {
        // For reservation-based claims, decrement both counters
        await supabaseClient
          .from('rooms')
          .update({
            capacity_occupied: Math.max(0, (room.capacity_occupied || 0) - 1),
            roomy_confirmed_occupants: Math.max(0, (room.roomy_confirmed_occupants || 0) - 1)
          })
          .eq('id', student.current_room_id);

        console.log('Decremented both capacity_occupied and roomy_confirmed_occupants for reservation checkout');
      }
      // For legacy claims, owner manages capacity manually - don't decrement capacity_occupied
    }

    // ALWAYS update claim status to rejected on checkout (regardless of claim type)
    if (claim) {
      const { error: claimUpdateError } = await supabaseClient
        .from('room_occupancy_claims')
        .update({ 
          status: 'rejected', 
          rejection_reason: 'Student checked out',
          rejected_at: new Date().toISOString()
        })
        .eq('id', claim.id);

      if (claimUpdateError) {
        console.error('Failed to update claim status:', claimUpdateError);
      } else {
        console.log('Claim status updated to rejected for claim:', claim.id);
      }
    }

    // Clear student's room data
    const { error: updateError } = await supabaseClient
      .from('students')
      .update({
        current_dorm_id: null,
        current_room_id: null,
        room_confirmed: false,
        room_confirmed_at: null,
        confirmation_type: null,
        accommodation_status: 'need_dorm',
        need_roommate: false
      })
      .eq('id', student.id);

    if (updateError) {
      console.error('Failed to update student:', updateError);
      throw updateError;
    }

    // Send notification to owner if applicable
    if (claim?.owner_id) {
      try {
        // Get student name for notification
        const { data: studentInfo } = await supabaseClient
          .from('students')
          .select('full_name')
          .eq('id', student.id)
          .single();

        // Create notification for owner
        await supabaseClient
          .from('owner_notifications')
          .insert({
            owner_id: claim.owner_id,
            dorm_id: claim.dorm_id,
            title: 'Student Checked Out',
            body: `${studentInfo?.full_name || 'A student'} has checked out of their room.`
          });

        console.log('Owner notification sent for checkout');
      } catch (notifError) {
        console.error('Failed to send owner notification:', notifError);
        // Don't fail the checkout if notification fails
      }
    }

    console.log('Checkout completed successfully for student:', student.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Successfully checked out' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
