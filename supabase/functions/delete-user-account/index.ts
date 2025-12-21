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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller is an admin
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if caller has admin role
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, roles!inner(name)')
      .eq('user_id', callerUser.id)
      .eq('roles.name', 'admin')
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { userId, accountType } = await req.json();

    if (!userId || !accountType) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or accountType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Deleting ${accountType} account for user: ${userId}`);

    // Delete related data based on account type
    if (accountType === 'owner') {
      // Get owner record first
      const { data: owner } = await supabaseAdmin
        .from('owners')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (owner) {
        const ownerId = owner.id;

        // Get all dorm IDs for this owner
        const { data: dorms } = await supabaseAdmin
          .from('dorms')
          .select('id')
          .eq('owner_id', ownerId);

        const dormIds = dorms?.map(d => d.id) || [];

        // Delete rooms for owner's dorms
        if (dormIds.length > 0) {
          await supabaseAdmin
            .from('rooms')
            .delete()
            .in('dorm_id', dormIds);
          console.log('Deleted rooms');
        }

        // Delete bookings where owner is involved
        await supabaseAdmin
          .from('bookings')
          .delete()
          .eq('owner_id', ownerId);
        console.log('Deleted bookings');

        // Delete inquiries
        await supabaseAdmin
          .from('inquiries')
          .delete()
          .eq('owner_id', ownerId);
        console.log('Deleted inquiries');

        // Delete owner notifications
        await supabaseAdmin
          .from('owner_notifications')
          .delete()
          .eq('owner_id', ownerId);
        console.log('Deleted owner notifications');

        // Delete notifications log
        await supabaseAdmin
          .from('notifications_log')
          .delete()
          .eq('owner_id', ownerId);
        console.log('Deleted notifications log');

        // Delete owner availability
        await supabaseAdmin
          .from('owner_availability')
          .delete()
          .eq('owner_id', ownerId);
        console.log('Deleted owner availability');

        // Delete owner payment methods
        await supabaseAdmin
          .from('owner_payment_methods')
          .delete()
          .eq('owner_id', ownerId);
        console.log('Deleted owner payment methods');

        // Delete dorm claims
        await supabaseAdmin
          .from('dorm_claims')
          .delete()
          .eq('owner_id', ownerId);
        console.log('Deleted dorm claims');

        // Delete dorms
        await supabaseAdmin
          .from('dorms')
          .delete()
          .eq('owner_id', ownerId);
        console.log('Deleted dorms');

        // Delete owner record
        await supabaseAdmin
          .from('owners')
          .delete()
          .eq('id', ownerId);
        console.log('Deleted owner record');
      }
    } else if (accountType === 'student') {
      // Get student record first
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (student) {
        const studentId = student.id;

        // Delete reservations
        await supabaseAdmin
          .from('reservations')
          .delete()
          .eq('student_id', studentId);
        console.log('Deleted reservations');

        // Delete bookings
        await supabaseAdmin
          .from('bookings')
          .delete()
          .eq('student_id', studentId);
        console.log('Deleted bookings');

        // Delete friendships
        await supabaseAdmin
          .from('friendships')
          .delete()
          .or(`requester_id.eq.${studentId},receiver_id.eq.${studentId}`);
        console.log('Deleted friendships');

        // Delete favorites
        await supabaseAdmin
          .from('favorites')
          .delete()
          .eq('student_id', studentId);
        console.log('Deleted favorites');

        // Delete billing history
        await supabaseAdmin
          .from('billing_history')
          .delete()
          .eq('student_id', studentId);
        console.log('Deleted billing history');

        // Delete payment methods
        await supabaseAdmin
          .from('payment_methods')
          .delete()
          .eq('student_id', studentId);
        console.log('Deleted payment methods');

        // Delete preference history
        await supabaseAdmin
          .from('preference_history')
          .delete()
          .eq('student_id', studentId);
        console.log('Deleted preference history');

        // Delete personality responses
        await supabaseAdmin
          .from('personality_responses')
          .delete()
          .eq('user_id', userId);
        console.log('Deleted personality responses');

        // Delete room occupancy claims
        await supabaseAdmin
          .from('room_occupancy_claims')
          .delete()
          .eq('student_id', studentId);
        console.log('Deleted room occupancy claims');

        // Delete student record
        await supabaseAdmin
          .from('students')
          .delete()
          .eq('id', studentId);
        console.log('Deleted student record');
      }
    }

    // Delete shared data for both account types

    // Delete conversations where user is participant
    await supabaseAdmin
      .from('conversations')
      .delete()
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);
    console.log('Deleted conversations');

    // Delete messages where user is sender
    await supabaseAdmin
      .from('messages')
      .delete()
      .eq('sender_id', userId);
    console.log('Deleted messages');

    // Delete notifications
    await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    console.log('Deleted notifications');

    // Delete notification preferences
    await supabaseAdmin
      .from('notification_preferences')
      .delete()
      .eq('user_id', userId);
    console.log('Deleted notification preferences');

    // Delete push subscriptions
    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);
    console.log('Deleted push subscriptions');

    // Delete chat context
    await supabaseAdmin
      .from('chat_context')
      .delete()
      .eq('user_id', userId);
    console.log('Deleted chat context');

    // Delete AI chat sessions
    await supabaseAdmin
      .from('ai_chat_sessions')
      .delete()
      .eq('user_id', userId);
    console.log('Deleted AI chat sessions');

    // Delete AI feedback
    await supabaseAdmin
      .from('ai_feedback')
      .delete()
      .eq('user_id', userId);
    console.log('Deleted AI feedback');

    // Delete AI sessions
    await supabaseAdmin
      .from('ai_sessions')
      .delete()
      .eq('user_id', userId);
    console.log('Deleted AI sessions');

    // Delete AI events
    await supabaseAdmin
      .from('ai_events')
      .delete()
      .eq('user_id', userId);
    console.log('Deleted AI events');

    // Delete analytics events
    await supabaseAdmin
      .from('analytics_events')
      .delete()
      .eq('user_id', userId);
    console.log('Deleted analytics events');

    // Delete AI recommendations log
    await supabaseAdmin
      .from('ai_recommendations_log')
      .delete()
      .eq('user_id', userId);
    console.log('Deleted AI recommendations log');

    // Delete device security logs
    await supabaseAdmin
      .from('device_security_logs')
      .delete()
      .eq('user_id', userId);
    console.log('Deleted device security logs');

    // Delete saved rooms
    await supabaseAdmin
      .from('saved_rooms')
      .delete()
      .eq('user_id', userId);
    console.log('Deleted saved rooms');

    // Note: room_occupancy_claims are deleted in the student section (uses student_id)

    // Delete user roles
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    console.log('Deleted user roles');

    // Finally, delete from auth.users
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return new Response(
        JSON.stringify({ error: `Failed to delete auth user: ${deleteUserError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted ${accountType} account for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: `${accountType} account completely deleted` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in delete-user-account:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
