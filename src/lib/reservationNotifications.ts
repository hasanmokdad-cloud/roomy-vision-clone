import { supabase } from '@/integrations/supabase/client';
import { createOrGetConversation } from './conversationUtils';

/**
 * Send automatic welcome message to owner when student reserves a room
 */
export async function sendReservationWelcomeMessage(
  studentUserId: string,
  dormId: string,
  roomId?: string
): Promise<string | null> {
  try {
    // Fetch dorm and owner info
    const { data: dorm, error: dormError } = await supabase
      .from('dorms')
      .select('name, owner_id')
      .eq('id', dormId)
      .single();

    if (dormError || !dorm?.owner_id) {
      console.error('Error fetching dorm for welcome message:', dormError);
      return null;
    }

    // Get owner's user_id
    const { data: owner, error: ownerError } = await supabase
      .from('owners')
      .select('user_id')
      .eq('id', dorm.owner_id)
      .single();

    if (ownerError || !owner?.user_id) {
      console.error('Error fetching owner for welcome message:', ownerError);
      return null;
    }

    // Fetch room name if roomId provided
    let roomName: string | null = null;
    if (roomId) {
      const { data: room } = await supabase
        .from('rooms')
        .select('name')
        .eq('id', roomId)
        .single();
      roomName = room?.name || null;
    }

    // Create or get conversation
    const conversationId = await createOrGetConversation(studentUserId, owner.user_id);
    if (!conversationId) {
      console.error('Failed to create conversation for welcome message');
      return null;
    }

    // Build message
    const message = roomName
      ? `🎉 I've just reserved ${roomName} at ${dorm.name}! Looking forward to my stay.`
      : `🎉 I've just reserved a room at ${dorm.name}! Looking forward to my stay.`;

    // Send message
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: studentUserId,
      body: message,
      type: 'text',
    });

    if (msgError) {
      console.error('Error sending reservation welcome message:', msgError);
      return null;
    }

    return conversationId;
  } catch (err) {
    console.error('Error in sendReservationWelcomeMessage:', err);
    return null;
  }
}
