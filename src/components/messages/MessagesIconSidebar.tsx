import { MessageSquare, Settings, Users, Radio, Megaphone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MessagesIconSidebarProps {
  activeView: 'chats' | 'settings';
  onViewChange: (view: 'chats' | 'settings') => void;
  unreadCount?: number;
}

export function MessagesIconSidebar({ 
  activeView, 
  onViewChange,
  unreadCount = 0 
}: MessagesIconSidebarProps) {
  const { userId } = useAuth();
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  // Fetch user profile info
  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      // Try students first
      const { data: studentData } = await supabase
        .from('students')
        .select('full_name, profile_photo_url')
        .eq('user_id', userId)
        .single();

      if (studentData) {
        setUserName(studentData.full_name || '');
        setUserAvatar(studentData.profile_photo_url);
        return;
      }

      // Try owners
      const { data: ownerData } = await supabase
        .from('owners')
        .select('full_name, profile_photo_url')
        .eq('user_id', userId)
        .single();

      if (ownerData) {
        setUserName(ownerData.full_name || '');
        setUserAvatar(ownerData.profile_photo_url);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const iconItems = [
    {
      id: 'chats' as const,
      icon: MessageSquare,
      label: 'Chats',
      badge: unreadCount,
    },
    {
      id: 'status' as const,
      icon: Radio,
      label: 'Status',
      disabled: true,
    },
    {
      id: 'channels' as const,
      icon: Megaphone,
      label: 'Channels',
      disabled: true,
    },
    {
      id: 'communities' as const,
      icon: Users,
      label: 'Communities',
      disabled: true,
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-[68px] h-full bg-[#f0f2f5] dark:bg-[#202c33] flex flex-col items-center py-3 border-r border-border/50">
        {/* Top icons */}
        <div className="flex flex-col items-center gap-1">
          {iconItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    if (!item.disabled && (item.id === 'chats')) {
                      onViewChange('chats');
                    }
                  }}
                  disabled={item.disabled}
                  className={cn(
                    "relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200",
                    activeView === 'chats' && item.id === 'chats' 
                      ? "bg-[#e9edef] dark:bg-[#2a3942]" 
                      : "hover:bg-[#e9edef] dark:hover:bg-[#2a3942]",
                    item.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "w-6 h-6",
                      activeView === 'chats' && item.id === 'chats'
                        ? "text-[#00a884]"
                        : "text-[#54656f] dark:text-[#aebac1]"
                    )} 
                  />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] font-medium text-white bg-[#25d366] rounded-full">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[#3b4a54] text-white border-0">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom icons */}
        <div className="flex flex-col items-center gap-1">
          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onViewChange('settings')}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200",
                  activeView === 'settings' 
                    ? "bg-[#e9edef] dark:bg-[#2a3942]" 
                    : "hover:bg-[#e9edef] dark:hover:bg-[#2a3942]"
                )}
              >
                <Settings 
                  className={cn(
                    "w-6 h-6",
                    activeView === 'settings'
                      ? "text-[#00a884]"
                      : "text-[#54656f] dark:text-[#aebac1]"
                  )} 
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#3b4a54] text-white border-0">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>

          {/* User avatar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-12 h-12 flex items-center justify-center">
                <Avatar className="w-10 h-10 ring-2 ring-transparent hover:ring-[#00a884] transition-all">
                  <AvatarImage src={userAvatar || undefined} alt={userName} />
                  <AvatarFallback className="bg-[#dfe5e7] dark:bg-[#6a7175] text-[#54656f] dark:text-white text-sm font-medium">
                    {userName?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#3b4a54] text-white border-0">
              <p>Profile</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
