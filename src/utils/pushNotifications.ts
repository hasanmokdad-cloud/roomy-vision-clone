import { supabase } from '@/integrations/supabase/client';

interface SendPushNotificationParams {
  userId: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  actions?: Array<{ action: string; title: string }>;
}

/**
 * Helper function to send push notifications via the backend edge function.
 * This checks if the user has push notifications enabled before sending.
 */
export async function sendPushNotification({
  userId,
  title,
  body,
  url = '/',
  icon = '/favicon.ico',
  actions = []
}: SendPushNotificationParams): Promise<{ success: boolean; sent?: number; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        title,
        body,
        url,
        icon,
        actions
      }
    });

    if (error) {
      console.error('[sendPushNotification] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, sent: data?.sent || 0 };
  } catch (err: any) {
    console.error('[sendPushNotification] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send push notification for new message
 */
export async function notifyNewMessage(
  recipientUserId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
) {
  return sendPushNotification({
    userId: recipientUserId,
    title: `New message from ${senderName}`,
    body: messagePreview.slice(0, 100) + (messagePreview.length > 100 ? '...' : ''),
    url: `/messages?conversation=${conversationId}`,
    actions: [
      { action: 'reply', title: 'Reply' },
      { action: 'view', title: 'View' }
    ]
  });
}

/**
 * Send push notification for booking request (to owner)
 */
export async function notifyBookingRequest(
  ownerUserId: string,
  studentName: string,
  dormName: string,
  requestedDate: string
) {
  return sendPushNotification({
    userId: ownerUserId,
    title: '📅 New Viewing Request!',
    body: `${studentName} wants to view ${dormName} on ${requestedDate}`,
    url: '/owner/bookings'
  });
}

/**
 * Send push notification for booking confirmation (to student)
 */
export async function notifyBookingConfirmed(
  studentUserId: string,
  dormName: string,
  confirmedDate: string,
  confirmedTime: string
) {
  return sendPushNotification({
    userId: studentUserId,
    title: '✅ Viewing Confirmed!',
    body: `Your viewing at ${dormName} is confirmed for ${confirmedDate} at ${confirmedTime}`,
    url: '/bookings'
  });
}

/**
 * Send push notification for booking decline (to student)
 */
export async function notifyBookingDeclined(
  studentUserId: string,
  dormName: string,
  reason?: string
) {
  return sendPushNotification({
    userId: studentUserId,
    title: 'Viewing Request Update',
    body: reason ? `Your viewing at ${dormName} was declined: ${reason}` : `Your viewing at ${dormName} was declined`,
    url: '/bookings'
  });
}

/**
 * Send push notification for friend request
 */
export async function notifyFriendRequest(
  recipientUserId: string,
  requesterName: string
) {
  return sendPushNotification({
    userId: recipientUserId,
    title: '👋 Friend Request',
    body: `${requesterName} sent you a friend request`,
    url: '/friends',
    actions: [
      { action: 'accept', title: 'Accept' },
      { action: 'view', title: 'View' }
    ]
  });
}

/**
 * Send push notification for tour reminder
 */
export async function notifyTourReminder(
  userId: string,
  dormName: string,
  timeUntil: string
) {
  return sendPushNotification({
    userId,
    title: '⏰ Tour Reminder',
    body: `Your viewing at ${dormName} is ${timeUntil}`,
    url: '/bookings'
  });
}
