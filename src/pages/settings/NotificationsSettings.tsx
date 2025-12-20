import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, MessageSquare, CalendarDays, Home, Users, Megaphone, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner';
import { useToast } from '@/hooks/use-toast';
import { SwipeableSubPage } from '@/components/mobile/SwipeableSubPage';

interface NotificationRowProps {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function NotificationRow({ icon, label, subtitle, checked, onCheckedChange, disabled }: NotificationRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border/50 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

export default function NotificationsSettings() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const { preferences, loading, saving, updatePreference } = useNotificationPreferences();
  const { 
    permission, 
    isSubscribed, 
    subscribe, 
    unsubscribe, 
    loading: pushLoading,
    isIOSDevice,
    isInstalledPWA
  } = usePushNotifications();

  // Check if push notifications are supported
  const isPushSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  const canEnablePush = isPushSupported || (isIOSDevice && isInstalledPWA);

  const handleMasterToggle = async (checked: boolean) => {
    if (checked) {
      // User wants to enable - need to request permission first
      if (isIOSDevice && !isInstalledPWA) {
        toast({
          title: 'Install App First',
          description: 'To enable notifications on iPhone/iPad, add Roomy to your Home Screen first.',
        });
        return;
      }

      await subscribe();
      if (permission === 'granted') {
        await updatePreference('push_enabled', true);
      }
    } else {
      // User wants to disable
      await unsubscribe();
      await updatePreference('push_enabled', false);
    }
  };

  const handleCategoryToggle = async (key: keyof typeof preferences, checked: boolean) => {
    await updatePreference(key, checked);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <SwipeableSubPage enabled={isMobile}>
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* PWA Install Banner - show if not installed on mobile */}
        {isMobile && <PWAInstallBanner className="mb-4" />}

        {/* Master Push Toggle Section */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Push Notifications
          </h2>
          <div className="bg-card rounded-xl border border-border p-4">
            <NotificationRow
              icon={<Smartphone className="h-5 w-5 text-primary" />}
              label="Push Notifications"
              subtitle={
                !canEnablePush 
                  ? isIOSDevice 
                    ? "Add Roomy to Home Screen to enable" 
                    : "Not supported in this browser"
                  : isSubscribed 
                    ? "You'll receive push notifications" 
                    : "Enable to receive notifications"
              }
              checked={isSubscribed && preferences.push_enabled}
              onCheckedChange={handleMasterToggle}
              disabled={pushLoading || !canEnablePush}
            />
          </div>
          {!canEnablePush && isIOSDevice && (
            <p className="text-xs text-muted-foreground px-1">
              iOS requires the app to be installed on your Home Screen to send notifications.
            </p>
          )}
        </div>

        {/* Notification Categories */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Notification Types
          </h2>
          <div className="bg-card rounded-xl border border-border">
            <div className="px-4">
              <NotificationRow
                icon={<CalendarDays className="h-5 w-5 text-blue-500" />}
                label="Tours & Bookings"
                subtitle="Tour requests, confirmations, and reminders"
                checked={preferences.notify_tours}
                onCheckedChange={(checked) => handleCategoryToggle('notify_tours', checked)}
                disabled={saving || !preferences.push_enabled}
              />
              
              <NotificationRow
                icon={<MessageSquare className="h-5 w-5 text-green-500" />}
                label="Messages"
                subtitle="New messages from students and owners"
                checked={preferences.notify_messages}
                onCheckedChange={(checked) => handleCategoryToggle('notify_messages', checked)}
                disabled={saving || !preferences.push_enabled}
              />
              
              <NotificationRow
                icon={<Home className="h-5 w-5 text-orange-500" />}
                label="Reservations"
                subtitle="Room reservations and payment updates"
                checked={preferences.notify_reservations}
                onCheckedChange={(checked) => handleCategoryToggle('notify_reservations', checked)}
                disabled={saving || !preferences.push_enabled}
              />
              
              <NotificationRow
                icon={<Users className="h-5 w-5 text-purple-500" />}
                label="Social"
                subtitle="Friend requests and roommate matches"
                checked={preferences.notify_social}
                onCheckedChange={(checked) => handleCategoryToggle('notify_social', checked)}
                disabled={saving || !preferences.push_enabled}
              />
              
              <NotificationRow
                icon={<Megaphone className="h-5 w-5 text-pink-500" />}
                label="Promotions"
                subtitle="Special offers and announcements"
                checked={preferences.notify_promotions}
                onCheckedChange={(checked) => handleCategoryToggle('notify_promotions', checked)}
                disabled={saving || !preferences.push_enabled}
              />
            </div>
          </div>
          
          {!preferences.push_enabled && (
            <p className="text-xs text-muted-foreground px-1">
              Enable push notifications above to customize notification types.
            </p>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground">About notifications</p>
              <p className="mt-1">
                Push notifications keep you updated even when Roomy is closed. 
                You can change these settings anytime or manage notifications 
                in your device settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </SwipeableSubPage>
  );
}
