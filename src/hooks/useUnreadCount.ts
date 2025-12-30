import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Global ref to track active conversation across all hooks
let globalActiveConversationId: string | null = null;

export function setGlobalActiveConversation(id: string | null) {
  globalActiveConversationId = id;
}

export function useUnreadCount(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastLoadTimeRef = useRef<number>(0);

  // Memoize loadUnreadCount so it can be called externally
  const loadUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    
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

      // Get conversations with muted_until
      let conversationsQuery = supabase.from('conversations').select('id, muted_until');
      
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

      // Filter out muted conversations AND the currently active conversation
      const activeConversations = conversations.filter(c => {
        // Skip the currently active conversation (user is viewing it)
        if (c.id === globalActiveConversationId) return false;
        // Skip muted conversations
        return !c.muted_until || new Date(c.muted_until) <= new Date();
      });

      if (activeConversations.length === 0) {
        setUnreadCount(0);
        return;
      }

      // Count unread messages using status field (more reliable)
      const conversationIds = activeConversations.map(c => c.id);
      
      const { count: totalUnread } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId)
        .or('status.neq.seen,status.is.null');

      setUnreadCount(totalUnread || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, [userId]);

  // Debounced load to prevent rapid-fire reloads
  const debouncedLoad = useCallback(() => {
    // Skip if within debounce window (100ms)
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 100) {
      return;
    }
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      lastLoadTimeRef.current = Date.now();
      loadUnreadCount();
    }, 100);
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    loadUnreadCount();

    // Subscribe to new messages - only count if not in active conversation
    const messagesChannel = supabase
      .channel('unread-messages-count')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const newMessage = payload.new as any;
        
        // Skip messages from current user
        if (newMessage.sender_id === userId) return;
        
        // Skip messages in active conversation (already being viewed)
        if (newMessage.conversation_id === globalActiveConversationId) {
          console.log('[useUnreadCount] Skipping count for active conversation');
          return;
        }
        
        // Optimistically increment count
        setUnreadCount(prev => prev + 1);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const updatedMessage = payload.new as any;
        const oldMessage = payload.old as any;
        
        // If status changed to 'seen' and this message was previously unread
        if (updatedMessage.status === 'seen' && oldMessage.status !== 'seen') {
          // Skip if from current user (their sent messages)
          if (updatedMessage.sender_id === userId) return;
          
          // Optimistically decrement count
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();

    // Subscribe to thread state changes (when user opens a conversation)
    const threadStateChannel = supabase
      .channel('unread-thread-state')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_thread_state',
        filter: `user_id=eq.${userId}`
      }, () => {
        // User read messages in a thread, reload count
        debouncedLoad();
      })
      .subscribe();

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(threadStateChannel);
    };
  }, [userId, loadUnreadCount, debouncedLoad]);

  return { unreadCount, refresh: loadUnreadCount };
}
