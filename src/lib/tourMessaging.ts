import { supabase } from "@/integrations/supabase/client";
import { type MeetingPlatform } from './meetingUtils';

type TourMessageType = 'requested' | 'accepted' | 'declined' | 'cancelled';

interface TourDetails {
  dormName: string;
  date: string;
  time: string;
  meetingLink?: string;
  reason?: string;
  platform?: MeetingPlatform;
}

/**
 * Sends a system message in the conversation between student and owner
 * when a tour is requested, accepted, declined, or cancelled
 */
export async function sendTourSystemMessage(
  studentUserId: string,
  ownerUserId: string,
  type: TourMessageType,
  details: TourDetails
) {
  try {
    // Get or create conversation between student and owner
    const { data: conversationId, error: convError } = await supabase.rpc(
      'get_or_create_conversation',
      {
        p_user_a_id: studentUserId,
        p_user_b_id: ownerUserId
      }
    );

    if (convError) {
      console.error('Error getting conversation:', convError);
      return;
    }

    // Build message based on type
    let messageBody = '';
    let senderId = studentUserId; // Default to student

    switch (type) {
      case 'requested':
        messageBody = `📅 New tour request for ${details.dormName} on ${details.date} at ${details.time}. Status: Pending`;
        break;
      case 'accepted':
        messageBody = `✅ Tour request accepted for ${details.dormName} on ${details.date} at ${details.time}.${details.meetingLink ? `\n\n🔗 Meeting Link: ${details.meetingLink}\n\n💡 Add this to your calendar!` : ''}`;
        senderId = ownerUserId;
        break;
      case 'declined':
        messageBody = `❌ Tour request declined for ${details.dormName} on ${details.date} at ${details.time}.${details.reason ? `\n\nReason: ${details.reason}` : ''}`;
        senderId = ownerUserId;
        break;
      case 'cancelled':
        messageBody = `🚫 Tour request cancelled for ${details.dormName} on ${details.date} at ${details.time}.`;
        break;
    }

    // Insert system message
    const { error: messageError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: messageBody,
      type: 'text'
    });

    if (messageError) {
      console.error('Error sending tour system message:', messageError);
    }
  } catch (error) {
    console.error('Error in sendTourSystemMessage:', error);
  }
}
