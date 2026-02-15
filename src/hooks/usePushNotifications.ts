import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// VAPID public key - safe to expose in frontend code
// This must match the VAPID_PUBLIC_KEY secret in the backend
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BNxQvZrYvWnBzVXmQzlNLKvFJ8ZFXwqTJKzTmN8VjXZ9K7LmNpQrStUvWxYz0A1BcDeFgHiJkLmNoPqRsTuVwXy';

// Detect iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Check if running as installed PWA
const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [isIOSDevice] = useState(isIOS());
  const [isInstalledPWA] = useState(isPWA());
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Check for existing subscription
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const existingSubscription = await (registration as any).pushManager.getSubscription();
        setSubscription(existingSubscription);
      });
    }
  }, []);

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      if (isIOSDevice) {
        toast({
          title: 'iOS Notifications',
          description: 'To enable notifications on iPhone/iPad, first add Roomy to your Home Screen, then enable notifications in Settings.',
        });
      } else {
        toast({
          title: 'Not Supported',
          description: 'Push notifications are not supported in this browser',
          variant: 'destructive'
        });
      }
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will receive tour reminders and updates'
        });
        return true;
      } else {
        toast({
          title: 'Notifications Blocked',
          description: 'You can enable them later in browser settings',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      if (isIOSDevice) {
        if (!isInstalledPWA) {
          toast({
            title: 'Add to Home Screen First',
            description: 'To enable notifications on iPhone/iPad: tap the Share button, then "Add to Home Screen", then open Roomy from there.',
          });
        } else {
          toast({
            title: 'Enable in Settings',
            description: 'Go to Settings → Notifications → Roomy to enable notifications.',
          });
        }
      } else {
        toast({
          title: 'Not Supported',
          description: 'Push notifications are not supported in this browser',
          variant: 'destructive'
        });
      }
      return;
    }

    setLoading(true);
    try {
      // Request permission if not granted
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setLoading(false);
          return;
        }
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Subscribe to push notifications
      const pushSubscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      setSubscription(pushSubscription);

      // Save subscription to database
      const subscriptionData = pushSubscription.toJSON();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint!,
          p256dh: subscriptionData.keys!.p256dh!,
          auth_key: subscriptionData.keys!.auth!,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) throw error;

      // Also update notification_preferences to enable push
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          push_enabled: true
        }, {
          onConflict: 'user_id'
        });

      toast({
        title: 'Subscribed',
        description: 'You will now receive push notifications'
      });
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: 'Subscription Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      await subscription.unsubscribe();
      
      // Remove from database
      const subscriptionData = subscription.toJSON();
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscriptionData.endpoint!);

      // Also update notification_preferences to disable push
      if (user) {
        await supabase
          .from('notification_preferences')
          .upsert({
            user_id: user.id,
            push_enabled: false
          }, {
            onConflict: 'user_id'
          });
      }

      setSubscription(null);
      
      toast({
        title: 'Unsubscribed',
        description: 'Push notifications have been disabled'
      });
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    permission,
    subscription,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    isSubscribed: !!subscription,
    isIOSDevice,
    isInstalledPWA
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
