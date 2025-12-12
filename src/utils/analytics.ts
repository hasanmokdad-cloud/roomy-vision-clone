import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export type AnalyticsEventType = 
  | 'page_view'
  | 'dorm_view'
  | 'favorite_add'
  | 'favorite_remove'
  | 'booking_request'
  | 'contact_click'
  | 'ai_match_start'
  | 'ai_chat_start'
  | 'onboarding_complete';

interface LogEventParams {
  eventType: AnalyticsEventType;
  userId?: string | null;
  dormId?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Logs user actions to the backend via edge function
 */
export async function logAnalyticsEvent({
  eventType,
  userId,
  dormId,
  metadata = {}
}: LogEventParams): Promise<void> {
  try {
    // Skip analytics for unauthenticated users
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return;
    }

    const payload = {
      type: eventType,
      user_id: userId || session.user.id,
      dorm_id: dormId || null,
      meta: metadata
    };

    const { error } = await supabase.functions.invoke('log-user-actions', {
      body: payload
    });

    if (error) {
      console.error('[Analytics] Error logging event:', error);
    }
  } catch (error) {
    console.error('[Analytics] Failed to log event:', error);
  }
}

/**
 * Triggers the recommender training edge function
 */
export async function triggerRecommenderTraining(userId: string): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('train-recommender', {
      body: { user_id: userId }
    });

    if (error) {
      console.error('[Analytics] Error triggering recommender training:', error);
    }
  } catch (error) {
    console.error('[Analytics] Failed to trigger recommender training:', error);
  }
}

/**
 * Sends owner notification via edge function
 */
export async function sendOwnerNotification({
  ownerId,
  dormId,
  event,
  message
}: {
  ownerId: string;
  dormId: string;
  event: string;
  message?: string;
}): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-owner-notification', {
      body: {
        owner_id: ownerId,
        dorm_id: dormId,
        event,
        message
      }
    });

    if (error) {
      console.error('[Analytics] Error sending owner notification:', error);
    }
  } catch (error) {
    console.error('[Analytics] Failed to send owner notification:', error);
  }
}
