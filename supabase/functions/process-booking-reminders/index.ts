import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[process-booking-reminders] Processing pending reminders...');

    // Fetch pending reminders that are due
    const { data: reminders, error: remindersError } = await supabase
      .from('booking_reminders')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50);

    if (remindersError) {
      throw remindersError;
    }

    if (!reminders || reminders.length === 0) {
      console.log('[process-booking-reminders] No pending reminders');
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[process-booking-reminders] Found ${reminders.length} reminders to process`);

    let processed = 0;
    let failed = 0;

    for (const reminder of reminders) {
      try {
        // Fetch booking details
        const { data: booking } = await supabase
          .from('bookings')
          .select(`
            id,
            dorm_id,
            student_id,
            owner_id,
            requested_date,
            requested_time,
            meeting_link,
            meeting_platform,
            dorms (dorm_name, name)
          `)
          .eq('id', reminder.booking_id)
          .single();

        if (!booking) {
          console.log(`[process-booking-reminders] Booking not found for reminder ${reminder.id}`);
          await supabase
            .from('booking_reminders')
            .update({ status: 'failed', sent_at: new Date().toISOString() })
            .eq('id', reminder.id);
          failed++;
          continue;
        }

        // Get conversation between student and owner
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
          console.log(`[process-booking-reminders] Student or owner not found`);
          failed++;
          continue;
        }

        // Get or create conversation
        const { data: conversationId, error: convError } = await supabase.rpc(
          'get_or_create_conversation',
          {
            p_user_a_id: student.user_id,
            p_user_b_id: owner.user_id
          }
        );

        if (convError || !conversationId) {
          console.error('[process-booking-reminders] Conversation error:', convError);
          failed++;
          continue;
        }

        // Format reminder message
        const reminderLabels: Record<string, string> = {
          '24h': 'in 24 hours',
          '1h': 'in 1 hour',
          '10min': 'in 10 minutes',
          'start': 'now'
        };

        const timeLabel = reminderLabels[reminder.reminder_type] || '';
        const dormName = booking.dorms?.dorm_name || booking.dorms?.name || 'Unknown Dorm';

        const messageBody = `⏰ Reminder: Your virtual tour for ${dormName} is starting ${timeLabel}!\n\n📅 Date: ${booking.requested_date}\n⏰ Time: ${booking.requested_time}\n🔗 Platform: ${
          booking.meeting_platform === 'google_meet' ? 'Google Meet' :
          booking.meeting_platform === 'zoom' ? 'Zoom' :
          booking.meeting_platform === 'teams' ? 'Microsoft Teams' :
          'Video Call'
        }\n\nClick the button below to join the meeting.`;

        // Insert reminder message
        const { error: messageError } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: reminder.recipient_type === 'student' ? owner.user_id : student.user_id,
          body: messageBody,
          type: 'text',
          attachment_metadata: {
            type: 'tour_reminder',
            status: 'accepted',
            booking_id: booking.id,
            dorm_name: dormName,
            requested_date: booking.requested_date,
            requested_time: booking.requested_time,
            meeting_link: booking.meeting_link,
            meeting_platform: booking.meeting_platform,
            reminder_type: reminder.reminder_type
          }
        });

        if (messageError) {
          console.error('[process-booking-reminders] Message error:', messageError);
          failed++;
          continue;
        }

        // Mark reminder as sent
        await supabase
          .from('booking_reminders')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', reminder.id);

        processed++;
        console.log(`[process-booking-reminders] Sent reminder ${reminder.id}`);

      } catch (error: any) {
        console.error(`[process-booking-reminders] Error processing reminder ${reminder.id}:`, error);
        await supabase
          .from('booking_reminders')
          .update({ status: 'failed', sent_at: new Date().toISOString() })
          .eq('id', reminder.id);
        failed++;
      }
    }

    console.log(`[process-booking-reminders] Processed: ${processed}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({ success: true, processed, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[process-booking-reminders] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});