import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUnreadNotificationsCount(userId?: string) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadUnreadCount = async () => {
      try {
        const { count: unreadCount, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('read', false);

        if (error) {
          console.error('Error loading unread notifications count:', error);
          return;
        }

        setCount(unreadCount || 0);
      } catch (error) {
        console.error('Error loading unread notifications count:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUnreadCount();

    // Set up realtime subscription
    const channel = supabase
      .channel('notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Reload count on any change
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { count, loading };
}
