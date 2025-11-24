import { supabase } from '@/integrations/supabase/client';

/**
 * Get user profile and role information
 */
export async function getUserProfile(userId: string) {
  // Check student
  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, profile_photo_url, email')
    .eq('user_id', userId)
    .maybeSingle();

  if (student) {
    return {
      id: student.id,
      user_id: userId,
      name: student.full_name,
      email: student.email,
      avatar: student.profile_photo_url,
      role: 'student' as const,
    };
  }

  // Check owner
  const { data: owner } = await supabase
    .from('owners')
    .select('id, full_name, profile_photo_url, email')
    .eq('user_id', userId)
    .maybeSingle();

  if (owner) {
    return {
      id: owner.id,
      user_id: userId,
      name: owner.full_name,
      email: owner.email,
      avatar: owner.profile_photo_url,
      role: 'owner' as const,
    };
  }

  // Check admin
  const { data: admin } = await supabase
    .from('admins')
    .select('id, full_name, profile_photo_url, email')
    .eq('user_id', userId)
    .maybeSingle();

  if (admin) {
    return {
      id: admin.id,
      user_id: userId,
      name: admin.full_name,
      email: admin.email,
      avatar: admin.profile_photo_url,
      role: 'admin' as const,
    };
  }

  return null;
}

/**
 * Create or get existing 1:1 conversation between two users
 */
export async function createOrGetConversation(userAId: string, userBId: string) {
  try {
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_user_a_id: userAId,
      p_user_b_id: userBId,
    });

    if (error) throw error;
    return data as string;
  } catch (error) {
    console.error('Error creating/getting conversation:', error);
    return null;
  }
}

/**
 * Get first admin user ID for support conversations
 */
export async function getSupportAdminId() {
  try {
    const { data, error } = await supabase.rpc('get_support_admin_id');
    if (error) throw error;
    return data as string | null;
  } catch (error) {
    console.error('Error getting support admin:', error);
    return null;
  }
}

/**
 * Create support conversation between user and admin
 */
export async function createSupportConversation(userId: string, initialMessage: string) {
  const adminId = await getSupportAdminId();
  if (!adminId) {
    console.error('No admin user found for support');
    return null;
  }

  try {
    // Check for existing support conversation
    const smallerId = userId < adminId ? userId : adminId;
    const largerId = userId < adminId ? adminId : userId;
    
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_a_id', smallerId)
      .eq('user_b_id', largerId)
      .eq('conversation_type', 'support')
      .maybeSingle();

    let conversationId = existingConv?.id;

    // Create new support conversation if doesn't exist
    if (!conversationId) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_a_id: smallerId,
          user_b_id: largerId,
          conversation_type: 'support'
        })
        .select('id')
        .single();

      if (convError) {
        console.error('Error creating support conversation:', convError);
        return null;
      }
      conversationId = newConv?.id;
    }

    if (!conversationId) return null;

    // Create initial message
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      body: initialMessage,
      type: 'text',
    });

    if (error) {
      console.error('Error creating support message:', error);
      return null;
    }

    return conversationId;
  } catch (error) {
    console.error('Error in createSupportConversation:', error);
    return null;
  }
}

/**
 * Create conversation between student and owner (via dorm contact)
 */
export async function createDormConversation(
  studentUserId: string,
  ownerUserId: string,
  dormName: string,
  dormArea?: string,
  university?: string
) {
  const conversationId = await createOrGetConversation(studentUserId, ownerUserId);
  if (!conversationId) {
    return null;
  }

  // Create initial message if conversation is new
  const { data: existingMessages } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .limit(1);

  if (!existingMessages || existingMessages.length === 0) {
    const locationInfo = [dormArea, university].filter(Boolean).join(', ');
    const message = `Hi! I'm interested in your dorm: ${dormName}${locationInfo ? ` in ${locationInfo}` : ''}. I'd like to know more.`;

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: studentUserId,
      body: message,
      type: 'text',
    });

    if (error) {
      console.error('Error creating dorm inquiry message:', error);
    }
  }

  return conversationId;
}

/**
 * Mark messages as delivered (called by receiver's client via realtime)
 */
export async function markMessagesAsDelivered(messageIds: string[]) {
  if (messageIds.length === 0) return;

  const { error } = await supabase
    .from('messages')
    .update({ 
      delivered_at: new Date().toISOString(),
      status: 'delivered'
    })
    .in('id', messageIds)
    .is('delivered_at', null);

  if (error) {
    console.error('Error marking messages as delivered:', error);
  }
}

/**
 * Mark messages as read/seen
 */
export async function markMessagesAsRead(conversationId: string, userId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ 
      read_at: new Date().toISOString(),
      status: 'seen'
    })
    .eq('conversation_id', conversationId)
    .eq('receiver_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Error marking messages as read:', error);
  }
}
