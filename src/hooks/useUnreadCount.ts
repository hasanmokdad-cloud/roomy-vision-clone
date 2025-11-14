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

        if (!student && !owner) return;

        // Get conversations
        let conversationsQuery = supabase.from('conversations').select('id');
        
        if (student) {
          conversationsQuery = conversationsQuery.eq('student_id', student.id);
        } else if (owner) {
          conversationsQuery = conversationsQuery.eq('owner_id', owner.id);
        }

        const { data: conversations } = await conversationsQuery;
        if (!conversations || conversations.length === 0) return;

        const conversationIds = conversations.map(c => c.id);

        // Count unread messages
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .neq('sender_id', userId)
          .eq('read', false);

        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    loadUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel('unread-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => {
        loadUnreadCount();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, () => {
        loadUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return unreadCount;
}
