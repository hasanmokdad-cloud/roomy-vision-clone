import { ArrowLeft, ChevronRight, Sun, Image } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useChatSettings } from '@/hooks/useChatSettings';
import { ThemeModal } from './ThemeModal';
import { WallpaperPicker } from './WallpaperPicker';
import { useState } from 'react';

type ChatsView = 'main' | 'wallpaper';

interface ChatsSettingsPanelProps {
  onBack: () => void;
}

export function ChatsSettingsPanel({ onBack }: ChatsSettingsPanelProps) {
  const { settings, updateSetting, loading } = useChatSettings();
  const [currentView, setCurrentView] = useState<ChatsView>('main');
  const [showThemeModal, setShowThemeModal] = useState(false);

  const getThemeLabel = () => {
    switch (settings.theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      default: return 'System default';
    }
  };

  if (currentView === 'wallpaper') {
    return (
      <WallpaperPicker
        onBack={() => setCurrentView('main')}
        currentWallpaper={settings.chat_wallpaper}
        onSelect={(color) => {
          updateSetting('chat_wallpaper', color);
          setCurrentView('main');
        }}
      />
    );
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
        <h1 className="text-xl font-medium text-[#111b21] dark:text-[#e9edef]">Chats</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-4">
          {/* Display section title */}
          <div className="px-6 py-2">
            <h2 className="text-[13px] font-medium text-[#00a884] uppercase tracking-wide">Display</h2>
          </div>

          {/* Theme */}
          <button
            onClick={() => setShowThemeModal(true)}
            className="w-full px-6 py-4 flex items-center gap-6 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <Sun className="w-6 h-6 text-[#54656f] dark:text-[#aebac1]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">Theme</h3>
              <p className="text-[13px] text-[#667781] dark:text-[#8696a0]">{getThemeLabel()}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8696a0]" />
          </button>

          {/* Wallpaper */}
          <button
            onClick={() => setCurrentView('wallpaper')}
            className="w-full px-6 py-4 flex items-center gap-6 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <Image className="w-6 h-6 text-[#54656f] dark:text-[#aebac1]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">Wallpaper</h3>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8696a0]" />
          </button>

          {/* Divider */}
          <div className="h-px bg-[#e9edef] dark:bg-[#222d34] my-2" />

          {/* Chat settings section title */}
          <div className="px-6 py-2">
            <h2 className="text-[13px] font-medium text-[#00a884] uppercase tracking-wide">Chat settings</h2>
          </div>

          {/* Enter is send */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">Enter is send</h3>
              <p className="text-[13px] text-[#667781] dark:text-[#8696a0] mt-0.5">
                Pressing Enter will send a message
              </p>
            </div>
            <Switch
              checked={settings.enter_is_send}
              onCheckedChange={(checked) => updateSetting('enter_is_send', checked)}
              className="data-[state=checked]:bg-[#00a884]"
            />
          </div>

          {/* Spell check */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">Spell check</h3>
              <p className="text-[13px] text-[#667781] dark:text-[#8696a0] mt-0.5">
                Check spelling in your messages
              </p>
            </div>
            <Switch
              checked={settings.spell_check}
              onCheckedChange={(checked) => updateSetting('spell_check', checked)}
              className="data-[state=checked]:bg-[#00a884]"
            />
          </div>

          {/* Replace text with emoji */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">Replace text with emoji</h3>
              <p className="text-[13px] text-[#667781] dark:text-[#8696a0] mt-0.5">
                Automatically convert emoticons to emoji
              </p>
            </div>
            <Switch
              checked={settings.replace_text_with_emoji}
              onCheckedChange={(checked) => updateSetting('replace_text_with_emoji', checked)}
              className="data-[state=checked]:bg-[#00a884]"
            />
          </div>
        </div>
      </ScrollArea>

      {/* Theme modal */}
      <ThemeModal
        open={showThemeModal}
        onOpenChange={setShowThemeModal}
        currentTheme={settings.theme}
        onSelect={(theme) => {
          updateSetting('theme', theme);
          setShowThemeModal(false);
        }}
      />
    </div>
  );
}
