import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Key, Lock, MessageSquare, Bell, Keyboard, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { NotificationsSettingsPanel } from './settings/NotificationsSettingsPanel';
import { ChatsSettingsPanel } from './settings/ChatsSettingsPanel';
import { cn } from '@/lib/utils';

type SettingsView = 'main' | 'notifications' | 'chats' | 'messages-notif' | 'groups-notif';

interface MessagesSettingsPanelProps {
  onClose: () => void;
}

export function MessagesSettingsPanel({ onClose }: MessagesSettingsPanelProps) {
  const { userId, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<SettingsView>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    avatar: string | null;
    bio: string | null;
  }>({ name: '', email: '', avatar: null, bio: null });

  // Fetch user profile
  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      // Get auth user email
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || '';

      // Try students first
      const { data: studentData } = await supabase
        .from('students')
        .select('full_name, profile_photo_url')
        .eq('user_id', userId)
        .single();

      if (studentData) {
        setUserProfile({
          name: studentData.full_name || '',
          email,
          avatar: studentData.profile_photo_url,
          bio: null,
        });
        return;
      }

      // Try owners
      const { data: ownerData } = await supabase
        .from('owners')
        .select('full_name, profile_photo_url')
        .eq('user_id', userId)
        .single();

      if (ownerData) {
        setUserProfile({
          name: ownerData.full_name || '',
          email,
          avatar: ownerData.profile_photo_url,
          bio: null,
        });
      }
    };

    fetchProfile();
  }, [userId]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    {
      id: 'account',
      icon: Key,
      title: 'Account',
      subtitle: 'Security notifications, change number',
      onClick: () => navigate('/settings'),
    },
    {
      id: 'privacy',
      icon: Lock,
      title: 'Privacy',
      subtitle: 'Block contacts, disappearing messages',
      onClick: () => navigate('/settings'),
    },
    {
      id: 'chats',
      icon: MessageSquare,
      title: 'Chats',
      subtitle: 'Theme, wallpapers, chat history',
      onClick: () => setCurrentView('chats'),
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notifications',
      subtitle: 'Message, group & call tones',
      onClick: () => setCurrentView('notifications'),
    },
    {
      id: 'shortcuts',
      icon: Keyboard,
      title: 'Keyboard shortcuts',
      subtitle: 'Quick actions for power users',
      onClick: () => {},
    },
    {
      id: 'help',
      icon: HelpCircle,
      title: 'Help',
      subtitle: 'Help center, contact us, privacy policy',
      onClick: () => navigate('/help'),
    },
  ];

  // Filter menu items based on search
  const filteredItems = menuItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render sub-panels
  if (currentView === 'notifications') {
    return (
      <NotificationsSettingsPanel 
        onBack={() => setCurrentView('main')}
        onNavigate={(view) => setCurrentView(view as SettingsView)}
      />
    );
  }

  if (currentView === 'chats') {
    return (
      <ChatsSettingsPanel onBack={() => setCurrentView('main')} />
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-[60px] px-6 flex items-center gap-6 bg-[#f0f2f5] dark:bg-[#202c33]">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-[#54656f] dark:text-[#aebac1]" />
        </button>
        <h1 className="text-xl font-medium text-[#111b21] dark:text-[#e9edef]">Settings</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-4">
          {/* Profile section */}
          <button
            onClick={() => navigate('/settings')}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors"
          >
            <Avatar className="w-20 h-20">
              <AvatarImage src={userProfile.avatar || undefined} alt={userProfile.name} />
              <AvatarFallback className="bg-[#dfe5e7] dark:bg-[#6a7175] text-[#54656f] dark:text-white text-2xl font-medium">
                {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <h2 className="text-lg font-medium text-[#111b21] dark:text-[#e9edef]">
                {userProfile.name || 'Your Name'}
              </h2>
              <p className="text-sm text-[#667781] dark:text-[#8696a0] truncate">
                {userProfile.bio || userProfile.email || 'Hey there! I am using Roomy'}
              </p>
            </div>
          </button>

          {/* Search */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#54656f] dark:text-[#aebac1]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings"
                className="pl-11 h-[35px] bg-[#f0f2f5] dark:bg-[#202c33] border-0 rounded-lg text-[#111b21] dark:text-[#e9edef] placeholder:text-[#667781] focus-visible:ring-1 focus-visible:ring-[#00a884]"
              />
            </div>
          </div>

          {/* Menu items */}
          <div className="mt-2">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="w-full px-6 py-4 flex items-center gap-6 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors"
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-[#54656f] dark:text-[#aebac1]" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-[17px] text-[#111b21] dark:text-[#e9edef]">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-[#667781] dark:text-[#8696a0]">
                    {item.subtitle}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8696a0]" />
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e9edef] dark:bg-[#222d34] my-2" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full px-6 py-4 flex items-center gap-6 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <LogOut className="w-6 h-6 text-[#ea0038]" />
            </div>
            <span className="text-[17px] text-[#ea0038]">Log out</span>
          </button>
        </div>
      </ScrollArea>
    </div>
  );
}
