import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingDetails {
  id: string;
  student_id: string;
  owner_id: string;
  requested_date: string;
  requested_time: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bookingId } = await req.json();

    console.log('[schedule-booking-reminders] Scheduling reminders for booking:', bookingId);

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, student_id, owner_id, requested_date, requested_time')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${bookingError?.message}`);
    }

    // Get user IDs from student and owner
    const { data: student } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', booking.student_id)
      .single();

    const { data: owner } = await supabase
      .from('owners')
      .select('user_id')
      .eq('id', booking.owner_id)
      .single();

    if (!student || !owner) {
      throw new Error('Student or owner user_id not found');
    }

    // Parse meeting datetime
    const meetingDateTime = new Date(`${booking.requested_date}T${booking.requested_time}`);
    const now = new Date();

    // Calculate reminder times
    const reminderTypes = [
      { type: '24h', offset: 24 * 60 * 60 * 1000 }, // 24 hours
      { type: '1h', offset: 60 * 60 * 1000 },       // 1 hour
      { type: '10min', offset: 10 * 60 * 1000 },    // 10 minutes
      { type: 'start', offset: 0 }                   // At start time
    ];

    const remindersToCreate: any[] = [];

    // Create reminders for student (all 4 types)
    for (const reminder of reminderTypes) {
      const scheduledAt = new Date(meetingDateTime.getTime() - reminder.offset);
      
      // Only schedule if in the future
      if (scheduledAt > now) {
        remindersToCreate.push({
          booking_id: booking.id,
          reminder_type: reminder.type,
          scheduled_at: scheduledAt.toISOString(),
          recipient_type: 'student',
          recipient_user_id: student.user_id,
          status: 'pending'
        });
      }
    }

    // Create reminders for owner (exclude 'start' type)
    for (const reminder of reminderTypes.slice(0, 3)) {
      const scheduledAt = new Date(meetingDateTime.getTime() - reminder.offset);
      
      if (scheduledAt > now) {
        remindersToCreate.push({
          booking_id: booking.id,
          reminder_type: reminder.type,
          scheduled_at: scheduledAt.toISOString(),
          recipient_type: 'owner',
          recipient_user_id: owner.user_id,
          status: 'pending'
        });
      }
    }

    // Insert all reminders
    if (remindersToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('booking_reminders')
        .insert(remindersToCreate);

      if (insertError) {
        throw insertError;
      }

      console.log(`[schedule-booking-reminders] Created ${remindersToCreate.length} reminders`);
    } else {
      console.log('[schedule-booking-reminders] No reminders needed (meeting too soon)');
    }

    return new Response(
      JSON.stringify({
        success: true,
        remindersScheduled: remindersToCreate.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[schedule-booking-reminders] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});