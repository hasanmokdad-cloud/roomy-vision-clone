import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Import the global active conversation tracker
import { setGlobalActiveConversation } from './useUnreadCount';

// Re-export for convenience
export { setGlobalActiveConversation };

export function useUnreadMessagesCount(userId?: string, role?: string) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  const loadUnreadCount = useCallback(async () => {
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

      // Count unread messages using status field (consistent with useUnreadCount)
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId)
        .or('status.neq.seen,status.is.null');

      setCount(unreadCount || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  // Debounced load
  const debouncedLoad = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(loadUnreadCount, 100);
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!userId || !role) {
      setLoading(false);
      return;
    }

    loadUnreadCount();

    // Set up realtime subscription with debouncing
    const channel = supabase
      .channel('messages-count-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as any;
          // Skip if from current user
          if (newMessage.sender_id === userId) return;
          // Optimistic increment
          setCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const updated = payload.new as any;
          const old = payload.old as any;
          // If marked as seen, decrement
          if (updated.status === 'seen' && old.status !== 'seen' && updated.sender_id !== userId) {
            setCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [userId, role, loadUnreadCount, debouncedLoad]);

  return { count, loading };
}
