import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pin, BellOff, Check, CheckCheck, ChevronDown } from "lucide-react";
import { OnlineIndicator } from "./OnlineIndicator";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatRowItemProps {
  conversation: {
    id: string;
    other_user_name?: string;
    other_user_photo?: string | null;
    last_message?: string;
    last_message_time?: string;
    last_message_sender_id?: string | null;
    last_message_status?: 'sent' | 'delivered' | 'seen';
    is_pinned?: boolean;
    is_archived?: boolean;
    muted_until?: string | null;
    unreadCount?: number;
    student_id?: string;
  };
  isSelected: boolean;
  userId: string | null;
  onSelect: () => void;
  onUpdate: () => void;
}

// Format timestamp WhatsApp style
const formatWhatsAppTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  
  // Same day - show time
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  // Within last 7 days - show day name
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  
  // Older - show date MM/DD/YYYY
  return date.toLocaleDateString('en-US', { 
    month: 'numeric', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const MessageStatusIcon = ({ status }: { status?: 'sent' | 'delivered' | 'seen' }) => {
  switch (status) {
    case 'sent':
      return <Check className="w-3 h-3 text-muted-foreground" />;
    case 'delivered':
      return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
    case 'seen':
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    default:
      return null;
  }
};

export function ChatRowItem({
  conversation: conv,
  isSelected,
  userId,
  onSelect,
  onUpdate,
}: ChatRowItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  
  const hasUnread = (conv.unreadCount || 0) > 0 && (!conv.muted_until || new Date(conv.muted_until) <= new Date());
  const unreadCount = conv.unreadCount || 0;
  const timestamp = conv.last_message_time ? formatWhatsAppTimestamp(conv.last_message_time) : '';
  
  // Handlers for menu actions
  const handlePin = async () => {
    const newPinnedState = !conv.is_pinned;
    const { error } = await supabase
      .from('conversations')
      .update({ is_pinned: newPinnedState })
      .eq('id', conv.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update pin status", variant: "destructive" });
    } else {
      toast({ title: newPinnedState ? "Pinned" : "Unpinned" });
      onUpdate();
    }
  };

  const handleArchive = async () => {
    const newArchivedState = !conv.is_archived;
    const { error } = await supabase
      .from('conversations')
      .update({ is_archived: newArchivedState })
      .eq('id', conv.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update archive status", variant: "destructive" });
    } else {
      toast({ title: newArchivedState ? "Archived" : "Unarchived" });
      onUpdate();
    }
  };

  const handleMute = async (duration: 'unmute' | '8h' | '1w' | 'always') => {
    let mutedUntil: string | null = null;
    
    if (duration === '8h') {
      mutedUntil = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    } else if (duration === '1w') {
      mutedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (duration === 'always') {
      mutedUntil = new Date('2099-12-31').toISOString();
    }
    
    const { error } = await supabase
      .from('conversations')
      .update({ muted_until: mutedUntil })
      .eq('id', conv.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update mute status", variant: "destructive" });
    } else {
      toast({ title: duration === 'unmute' ? "Unmuted" : "Muted" });
      onUpdate();
    }
  };

  const isMuted = conv.muted_until && new Date(conv.muted_until) > new Date();
  const showArrow = isHovered || isMenuOpen;

  return (
    <div 
      className={`relative cursor-pointer transition-colors mx-2 rounded-lg ${
        isSelected 
          ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' 
          : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'
      }`}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Avatar - 49px like WhatsApp */}
        <div className="relative shrink-0">
          <Avatar className="w-[49px] h-[49px]">
            <AvatarImage src={conv.other_user_photo || undefined} alt={conv.other_user_name} />
            <AvatarFallback className="bg-primary/20 text-primary text-base">
              {conv.other_user_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {conv.student_id && <OnlineIndicator userId={conv.student_id} />}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Name + Timestamp */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {conv.is_pinned && <Pin className="w-3 h-3 text-muted-foreground shrink-0" />}
              {isMuted && <BellOff className="w-3 h-3 text-muted-foreground shrink-0" />}
              <span className={`text-[15px] truncate ${hasUnread ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                {conv.other_user_name}
              </span>
            </div>
            {timestamp && (
              <span 
                className={`text-[12px] shrink-0 ${
                  hasUnread ? 'text-[#25d366] font-medium' : 'text-[#667781]'
                }`}
              >
                {timestamp}
              </span>
            )}
          </div>
          
          {/* Row 2: Message preview + Unread/Arrow */}
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {conv.last_message_sender_id === userId && (
                <MessageStatusIcon status={conv.last_message_status} />
              )}
              <p className={`text-[13px] truncate ${hasUnread ? 'text-foreground' : 'text-[#667781]'}`}>
                {conv.last_message || 'Start a conversation'}
              </p>
            </div>
            
            {/* Right side: Unread counter and/or dropdown arrow */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Unread counter - shifts left when arrow is visible */}
              {hasUnread && unreadCount > 0 && (
                <div 
                  className={`transition-transform duration-150 ${
                    showArrow ? '-translate-x-6' : 'translate-x-0'
                  }`}
                >
                  <span className="bg-[#25d366] text-white text-[11px] font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1.5">
                    {unreadCount > 999 ? '999+' : unreadCount}
                  </span>
                </div>
              )}
              
              {/* Dropdown arrow - only visible on hover */}
              {showArrow && (
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5">
                      <ChevronDown className="w-[18px] h-[18px] text-[#8696a0]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={handleArchive}>
                      {conv.is_archived ? 'Unarchive chat' : 'Archive chat'}
                    </DropdownMenuItem>
                    {isMuted ? (
                      <DropdownMenuItem onClick={() => handleMute('unmute')}>
                        Unmute notifications
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => handleMute('8h')}>
                          Mute for 8 hours
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMute('1w')}>
                          Mute for 1 week
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMute('always')}>
                          Mute always
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={handlePin}>
                      {conv.is_pinned ? 'Unpin chat' : 'Pin chat'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
