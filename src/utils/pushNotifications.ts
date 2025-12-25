import { supabase } from '@/integrations/supabase/client';

type NotificationType = 'tours' | 'messages' | 'reservations' | 'social' | 'promotions' | 'admin';

interface SendPushNotificationParams {
  userId: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  actions?: Array<{ action: string; title: string }>;
  notificationType?: NotificationType;
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
  actions = [],
  notificationType
}: SendPushNotificationParams): Promise<{ success: boolean; sent?: number; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        title,
        body,
        url,
        icon,
        actions,
        notification_type: notificationType
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
    notificationType: 'messages',
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
    url: '/owner/bookings',
    notificationType: 'tours'
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
    url: '/bookings',
    notificationType: 'tours'
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
    url: '/bookings',
    notificationType: 'tours'
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
    notificationType: 'social',
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
    url: '/bookings',
    notificationType: 'tours'
  });
}

/**
 * Send push notification for roommate match (to both students)
 */
export async function notifyRoommateMatch(
  userId: string,
  matchedStudentName: string,
  compatibilityScore: number
) {
  return sendPushNotification({
    userId,
    title: '🎉 New Roommate Match!',
    body: `You matched with ${matchedStudentName} (${compatibilityScore}% compatible)`,
    url: '/roommate-finder',
    notificationType: 'social'
  });
}

/**
 * Send push notification to admin for new dorm submission
 */
export async function notifyAdminNewDorm(
  adminUserId: string,
  dormName: string,
  ownerName: string
) {
  return sendPushNotification({
    userId: adminUserId,
    title: '🏠 New Dorm Pending Verification',
    body: `${ownerName} submitted "${dormName}" for review`,
    url: '/admin/dorms',
    notificationType: 'admin'
  });
}

/**
 * Send push notification to admin for new owner registration
 */
export async function notifyAdminNewOwner(
  adminUserId: string,
  ownerName: string,
  ownerEmail: string
) {
  return sendPushNotification({
    userId: adminUserId,
    title: '👤 New Owner Registered',
    body: `${ownerName} (${ownerEmail}) has joined as a property owner`,
    url: '/admin/owners',
    notificationType: 'admin'
  });
}

/**
 * Send push notification to admin for AI Match subscription
 */
export async function notifyAdminSubscription(
  adminUserId: string,
  studentName: string,
  planType: string
) {
  return sendPushNotification({
    userId: adminUserId,
    title: '💳 New AI Match Subscription',
    body: `${studentName} subscribed to ${planType} plan`,
    url: '/admin/subscriptions',
    notificationType: 'admin'
  });
}

/**
 * Send push notification to owner when dorm is verified
 */
export async function notifyDormVerified(
  ownerUserId: string,
  dormName: string,
  status: 'Verified' | 'Rejected'
) {
  const isVerified = status === 'Verified';
  return sendPushNotification({
    userId: ownerUserId,
    title: isVerified ? '✅ Dorm Verified!' : '❌ Dorm Review Update',
    body: isVerified 
      ? `Your property "${dormName}" has been verified and is now live!`
      : `Your property "${dormName}" requires changes. Please check the details.`,
    url: '/owner/dorms',
    notificationType: 'admin'
  });
}

/**
 * Send push notification to owner for new reservation
 */
export async function notifyOwnerNewReservation(
  ownerUserId: string,
  studentName: string,
  roomName: string,
  dormName: string
) {
  return sendPushNotification({
    userId: ownerUserId,
    title: '🎊 New Room Reservation!',
    body: `${studentName} has reserved ${roomName} at ${dormName}`,
    url: '/owner/reservations',
    notificationType: 'reservations'
  });
}

/**
 * Send push notification to student when reservation is confirmed
 */
export async function notifyStudentReservationConfirmed(
  studentUserId: string,
  roomName: string,
  dormName: string
) {
  return sendPushNotification({
    userId: studentUserId,
    title: '✅ Reservation Confirmed!',
    body: `Your reservation for ${roomName} at ${dormName} is confirmed`,
    url: '/student/payments',
    notificationType: 'reservations'
  });
}
