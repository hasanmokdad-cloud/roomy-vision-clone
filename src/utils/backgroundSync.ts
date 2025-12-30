import { supabase } from '@/integrations/supabase/client';

/**
 * Register background sync for checking and marking undelivered messages
 * This allows delivery receipts to work even when the Roomy tab is closed
 * (as long as the browser is open)
 */
export async function registerBackgroundSync() {
  if (!('serviceWorker' in navigator)) {
    console.log('[BackgroundSync] Service workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Register periodic sync if available (Chrome 80+)
    if ('periodicSync' in registration) {
      const periodicSync = (registration as any).periodicSync;
      
      // Check if permission is granted
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName,
      });

      if (status.state === 'granted') {
        try {
          await periodicSync.register('check-undelivered-messages', {
            minInterval: 60 * 1000 // Minimum 1 minute between syncs
          });
          console.log('[BackgroundSync] Periodic sync registered');
        } catch (error) {
          console.log('[BackgroundSync] Periodic sync registration failed:', error);
        }
      } else {
        console.log('[BackgroundSync] Periodic sync permission not granted');
      }
    } else {
      console.log('[BackgroundSync] Periodic sync not supported, using fallback');
    }

    // Also register a one-time sync as fallback
    if ('sync' in registration) {
      try {
        await (registration as any).sync.register('mark-messages-delivered');
        console.log('[BackgroundSync] One-time sync registered');
      } catch (error) {
        console.log('[BackgroundSync] One-time sync registration failed:', error);
      }
    }
  } catch (error) {
    console.log('[BackgroundSync] Registration error:', error);
  }
}

/**
 * Manually trigger a delivery check
 * Called when user returns to the app or tab becomes visible
 */
export async function checkAndMarkDelivered() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[BackgroundSync] No user logged in');
      return { updated: 0 };
    }

    // Get all conversations for this user
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

    if (!conversations || conversations.length === 0) {
      return { updated: 0 };
    }

    const conversationIds = conversations.map(c => c.id);

    // Update all undelivered messages where this user is the receiver
    const { data, error } = await supabase
      .from('messages')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .in('conversation_id', conversationIds)
      .neq('sender_id', user.id)
      .is('delivered_at', null)
      .eq('status', 'sent')
      .select('id');

    if (error) {
      console.error('[BackgroundSync] Error marking messages:', error);
      return { updated: 0, error: error.message };
    }

    const count = data?.length || 0;
    if (count > 0) {
      console.log('[BackgroundSync] Marked', count, 'messages as delivered');
    }

    return { updated: count };
  } catch (error) {
    console.error('[BackgroundSync] Error:', error);
    return { updated: 0, error: String(error) };
  }
}

/**
 * Set up visibility change listener to mark messages as delivered
 * when user returns to the browser/tab
 */
export function setupVisibilitySync() {
  if (typeof document === 'undefined') return;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('[BackgroundSync] Tab became visible, checking for undelivered messages');
      checkAndMarkDelivered();
    }
  });

  // Also run on window focus
  window.addEventListener('focus', () => {
    console.log('[BackgroundSync] Window focused, checking for undelivered messages');
    checkAndMarkDelivered();
  });

  console.log('[BackgroundSync] Visibility sync listeners set up');
}

/**
 * Initialize all background sync features
 */
export function initializeBackgroundSync() {
  registerBackgroundSync();
  setupVisibilitySync();
  
  // Also do an initial check
  checkAndMarkDelivered();
}
