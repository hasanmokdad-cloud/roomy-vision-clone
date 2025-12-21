import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  claimId: string;
  action: 'confirm' | 'reject';
  rejectionReason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { claimId, action, rejectionReason }: RequestBody = await req.json();

    if (!claimId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing claimId or action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${action} for claim ${claimId} by user ${user.id}`);

    // Get the claim details
    const { data: claim, error: claimError } = await supabaseClient
      .from('room_occupancy_claims')
      .select('*, rooms(name, dorm_id), dorms(name)')
      .eq('id', claimId)
      .single();

    if (claimError || !claim) {
      console.error('Claim not found:', claimError);
      return new Response(
        JSON.stringify({ error: 'Claim not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is the owner of this claim's dorm
    const { data: owner } = await supabaseClient
      .from('owners')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!owner || owner.id !== claim.owner_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You are not the owner of this property' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get student details for notification
    const { data: student } = await supabaseClient
      .from('students')
      .select('user_id, full_name, email')
      .eq('id', claim.student_id)
      .single();

    if (action === 'confirm') {
      // FIRST: Reject any existing confirmed claims for this student on OTHER rooms
      // This prevents ghost occupants when a student changes rooms
      const { data: otherConfirmedClaims, error: fetchOtherError } = await supabaseClient
        .from('room_occupancy_claims')
        .select('id, room_id')
        .eq('student_id', claim.student_id)
        .eq('status', 'confirmed')
        .neq('id', claimId); // Exclude the current claim being confirmed

      if (fetchOtherError) {
        console.error('Error fetching other claims:', fetchOtherError);
      } else if (otherConfirmedClaims && otherConfirmedClaims.length > 0) {
        console.log(`Found ${otherConfirmedClaims.length} other confirmed claims to reject`);
        
        for (const oldClaim of otherConfirmedClaims) {
          // Decrement roomy_confirmed_occupants for the old room
          const { error: decrementError } = await supabaseClient.rpc('decrement_roomy_confirmed_occupants', {
            p_room_id: oldClaim.room_id
          });
          
          if (decrementError) {
            console.error(`Error decrementing roomy_confirmed_occupants for room ${oldClaim.room_id}:`, decrementError);
          } else {
            console.log(`Decremented roomy_confirmed_occupants for old room ${oldClaim.room_id}`);
          }
          
          // Reject the old claim
          const { error: rejectError } = await supabaseClient
            .from('room_occupancy_claims')
            .update({
              status: 'rejected',
              rejection_reason: 'Student moved to a new room',
            })
            .eq('id', oldClaim.id);
          
          if (rejectError) {
            console.error(`Error rejecting old claim ${oldClaim.id}:`, rejectError);
          } else {
            console.log(`Rejected old claim ${oldClaim.id}`);
          }
        }
      }

      // NOW: Update the new claim to confirmed
      const { error: updateClaimError } = await supabaseClient
        .from('room_occupancy_claims')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', claimId);

      if (updateClaimError) {
        console.error('Error updating claim:', updateClaimError);
        throw updateClaimError;
      }

      // Update student's room confirmation fields AND current_room_id
      const { error: updateStudentError } = await supabaseClient
        .from('students')
        .update({
          room_confirmed: true,
          room_confirmed_at: new Date().toISOString(),
          confirmation_type: 'legacy_claim',
          current_room_id: claim.room_id,
          current_dorm_id: claim.dorm_id,
        })
        .eq('id', claim.student_id);

      if (updateStudentError) {
        console.error('Error updating student:', updateStudentError);
        throw updateStudentError;
      }

      // Increment roomy_confirmed_occupants on the room
      const { error: rpcError } = await supabaseClient.rpc('increment_roomy_confirmed_occupants', {
        p_room_id: claim.room_id
      });

      if (rpcError) {
        console.error('Error incrementing roomy_confirmed_occupants:', rpcError);
        // Don't throw - continue with confirmation but log the error
      } else {
        console.log(`Incremented roomy_confirmed_occupants for room ${claim.room_id}`);
      }

      // Send notification to student
      if (student?.user_id) {
        const roomName = claim.rooms?.name || 'your room';
        const dormName = claim.dorms?.name || 'the dorm';
        
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: student.user_id,
            title: '🎉 Room Confirmed!',
            message: `Your claim for ${roomName} at ${dormName} has been confirmed by the owner. Welcome to your new home!`,
            metadata: {
              type: 'room_claim_confirmed',
              claim_id: claimId,
              room_id: claim.room_id,
              dorm_id: claim.dorm_id,
            },
          });
      }

      console.log(`Claim ${claimId} confirmed successfully`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Room claim confirmed successfully',
          claimId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'reject') {
      // Update the claim to rejected
      const { error: updateClaimError } = await supabaseClient
        .from('room_occupancy_claims')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason || 'Claim rejected by owner',
        })
        .eq('id', claimId);

      if (updateClaimError) {
        console.error('Error updating claim:', updateClaimError);
        throw updateClaimError;
      }

      // Clear student's room assignment
      const { error: updateStudentError } = await supabaseClient
        .from('students')
        .update({
          current_dorm_id: null,
          current_room_id: null,
          room_confirmed: false,
          room_confirmed_at: null,
          confirmation_type: null,
          accommodation_status: 'need_dorm',
        })
        .eq('id', claim.student_id);

      if (updateStudentError) {
        console.error('Error updating student:', updateStudentError);
        throw updateStudentError;
      }

      // Send notification to student
      if (student?.user_id) {
        const roomName = claim.rooms?.name || 'the room';
        const dormName = claim.dorms?.name || 'the dorm';
        
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: student.user_id,
            title: 'Room Claim Update',
            message: `Your claim for ${roomName} at ${dormName} was not approved. ${rejectionReason ? `Reason: ${rejectionReason}` : 'Please contact the owner for more details.'}`,
            metadata: {
              type: 'room_claim_rejected',
              claim_id: claimId,
              room_id: claim.room_id,
              dorm_id: claim.dorm_id,
              rejection_reason: rejectionReason,
            },
          });
      }

      console.log(`Claim ${claimId} rejected successfully`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Room claim rejected successfully',
          claimId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in confirm-room-occupant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
