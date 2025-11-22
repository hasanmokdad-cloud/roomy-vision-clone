import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUnreadMessagesCount(userId?: string, role?: string) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !role) {
      setLoading(false);
      return;
    }

    loadUnreadCount();

    // Set up realtime subscription
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role]);

  const loadUnreadCount = async () => {
    if (!userId || !role) return;

    try {
      // Get the appropriate profile ID based on role
      let profileId: string | null = null;

      if (role === 'owner') {
        const { data: owner } = await supabase
          .from('owners')
          .select('id')
          .eq('user_id', userId)
          .single();
        profileId = owner?.id || null;
      } else if (role === 'student') {
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .single();
        profileId = student?.id || null;
      }

      if (!profileId) {
        setCount(0);
        setLoading(false);
        return;
      }

      // Get conversations for this user
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(
          role === 'owner'
            ? `owner_id.eq.${profileId}`
            : `student_id.eq.${profileId}`
        );

      if (!conversations || conversations.length === 0) {
        setCount(0);
        setLoading(false);
        return;
      }

      const conversationIds = conversations.map((c) => c.id);

      // Count unread messages in these conversations
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('read', false)
        .neq('sender_id', userId);

      setCount(unreadCount || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  return { count, loading };
}
