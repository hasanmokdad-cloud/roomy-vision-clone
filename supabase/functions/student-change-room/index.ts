import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { newRoomId, newDormId } = await req.json();

    console.log('Room change request:', { userId: user.id, newRoomId, newDormId });

    // Get student record
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('id, current_room_id, current_dorm_id')
      .eq('user_id', user.id)
      .single();

    if (studentError || !student) {
      console.error('Student not found:', studentError);
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Current student room:', student.current_room_id, 'New room:', newRoomId);

    const oldRoomId = student.current_room_id;
    const oldDormId = student.current_dorm_id;

    // Step 1: Find and reject any existing claims for this student (regardless of room)
    // This catches claims for both the current room AND any orphaned claims from previous rooms
    const { data: existingClaims, error: claimsError } = await supabaseClient
      .from('room_occupancy_claims')
      .select('id, room_id, status')
      .eq('student_id', student.id)
      .in('status', ['pending', 'confirmed']);

    if (claimsError) {
      console.error('Error fetching existing claims:', claimsError);
    }

    console.log('Found existing claims:', existingClaims?.length || 0);

    // Reject all existing claims
    if (existingClaims && existingClaims.length > 0) {
      for (const claim of existingClaims) {
        console.log('Rejecting claim:', claim.id, 'for room:', claim.room_id, 'status:', claim.status);
        
        // If the claim was confirmed, decrement roomy_confirmed_occupants for that room
        if (claim.status === 'confirmed') {
          const { error: decrementError } = await supabaseClient.rpc('decrement_roomy_confirmed_occupants', {
            p_room_id: claim.room_id
          });
          
          if (decrementError) {
            console.error('Error decrementing roomy_confirmed_occupants:', decrementError);
          } else {
            console.log('Decremented roomy_confirmed_occupants for room:', claim.room_id);
          }
        }

        // Update claim to rejected
        const { error: updateError } = await supabaseClient
          .from('room_occupancy_claims')
          .update({
            status: 'rejected',
            rejection_reason: 'Student changed rooms',
            rejected_at: new Date().toISOString()
          })
          .eq('id', claim.id);

        if (updateError) {
          console.error('Error rejecting claim:', claim.id, updateError);
        } else {
          console.log('Successfully rejected claim:', claim.id);
        }
      }
    }

    // Step 2: Create new claim for the new room (if provided)
    let newClaimId = null;
    if (newRoomId && newDormId) {
      // Get dorm owner
      const { data: dorm, error: dormError } = await supabaseClient
        .from('dorms')
        .select('owner_id')
        .eq('id', newDormId)
        .single();

      if (dormError || !dorm?.owner_id) {
        console.error('Dorm not found or no owner:', dormError);
        return new Response(
          JSON.stringify({ error: 'Dorm not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create new pending claim
      const { data: newClaim, error: claimError } = await supabaseClient
        .from('room_occupancy_claims')
        .insert({
          student_id: student.id,
          room_id: newRoomId,
          dorm_id: newDormId,
          owner_id: dorm.owner_id,
          status: 'pending',
          claim_type: 'legacy'
        })
        .select('id')
        .single();

      if (claimError) {
        console.error('Error creating new claim:', claimError);
        return new Response(
          JSON.stringify({ error: 'Failed to create room claim' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      newClaimId = newClaim.id;
      console.log('Created new pending claim:', newClaimId);
    }

    // Step 3: Update student's current_room_id and current_dorm_id
    const { error: updateStudentError } = await supabaseClient
      .from('students')
      .update({
        current_room_id: newRoomId || null,
        current_dorm_id: newDormId || null,
        room_confirmed: false // Reset confirmation when changing rooms
      })
      .eq('id', student.id);

    if (updateStudentError) {
      console.error('Error updating student:', updateStudentError);
      return new Response(
        JSON.stringify({ error: 'Failed to update student room' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully updated student room from', oldRoomId, 'to', newRoomId);

    return new Response(
      JSON.stringify({
        success: true,
        oldRoomId,
        newRoomId,
        newClaimId,
        claimsRejected: existingClaims?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error in student-change-room:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
