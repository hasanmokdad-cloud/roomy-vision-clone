import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUnreadCount(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    const loadUnreadCount = async () => {
      try {
        // Check admin first
        const { data: admin } = await supabase
          .from('admins')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        // Get user role
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        const { data: owner } = await supabase
          .from('owners')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!admin && !student && !owner) return;

        // Get conversations
        let conversationsQuery = supabase.from('conversations').select('id');
        
        if (admin) {
          conversationsQuery = conversationsQuery.eq('conversation_type', 'support');
        } else if (student) {
          conversationsQuery = conversationsQuery.eq('student_id', student.id);
        } else if (owner) {
          conversationsQuery = conversationsQuery.eq('owner_id', owner.id);
        }

        const { data: conversations } = await conversationsQuery;
        if (!conversations || conversations.length === 0) {
          setUnreadCount(0);
          return;
        }

        // Calculate unread count using user_thread_state
        let totalUnread = 0;
        
        for (const conv of conversations) {
          const { data: threadState } = await supabase
            .from('user_thread_state')
            .select('last_read_at')
            .eq('thread_id', conv.id)
            .eq('user_id', userId)
            .maybeSingle();

          if (threadState?.last_read_at) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', userId)
              .gt('created_at', threadState.last_read_at);
            totalUnread += count || 0;
          } else {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', userId);
            totalUnread += count || 0;
          }
        }

        setUnreadCount(totalUnread);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    loadUnreadCount();

    // Subscribe to new messages and thread state updates
    const messagesChannel = supabase
      .channel('unread-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        loadUnreadCount();
      })
      .subscribe();

    const threadStateChannel = supabase
      .channel('unread-thread-state')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_thread_state'
      }, () => {
        loadUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(threadStateChannel);
    };
  }, [userId]);

  return unreadCount;
}
