import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to send push notifications for new messages
 * Called after a message is successfully inserted
 */
export function useMessagePushNotification() {
  const sendPushForMessage = async (
    conversationId: string,
    senderId: string,
    messageBody: string,
    messageId: string // Added: actual message ID for delivery tracking
  ) => {
    try {
      // Get conversation to find receiver
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('user_a_id, user_b_id')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        console.log('[useMessagePushNotification] Could not find conversation');
        return;
      }

      // Determine receiver
      const receiverId = conversation.user_a_id === senderId 
        ? conversation.user_b_id 
        : conversation.user_a_id;

      if (!receiverId) {
        console.log('[useMessagePushNotification] No receiver found');
        return;
      }

      // Call the edge function (it will handle preference checking and delivery marking)
      const { data, error } = await supabase.functions.invoke('send-message-notification', {
        body: {
          message_id: messageId, // Pass actual message ID for delivery tracking
          conversation_id: conversationId,
          sender_id: senderId,
          receiver_id: receiverId,
          body: messageBody || ''
        }
      });

      if (error) {
        console.error('[useMessagePushNotification] Edge function error:', error);
        return;
      }

      console.log('[useMessagePushNotification] Push notification sent, delivered:', data?.delivered);
    } catch (error) {
      // Silent fail - don't block messaging for notification failures
      console.error('[useMessagePushNotification] Error:', error);
    }
  };

  return { sendPushForMessage };
}
