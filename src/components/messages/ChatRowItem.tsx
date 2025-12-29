import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pin, BellOff, Check, CheckCheck, ChevronDown, Archive, Trash2, Ban, Mail, Heart, HeartOff } from "lucide-react";
import { OnlineIndicator } from "./OnlineIndicator";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    is_favorite?: boolean;
    muted_until?: string | null;
    unreadCount?: number;
    student_id?: string;
    user_a_id?: string | null;
    user_b_id?: string | null;
  };
  isSelected: boolean;
  userId: string | null;
  onSelect: () => void;
  onUpdate: () => void;
  isBlocked?: boolean;
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
  isBlocked = false,
}: ChatRowItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const { toast } = useToast();
  
  const hasUnread = (conv.unreadCount || 0) > 0 && (!conv.muted_until || new Date(conv.muted_until) <= new Date());
  const unreadCount = conv.unreadCount || 0;
  const timestamp = conv.last_message_time ? formatWhatsAppTimestamp(conv.last_message_time) : '';
  
  // Determine the other user's ID for blocking
  const otherUserId = conv.user_a_id === userId ? conv.user_b_id : conv.user_a_id;
  
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
    setIsMenuOpen(false);
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
    setIsMenuOpen(false);
  };

  const handleMute = async () => {
    const isMuted = conv.muted_until && new Date(conv.muted_until) > new Date();
    const mutedUntil = isMuted ? null : new Date('2099-12-31').toISOString();
    
    const { error } = await supabase
      .from('conversations')
      .update({ muted_until: mutedUntil })
      .eq('id', conv.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update mute status", variant: "destructive" });
    } else {
      toast({ title: isMuted ? "Unmuted" : "Muted" });
      onUpdate();
    }
    setIsMenuOpen(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conv.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to delete chat", variant: "destructive" });
    } else {
      toast({ title: "Chat deleted" });
      onUpdate();
    }
    setShowDeleteDialog(false);
    setIsMenuOpen(false);
  };

  // Mark as unread - delete thread state to reset unread count
  const handleMarkAsUnread = async () => {
    if (!userId) return;
    
    const { error } = await supabase
      .from('user_thread_state')
      .delete()
      .eq('thread_id', conv.id)
      .eq('user_id', userId);
    
    if (error) {
      toast({ title: "Error", description: "Failed to mark as unread", variant: "destructive" });
    } else {
      toast({ title: "Marked as unread" });
      onUpdate();
    }
    setIsMenuOpen(false);
  };

  // Toggle favorite
  const handleToggleFavorite = async () => {
    const newValue = !conv.is_favorite;
    const { error } = await supabase
      .from('conversations')
      .update({ is_favorite: newValue })
      .eq('id', conv.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update favorite status", variant: "destructive" });
    } else {
      toast({ title: newValue ? "Added to favorites" : "Removed from favorites" });
      onUpdate();
    }
    setIsMenuOpen(false);
  };

  // Block user
  const handleBlock = async () => {
    if (!userId || !otherUserId) {
      toast({ title: "Error", description: "Cannot block this user", variant: "destructive" });
      return;
    }
    
    const { error } = await supabase
      .from('user_blocks')
      .insert({ 
        blocker_user_id: userId, 
        blocked_user_id: otherUserId 
      });
    
    if (error) {
      if (error.code === '23505') {
        toast({ title: "Already blocked" });
      } else {
        toast({ title: "Error", description: "Failed to block user", variant: "destructive" });
      }
    } else {
      toast({ title: "User blocked" });
      onUpdate();
    }
    setShowBlockDialog(false);
    setIsMenuOpen(false);
  };

  // Unblock user
  const handleUnblock = async () => {
    if (!userId || !otherUserId) return;
    
    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_user_id', userId)
      .eq('blocked_user_id', otherUserId);
    
    if (error) {
      toast({ title: "Error", description: "Failed to unblock user", variant: "destructive" });
    } else {
      toast({ title: "User unblocked" });
      onUpdate();
    }
    setIsMenuOpen(false);
  };

  const isMuted = conv.muted_until && new Date(conv.muted_until) > new Date();
  const showArrow = isHovered || isMenuOpen;

  return (
    <>
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
                {conv.is_favorite && <Heart className="w-3 h-3 text-red-500 fill-red-500 shrink-0" />}
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
                    <DropdownMenuContent 
                      align="start" 
                      side="bottom"
                      sideOffset={0}
                      alignOffset={-8}
                      className="w-[200px] bg-white dark:bg-[#233138] rounded-xl shadow-lg border-none py-2 z-[100]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem 
                        onClick={handleArchive}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f6] dark:hover:bg-[#182229] cursor-pointer focus:bg-[#f5f6f6] dark:focus:bg-[#182229]"
                      >
                        <Archive className="w-5 h-5 text-[#54656f] dark:text-[#aebac1]" />
                        <span className="text-[14px] text-[#111b21] dark:text-[#e9edef]">
                          {conv.is_archived ? 'Unarchive chat' : 'Archive chat'}
                        </span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={handleMute}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f6] dark:hover:bg-[#182229] cursor-pointer focus:bg-[#f5f6f6] dark:focus:bg-[#182229]"
                      >
                        <BellOff className="w-5 h-5 text-[#54656f] dark:text-[#aebac1]" />
                        <span className="text-[14px] text-[#111b21] dark:text-[#e9edef]">
                          {isMuted ? 'Unmute notifications' : 'Mute notifications'}
                        </span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={handlePin}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f6] dark:hover:bg-[#182229] cursor-pointer focus:bg-[#f5f6f6] dark:focus:bg-[#182229]"
                      >
                        <Pin className="w-5 h-5 text-[#54656f] dark:text-[#aebac1]" />
                        <span className="text-[14px] text-[#111b21] dark:text-[#e9edef]">
                          {conv.is_pinned ? 'Unpin chat' : 'Pin chat'}
                        </span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={handleMarkAsUnread}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f6] dark:hover:bg-[#182229] cursor-pointer focus:bg-[#f5f6f6] dark:focus:bg-[#182229]"
                      >
                        <Mail className="w-5 h-5 text-[#54656f] dark:text-[#aebac1]" />
                        <span className="text-[14px] text-[#111b21] dark:text-[#e9edef]">
                          Mark as unread
                        </span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={handleToggleFavorite}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f6] dark:hover:bg-[#182229] cursor-pointer focus:bg-[#f5f6f6] dark:focus:bg-[#182229]"
                      >
                        {conv.is_favorite ? (
                          <HeartOff className="w-5 h-5 text-[#54656f] dark:text-[#aebac1]" />
                        ) : (
                          <Heart className="w-5 h-5 text-[#54656f] dark:text-[#aebac1]" />
                        )}
                        <span className="text-[14px] text-[#111b21] dark:text-[#e9edef]">
                          {conv.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                        </span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator className="h-[1px] bg-[#e9edef] dark:bg-[#222d34] my-1" />
                      
                      <DropdownMenuItem 
                        onClick={() => {
                          if (isBlocked) {
                            handleUnblock();
                          } else {
                            setShowBlockDialog(true);
                          }
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f6] dark:hover:bg-[#182229] cursor-pointer focus:bg-[#f5f6f6] dark:focus:bg-[#182229]"
                      >
                        <Ban className="w-5 h-5 text-[#ea0038]" />
                        <span className="text-[14px] text-[#ea0038]">
                          {isBlocked ? 'Unblock' : 'Block'}
                        </span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => setShowDeleteDialog(true)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f6] dark:hover:bg-[#182229] cursor-pointer focus:bg-[#f5f6f6] dark:focus:bg-[#182229]"
                      >
                        <Trash2 className="w-5 h-5 text-[#ea0038]" />
                        <span className="text-[14px] text-[#ea0038]">Delete chat</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All messages in this conversation will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block confirmation dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {conv.other_user_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Blocked users won't be able to send you messages or see your online status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              className="bg-destructive hover:bg-destructive/90"
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
