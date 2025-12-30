import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

let isInitialized = false;
let activeConversationId: string | null = null;

/**
 * Set the currently active conversation to skip notifications for it
 */
export function setActiveConversationForPush(conversationId: string | null) {
  activeConversationId = conversationId;
}

/**
 * Initialize native push notifications for iOS/Android
 * This enables background push notifications that mark messages as delivered
 * even when the app is minimized
 */
export async function initializeNativePush() {
  // Only run on native platforms (iOS/Android)
  if (!Capacitor.isNativePlatform()) {
    console.log('[NativePush] Not a native platform, skipping initialization');
    return;
  }

  if (isInitialized) {
    console.log('[NativePush] Already initialized');
    return;
  }

  try {
    // Request permission for push notifications
    const permissionResult = await PushNotifications.requestPermissions();
    
    if (permissionResult.receive !== 'granted') {
      console.log('[NativePush] Push notification permission denied');
      return;
    }

    // Register for push notifications
    await PushNotifications.register();

    // Handle registration token
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('[NativePush] Push registration token:', token.value);
      
      // Store the FCM/APNs token in the database for sending pushes
      await storePushToken(token.value);
    });

    // Handle registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('[NativePush] Registration error:', error);
    });

    // Handle push notification received (app in foreground or background)
    // The edge function already marks messages as delivered when push is sent,
    // but this provides additional reliability for when app receives the push
    PushNotifications.addListener('pushNotificationReceived', async (notification: PushNotificationSchema) => {
      console.log('[NativePush] Push received:', notification);
      
      // Skip showing notification if user is already viewing this conversation
      const conversationId = notification.data?.conversation_id;
      if (conversationId && conversationId === activeConversationId) {
        console.log('[NativePush] Skipping notification - conversation is active');
        return;
      }
      
      // Extract message_id from notification data if available
      const messageId = notification.data?.message_id;
      if (messageId) {
        await markMessageAsDelivered(messageId);
      }
      
      // Also run background delivery check for any other undelivered messages
      await markAllUndeliveredMessages();
    });

    // Handle notification action (user tapped on notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[NativePush] Notification action performed:', action);
      
      // Navigate to conversation if URL is provided
      const url = action.notification.data?.url;
      if (url && typeof window !== 'undefined') {
        window.location.href = url;
      }
    });

    isInitialized = true;
    console.log('[NativePush] Initialization complete');
  } catch (error) {
    console.error('[NativePush] Initialization error:', error);
  }
}

/**
 * Store the native push token in the database
 * For native apps, we store the FCM/APNs token in the push_subscriptions table
 * using a special format that the send-push-notification function can recognize
 */
async function storePushToken(token: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[NativePush] No user logged in, cannot store token');
      return;
    }

    // For native push, we use a special endpoint format that the push function can detect
    // The token is stored in the endpoint field with a native:// prefix
    const nativeEndpoint = `native://${Capacitor.getPlatform()}/${token}`;
    
    // Store using the standard push_subscriptions schema
    // Using a placeholder for p256dh and auth_key since they're not used for native push
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: nativeEndpoint,
        p256dh: 'native-push',  // Placeholder - not used for native
        auth_key: 'native-push', // Placeholder - not used for native
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('[NativePush] Error storing token:', error);
    } else {
      console.log('[NativePush] Token stored successfully');
    }
  } catch (error) {
    console.error('[NativePush] Error storing token:', error);
  }
}

/**
 * Mark a specific message as delivered
 */
async function markMessageAsDelivered(messageId: string) {
  try {
    const { error } = await supabase
      .from('messages')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('status', 'sent');

    if (error) {
      console.error('[NativePush] Error marking message as delivered:', error);
    } else {
      console.log('[NativePush] Message marked as delivered:', messageId);
    }
  } catch (error) {
    console.error('[NativePush] Error:', error);
  }
}

/**
 * Mark all undelivered messages as delivered (background sync)
 */
async function markAllUndeliveredMessages() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all conversations for this user
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

    if (!conversations || conversations.length === 0) return;

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
      console.error('[NativePush] Error marking messages as delivered:', error);
    } else if (data && data.length > 0) {
      console.log('[NativePush] Marked', data.length, 'messages as delivered');
    }
  } catch (error) {
    console.error('[NativePush] Error in markAllUndeliveredMessages:', error);
  }
}

/**
 * Unregister from push notifications (e.g., on logout)
 */
export async function unregisterNativePush() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await PushNotifications.removeAllListeners();
    isInitialized = false;
    console.log('[NativePush] Unregistered');
  } catch (error) {
    console.error('[NativePush] Error unregistering:', error);
  }
}
