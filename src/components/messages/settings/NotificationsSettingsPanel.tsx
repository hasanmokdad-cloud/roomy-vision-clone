import { ArrowLeft, ChevronRight, Bell, Users, Radio } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { MessagesNotificationsPanel } from './MessagesNotificationsPanel';
import { GroupsNotificationsPanel } from './GroupsNotificationsPanel';
import { useState } from 'react';

type NotifView = 'main' | 'messages' | 'groups';

interface NotificationsSettingsPanelProps {
  onBack: () => void;
  onNavigate: (view: string) => void;
}

export function NotificationsSettingsPanel({ onBack, onNavigate }: NotificationsSettingsPanelProps) {
  const { preferences, updatePreference, loading } = useNotificationPreferences();
  const [currentView, setCurrentView] = useState<NotifView>('main');

  if (currentView === 'messages') {
    return <MessagesNotificationsPanel onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'groups') {
    return <GroupsNotificationsPanel onBack={() => setCurrentView('main')} />;
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-[60px] px-6 flex items-center gap-6 bg-[#f0f2f5] dark:bg-[#202c33]">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-[#54656f] dark:text-[#aebac1]" />
        </button>
        <h1 className="text-xl font-medium text-[#111b21] dark:text-[#e9edef]">Notifications</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-4">
          {/* Messages section */}
          <button
            onClick={() => setCurrentView('messages')}
            className="w-full px-6 py-4 flex items-center gap-6 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <Bell className="w-6 h-6 text-[#54656f] dark:text-[#aebac1]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">Messages</h3>
              <p className="text-[13px] text-[#667781] dark:text-[#8696a0]">
                {preferences.notify_messages ? 'On' : 'Off'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8696a0]" />
          </button>

          {/* Groups section */}
          <button
            onClick={() => setCurrentView('groups')}
            className="w-full px-6 py-4 flex items-center gap-6 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#54656f] dark:text-[#aebac1]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">Groups</h3>
              <p className="text-[13px] text-[#667781] dark:text-[#8696a0]">
                {preferences.notify_social ? 'On' : 'Off'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8696a0]" />
          </button>

          {/* Divider */}
          <div className="h-px bg-[#e9edef] dark:bg-[#222d34] my-2" />

          {/* Show previews toggle */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">Show previews</h3>
              <p className="text-[13px] text-[#667781] dark:text-[#8696a0] mt-0.5">
                Preview message text inside new message notifications
              </p>
            </div>
            <Switch
              checked={preferences.push_enabled}
              onCheckedChange={(checked) => updatePreference('push_enabled', checked)}
              className="data-[state=checked]:bg-[#00a884]"
            />
          </div>

          {/* Play sound for outgoing toggle */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">
                Play sound for outgoing messages
              </h3>
            </div>
            <Switch
              checked={preferences.notify_promotions}
              onCheckedChange={(checked) => updatePreference('notify_promotions', checked)}
              className="data-[state=checked]:bg-[#00a884]"
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e9edef] dark:bg-[#222d34] my-2" />

          {/* Background sync */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">Background sync</h3>
              <Switch
                checked={preferences.push_enabled}
                onCheckedChange={(checked) => updatePreference('push_enabled', checked)}
                className="data-[state=checked]:bg-[#00a884]"
              />
            </div>
            <p className="text-[13px] text-[#667781] dark:text-[#8696a0] mt-2">
              Keep messages synced in the background for faster loading
            </p>
          </div>

          {/* Info text */}
          <div className="px-6 py-4">
            <p className="text-[13px] text-[#667781] dark:text-[#8696a0]">
              To get notifications, make sure they're turned on in your browser and device settings.
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
