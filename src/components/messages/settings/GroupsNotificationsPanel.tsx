import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

interface GroupsNotificationsPanelProps {
  onBack: () => void;
}

export function GroupsNotificationsPanel({ onBack }: GroupsNotificationsPanelProps) {
  const { preferences, updatePreference, loading } = useNotificationPreferences();

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
        <h1 className="text-xl font-medium text-[#111b21] dark:text-[#e9edef]">Groups</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-4">
          {/* Show notifications */}
          <div className="px-6 py-4 flex items-center justify-between">
            <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">Show notifications</h3>
            <Switch
              checked={preferences.notify_social}
              onCheckedChange={(checked) => updatePreference('notify_social', checked)}
              className="data-[state=checked]:bg-[#00a884]"
            />
          </div>

          {/* Show reaction notifications */}
          <div className="px-6 py-4 flex items-center justify-between">
            <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">Show reaction notifications</h3>
            <Switch
              checked={preferences.notify_social}
              onCheckedChange={(checked) => updatePreference('notify_social', checked)}
              className="data-[state=checked]:bg-[#00a884]"
            />
          </div>

          {/* Play sound */}
          <div className="px-6 py-4 flex items-center justify-between">
            <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">Play sound</h3>
            <Switch
              checked={preferences.notify_tours}
              onCheckedChange={(checked) => updatePreference('notify_tours', checked)}
              className="data-[state=checked]:bg-[#00a884]"
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
