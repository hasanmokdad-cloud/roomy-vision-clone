import { ArrowLeft, Volume2, Play } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useChatSettings } from '@/hooks/useChatSettings';
import { useMessageSounds, type SoundOption } from '@/hooks/useMessageSounds';

interface SoundSettingsPanelProps {
  onBack: () => void;
}

const SOUND_OPTIONS: { value: SoundOption; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'chime', label: 'Chime' },
  { value: 'ding', label: 'Ding' },
  { value: 'subtle', label: 'Subtle' },
];

export function SoundSettingsPanel({ onBack }: SoundSettingsPanelProps) {
  const { settings, updateSetting, loading } = useChatSettings();
  const { previewSound } = useMessageSounds();

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
        <h1 className="text-xl font-medium text-[#111b21] dark:text-[#e9edef]">Sounds</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-4">
          {/* Sound Selection */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-3 mb-4">
              <Volume2 className="w-5 h-5 text-[#54656f] dark:text-[#aebac1]" />
              <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">Notification Sound</h3>
            </div>
            <div className="space-y-2">
              {SOUND_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors"
                >
                  <button
                    onClick={() => updateSetting('notification_sound', option.value)}
                    className="flex-1 flex items-center gap-3 text-left"
                    disabled={loading}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        settings.notification_sound === option.value
                          ? 'border-[#00a884] bg-[#00a884]'
                          : 'border-[#8696a0]'
                      }`}
                    >
                      {settings.notification_sound === option.value && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-[15px] text-[#111b21] dark:text-[#e9edef]">
                      {option.label}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => previewSound(option.value)}
                    className="h-8 w-8"
                  >
                    <Play className="w-4 h-4 text-[#00a884]" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e9edef] dark:bg-[#222d34] my-2" />

          {/* Incoming sound toggle */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">
                Play sound for incoming messages
              </h3>
              <p className="text-[13px] text-[#667781] dark:text-[#8696a0] mt-0.5">
                Hear a sound when you receive new messages
              </p>
            </div>
            <Switch
              checked={settings.incoming_sound_enabled}
              onCheckedChange={(checked) => updateSetting('incoming_sound_enabled', checked)}
              className="data-[state=checked]:bg-[#00a884]"
              disabled={loading}
            />
          </div>

          {/* Outgoing sound toggle */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">
                Play sound for outgoing messages
              </h3>
              <p className="text-[13px] text-[#667781] dark:text-[#8696a0] mt-0.5">
                Hear a sound when you send a message
              </p>
            </div>
            <Switch
              checked={settings.outgoing_sound_enabled}
              onCheckedChange={(checked) => updateSetting('outgoing_sound_enabled', checked)}
              className="data-[state=checked]:bg-[#00a884]"
              disabled={loading}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e9edef] dark:bg-[#222d34] my-2" />

          {/* Vibration toggle */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">
                Vibrate
              </h3>
              <p className="text-[13px] text-[#667781] dark:text-[#8696a0] mt-0.5">
                Vibrate when you receive new messages (mobile only)
              </p>
            </div>
            <Switch
              checked={settings.vibration_enabled}
              onCheckedChange={(checked) => updateSetting('vibration_enabled', checked)}
              className="data-[state=checked]:bg-[#00a884]"
              disabled={loading}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
