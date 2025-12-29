import { useState, useRef, useEffect, useCallback, memo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronDown, Smile, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactionBar } from "./ReactionBar";
import { MessageContextMenu } from "./MessageContextMenu";
import { EmojiPickerSheet } from "./EmojiPickerSheet";
import { ReplyQuote } from "./ReplyQuote";
import { MessageInfoSheet } from "./MessageInfoSheet";
import { TranslateModal } from "./TranslateModal";
import { MessageActionOverlay } from "./MessageActionOverlay";
import { ForwardMessageSheet } from "./ForwardMessageSheet";
import { MediaLightbox } from "./MediaLightbox";
import { HighlightedText } from "./ConversationSearchBar";
import { AnimatedReaction } from "./AnimatedReaction";
import { InlineReactionCelebration } from "./ReactionCelebration";
import { ReactionSummarySheet } from "./ReactionSummarySheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { haptics } from "@/utils/haptics";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id?: string | null;
  body: string | null;
  created_at: string;
  attachment_type?: string | null;
  attachment_url?: string | null;
  attachment_duration?: number | null;
  attachment_metadata?: any;
  status?: string | null;
  read?: boolean;
  delivered_at?: string | null;
  seen_at?: string | null;
  played_at?: string | null;
  reply_to_message_id?: string | null;
  is_starred?: boolean;
  is_pinned?: boolean;
  pinned_at?: string | null;
  pinned_by?: string | null;
  edited_at?: string | null;
  deleted_for_all?: boolean;
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface MessageBubbleProps {
  message: Message;
  isSender: boolean;
  userId: string;
  senderName: string;
  senderAvatar?: string;
  onReply: () => void;
  onEdit?: () => void;
  renderContent: () => React.ReactNode;
  showAvatar?: boolean;
  allMessages?: Message[];
  onScrollToMessage?: (messageId: string) => void;
  onPinChange?: (messageId: string, isPinned: boolean) => void;
  searchQuery?: string;
  isCurrentSearchMatch?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

export function MessageBubble({
  message,
  isSender,
  userId,
  senderName,
  senderAvatar,
  onReply,
  onEdit,
  renderContent,
  showAvatar = false,
  allMessages = [],
  onScrollToMessage,
  onPinChange,
  searchQuery = "",
  isCurrentSearchMatch = false,
  isFirstInGroup = true,
  isLastInGroup = true,
}: MessageBubbleProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const messageRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionPosition, setReactionPosition] = useState<'top' | 'bottom'>('top');
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<{x: number, y: number} | null>(null);
  const [emojiButtonRect, setEmojiButtonRect] = useState<DOMRect | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [showActionOverlay, setShowActionOverlay] = useState(false);
  const [showForwardSheet, setShowForwardSheet] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [messageRect, setMessageRect] = useState<DOMRect | null>(null);
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [localIsStarred, setLocalIsStarred] = useState(message.is_starred);
  const [localIsPinned, setLocalIsPinned] = useState(message.is_pinned);
  const [showReactionSummary, setShowReactionSummary] = useState(false);
  const [selectedSummaryEmoji, setSelectedSummaryEmoji] = useState<string | null>(null);
  const [celebrationEmoji, setCelebrationEmoji] = useState<string | null>(null);
  const [newReactionEmojis, setNewReactionEmojis] = useState<Set<string>>(new Set());
  const longPressTimerRef = useRef<NodeJS.Timeout>();
  const touchStartPosRef = useRef({ x: 0, y: 0 });

  // Close emoji picker/reaction bar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowReactionBar(false);
        setShowEmojiPicker(false);
        setEmojiButtonRect(null);
      }
    };

    if (showReactionBar || showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showReactionBar, showEmojiPicker]);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalIsStarred(message.is_starred);
    setLocalIsPinned(message.is_pinned);
  }, [message.is_starred, message.is_pinned]);

  // Subscribe to real-time changes for starred/pinned status
  useEffect(() => {
    const channel = supabase
      .channel(`message-status-${message.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `id=eq.${message.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (typeof updated.is_starred === 'boolean') {
            setLocalIsStarred(updated.is_starred);
          }
          if (typeof updated.is_pinned === 'boolean') {
            setLocalIsPinned(updated.is_pinned);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [message.id]);

  // Load reactions for this message
  useEffect(() => {
    loadReactions();

    // Subscribe to reaction changes
    const channel = supabase
      .channel(`message-reactions-${message.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
          filter: `message_id=eq.${message.id}`,
        },
        () => {
          loadReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [message.id]);

  const loadReactions = async () => {
    const { data } = await supabase
      .from("message_reactions")
      .select("*")
      .eq("message_id", message.id);

    if (data) {
      setReactions(data);
    }
  };

  const handleReactionSelect = async (emoji: string) => {
    try {
      // Check if user already reacted with this emoji
      const existingReaction = reactions.find(
        (r) => r.user_id === userId && r.emoji === emoji
      );

      if (existingReaction) {
        // Optimistic update - remove immediately from local state
        setReactions(prev => prev.filter(r => r.id !== existingReaction.id));
        
        // Remove reaction from database
        const { error } = await supabase
          .from("message_reactions")
          .delete()
          .eq("id", existingReaction.id);
          
        if (error) {
          // Revert on error
          setReactions(prev => [...prev, existingReaction]);
          throw error;
        }
      } else {
        // Trigger celebration effect
        setCelebrationEmoji(emoji);
        haptics.selection();
        
        // Mark this emoji as new for animation
        setNewReactionEmojis(prev => new Set(prev).add(emoji));
        setTimeout(() => {
          setNewReactionEmojis(prev => {
            const next = new Set(prev);
            next.delete(emoji);
            return next;
          });
        }, 500);

        // Optimistic update - add immediately to local state
        const tempReaction = {
          id: `temp-${Date.now()}`,
          message_id: message.id,
          user_id: userId,
          emoji,
          created_at: new Date().toISOString(),
        };
        setReactions(prev => [...prev, tempReaction]);
        
        // Add reaction to database
        const { data, error } = await supabase.from("message_reactions").insert({
          message_id: message.id,
          user_id: userId,
          emoji,
        }).select().single();
        
        if (error) {
          // Revert on error
          setReactions(prev => prev.filter(r => r.id !== tempReaction.id));
          throw error;
        }
        
        // Replace temp reaction with real one
        if (data) {
          setReactions(prev => prev.map(r => r.id === tempReaction.id ? data : r));
        }
      }

      setShowReactionBar(false);
      setShowEmojiPicker(false);
      setEmojiButtonRect(null);
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  const handleCopy = () => {
    if (message.body) {
      navigator.clipboard.writeText(message.body);
      toast({ title: "Copied to clipboard" });
    }
  };

  const handleStar = async () => {
    const newValue = !localIsStarred;
    setLocalIsStarred(newValue); // Optimistic update
    
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_starred: newValue })
        .eq("id", message.id);

      if (error) throw error;

      toast({ title: newValue ? "Starred message" : "Unstarred" });
    } catch (error) {
      console.error("Error starring message:", error);
      setLocalIsStarred(!newValue); // Revert on error
      toast({
        title: "Error",
        description: "Failed to update star status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (deleteForEveryone: boolean) => {
    try {
      if (deleteForEveryone) {
        // Delete for everyone - set deleted_for_all flag
        await supabase
          .from("messages")
          .update({
            deleted_for_all: true,
            body: "This message was deleted",
          })
          .eq("id", message.id);

        toast({ title: "Message deleted for everyone" });
      } else {
        // Delete for me - would need a user_deleted_messages table
        toast({ title: "Message deleted", description: "Only you can see this" });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // Long press detection for mobile - opens new overlay
  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't start another long-press if overlay is already showing
    if (showActionOverlay) return;
    
    e.preventDefault();  // Block Safari text selection
    e.stopPropagation();
    
    touchStartPosRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };

    longPressTimerRef.current = setTimeout(() => {
      // Get the bubble rect for overlay positioning
      if (bubbleRef.current) {
        setMessageRect(bubbleRef.current.getBoundingClientRect());
        setShowActionOverlay(true);
      }
      // Haptic feedback
      haptics.longPress();
    }, 350); // 350ms for WhatsApp-style feel
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Don't process if overlay is showing
    if (showActionOverlay) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);

    // Cancel long-press if user scrolls (>10px movement)
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Don't interfere if overlay is showing - let overlay handle its own events
    if (showActionOverlay) return;
    
    e.preventDefault();
    e.stopPropagation();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  // Right-click detection for desktop
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    handleShowReactionBar(e);
  };

  // Show reaction bar with smart positioning based on CHAT AREA (not viewport)
  // Position directly adjacent to emoji button - immediate, no delay
  const handleShowReactionBar = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    // Use emoji button ref for precise positioning
    const emojiBtn = emojiButtonRef.current;
    const bubble = bubbleRef.current;
    
    // Get the chat container's top boundary (the scrollable chat area)
    const chatContainer = document.querySelector('.whatsapp-scrollbar');
    const chatContainerTop = chatContainer?.getBoundingClientRect().top ?? 0;
    
    if (emojiBtn) {
      const btnRect = emojiBtn.getBoundingClientRect();
      
      // Calculate space above WITHIN THE CHAT AREA, not viewport
      const spaceAboveChatArea = btnRect.top - chatContainerTop;
      
      // If less than 70px above emoji button within chat area, show below
      setReactionPosition(spaceAboveChatArea < 70 ? 'bottom' : 'top');
      
      // Store button rect for fixed positioning
      setEmojiButtonRect(btnRect);
      
      // Store anchor for emoji picker - center on emoji button
      setEmojiPickerAnchor({
        x: btnRect.left + btnRect.width / 2,
        y: btnRect.top + btnRect.height / 2
      });
    } else if (bubble) {
      // Fallback to bubble positioning
      const rect = bubble.getBoundingClientRect();
      const spaceAboveChatArea = rect.top - chatContainerTop;
      setReactionPosition(spaceAboveChatArea < 70 ? 'bottom' : 'top');
      setEmojiButtonRect(null);
      setEmojiPickerAnchor({
        x: isSender ? rect.left - 40 : rect.right + 40,
        y: rect.top + rect.height / 2
      });
    }
    setShowReactionBar(true);
  }, [isSender]);

  // Handler functions for menu actions
  const handleInfo = () => {
    setShowInfoModal(true);
    setShowContextMenu(false);
  };

  const handlePin = async () => {
    const newValue = !localIsPinned;
    setLocalIsPinned(newValue); // Optimistic update
    
    try {
      const { error } = await supabase
        .from("messages")
        .update({
          is_pinned: newValue,
          pinned_at: newValue ? new Date().toISOString() : null,
          pinned_by: newValue ? userId : null,
        })
        .eq("id", message.id);

      if (error) throw error;

      // Call parent callback to update pinned messages immediately
      if (onPinChange) {
        onPinChange(message.id, newValue);
      }

      toast({
        title: newValue ? "Message pinned" : "Message unpinned",
        description: newValue ? "Message pinned to top" : "Message removed from pinned",
      });
    } catch (error) {
      console.error("Error toggling pin:", error);
      setLocalIsPinned(!newValue); // Revert on error
      toast({
        title: "Error",
        description: "Failed to toggle pin status",
        variant: "destructive",
      });
    }
    setShowContextMenu(false);
  };

  const handleTranslate = () => {
    setShowTranslateModal(true);
    setShowContextMenu(false);
  };

  const handleForward = () => {
    setShowForwardSheet(true);
    setShowContextMenu(false);
    setShowActionOverlay(false);
  };

  // Handle image/video click to open lightbox
  const handleMediaClick = () => {
    if (message.attachment_type === 'image' || message.attachment_type === 'video') {
      setShowLightbox(true);
    }
  };

  // Get all media from conversation for lightbox navigation
  const conversationMedia = allMessages
    .filter(m => m.attachment_type === 'image' || m.attachment_type === 'video')
    .map(m => ({
      id: m.id,
      url: m.attachment_url || '',
      type: m.attachment_type as 'image' | 'video',
      timestamp: format(new Date(m.created_at), 'MMM d, yyyy HH:mm'),
    }));

  const currentMediaIndex = conversationMedia.findIndex(m => m.id === message.id);

  // Helper to get message status for read receipts
  const getMessageStatus = (msg: Message): 'sent' | 'delivered' | 'seen' => {
    if (msg.seen_at) return 'seen';
    if (msg.delivered_at) return 'delivered';
    return 'sent';
  };

  // MessageStatusIcon component - WhatsApp style
  const MessageStatusIcon = ({ status }: { status: 'sent' | 'delivered' | 'seen' }) => {
    switch (status) {
      case 'sent':
        return <Check className="w-[15px] h-[15px] text-[#8696a0]" />;
      case 'delivered':
        return <CheckCheck className="w-[15px] h-[15px] text-[#8696a0]" />;
      case 'seen':
        return <CheckCheck className="w-4 h-4 text-[#53bdeb]" />;
      default:
        return null;
    }
  };

  // Can edit within 15 minutes - only for text messages without attachments
  const canEdit =
    isSender &&
    onEdit &&
    !message.attachment_url && // No attachment
    message.body && // Has text content
    Date.now() - new Date(message.created_at).getTime() < 15 * 60 * 1000;

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { count: 0, userReacted: false };
    }
    acc[reaction.emoji].count++;
    if (reaction.user_id === userId) {
      acc[reaction.emoji].userReacted = true;
    }
    return acc;
  }, {} as Record<string, { count: number; userReacted: boolean }>);

  // Find replied-to message
  const repliedToMessage = message.reply_to_message_id
    ? allMessages.find((m) => m.id === message.reply_to_message_id)
    : null;

  // Show deleted message
  if (message.deleted_for_all) {
    return (
      <div className={`flex ${isSender ? "justify-end" : "justify-start"} mb-4`}>
        <div className="bg-muted/50 rounded-lg px-4 py-2 max-w-xs italic text-muted-foreground">
          This message was deleted
        </div>
      </div>
    );
  }

  // Determine spacing based on grouping
  const marginBottom = isLastInGroup ? 'mb-2' : 'mb-[2px]';
  
  // Only show avatar on first message in group for received messages
  const shouldShowAvatar = !isSender && showAvatar && isFirstInGroup;

  // Double-click to reply (left side of message)
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isMobile) return;
    
    // Get the bounding rect of the message
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    // Only trigger on left half of the message
    if (clickX < rect.width / 2) {
      // Add highlight flash effect
      const element = e.currentTarget as HTMLElement;
      element.classList.add('message-highlight-flash');
      setTimeout(() => element.classList.remove('message-highlight-flash'), 400);
      
      // Trigger reply
      onReply();
    }
  };

  return (
    <div
      ref={messageRef}
      className={`flex ${isSender ? "justify-end" : "justify-start"} ${marginBottom} group relative chat-message-bubble`}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!isMobile) {
          handleShowReactionBar();
        }
      }}
    >
      {shouldShowAvatar ? (
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={senderAvatar} />
          <AvatarFallback>{senderName[0]}</AvatarFallback>
        </Avatar>
      ) : !isSender && showAvatar ? (
        <div className="w-8 mr-2" /> /* Spacer to maintain alignment when avatar is hidden */
      ) : null}

      <div className="relative max-w-[65%]">
        {/* Backdrop for click-outside on reaction bar */}
        {showReactionBar && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={(e) => {
              e.stopPropagation();
              setShowReactionBar(false);
              setEmojiButtonRect(null);
            }} 
          />
        )}

        {/* Reaction Bar - appears above or below emoji button based on viewport position */}
        {showReactionBar && (
          <ReactionBar
            onReactionSelect={handleReactionSelect}
            onOpenFullPicker={() => {
              setShowReactionBar(false);
              setShowEmojiPicker(true);
            }}
            selectedEmojis={reactions
              .filter((r) => r.user_id === userId)
              .map((r) => r.emoji)}
            isSender={isSender}
            position={reactionPosition}
            buttonRect={emojiButtonRect}
          />
        )}

        {/* Main message row with emoji button + bubble */}
        <div className="flex items-center gap-1">
          {/* Emoji button - LEFT side for SENT messages - WhatsApp style white circle */}
          {!isMobile && isSender && (
            <button
              ref={emojiButtonRef}
              className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full bg-white dark:bg-[#2a3942] shadow-sm flex items-center justify-center transition-opacity flex-shrink-0 hover:shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (showReactionBar) {
                  setShowReactionBar(false);
                  setEmojiButtonRect(null);
                } else {
                  handleShowReactionBar(e);
                }
              }}
            >
              <Smile className="h-5 w-5 text-[#8696a0]" />
            </button>
          )}

          {/* Message Bubble - WhatsApp style */}
          <div
            ref={bubbleRef}
            className={`relative px-[14px] py-[8px] shadow-sm ${
              isSender
                ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-[18px] rounded-tr-[4px]"
                : "bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-[18px] rounded-tl-[4px]"
            }`}
          >
            {/* Dropdown Arrow - INSIDE bubble */}
            {!isMobile && (
              <MessageContextMenu
                open={showContextMenu}
                onOpenChange={setShowContextMenu}
                isSender={isSender}
                messageId={message.id}
                messageText={message.body}
                createdAt={message.created_at}
                deliveredAt={message.delivered_at}
                seenAt={message.seen_at}
                onReply={() => {
                  onReply();
                  setShowContextMenu(false);
                }}
                onCopy={handleCopy}
                onEdit={onEdit}
                onStar={handleStar}
                onInfo={handleInfo}
                onPin={handlePin}
                onTranslate={handleTranslate}
                onForward={handleForward}
                onDelete={handleDelete}
                canEdit={canEdit}
                isPinned={localIsPinned}
                isStarred={localIsStarred}
                trigger={
                  <button
                    className={`absolute top-1 ${
                      isSender ? "right-1" : "right-1"
                    } opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 transition-opacity`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                }
              />
            )}

            {shouldShowAvatar && (
              <p className="text-xs font-semibold mb-1">{senderName}</p>
            )}

            {/* Reply Quote */}
            {repliedToMessage && (
              <ReplyQuote
                senderName={
                  repliedToMessage.sender_id === userId ? "You" : senderName
                }
                messageSnippet={repliedToMessage.body?.substring(0, 50) || "Media"}
                onClick={() => {
                  if (onScrollToMessage) {
                    onScrollToMessage(repliedToMessage.id);
                  }
                }}
                isSender={isSender}
              />
            )}

            {renderContent()}

            {/* WhatsApp-style timestamp and status row */}
            <div className="flex items-center justify-end gap-1 mt-[2px] -mb-[2px]">
              {message.edited_at && (
                <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">edited</span>
              )}
              {localIsStarred && <span className="text-[11px]">⭐</span>}
              {localIsPinned && <span className="text-[11px]">📌</span>}
              <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">
                {format(new Date(message.created_at), "h:mm a")}
              </span>
              {/* Read Receipt - Only for sender */}
              {isSender && (
                <MessageStatusIcon status={getMessageStatus(message)} />
              )}
            </div>
          </div>

          {/* Emoji button - RIGHT side for RECEIVED messages - WhatsApp style white circle */}
          {!isMobile && !isSender && (
            <button
              ref={!isSender ? emojiButtonRef : undefined}
              className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full bg-white dark:bg-[#2a3942] shadow-sm flex items-center justify-center transition-opacity flex-shrink-0 hover:shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (showReactionBar) {
                  setShowReactionBar(false);
                  setEmojiButtonRect(null);
                } else {
                  handleShowReactionBar(e);
                }
              }}
            >
              <Smile className="h-5 w-5 text-[#8696a0]" />
            </button>
          )}
        </div>

        {/* Celebration effect */}
        <InlineReactionCelebration
          emoji={celebrationEmoji}
          onComplete={() => setCelebrationEmoji(null)}
          position={isSender ? "right" : "left"}
        />

        {/* Reactions Display - below message with animations */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 relative">
            {Object.entries(groupedReactions).map(([emoji, data]) => (
              <AnimatedReaction
                key={emoji}
                emoji={emoji}
                count={data.count}
                userReacted={data.userReacted}
                isNew={newReactionEmojis.has(emoji)}
                onClick={() => handleReactionSelect(emoji)}
                onLongPress={() => {
                  setSelectedSummaryEmoji(emoji);
                  setShowReactionSummary(true);
                }}
              />
            ))}
          </div>
        )}

        {/* Reaction Summary Sheet */}
        <ReactionSummarySheet
          open={showReactionSummary}
          onOpenChange={setShowReactionSummary}
          messageId={message.id}
          currentUserId={userId}
          initialEmoji={selectedSummaryEmoji || undefined}
        />

        {/* Full Emoji Picker */}
        <EmojiPickerSheet
          open={showEmojiPicker}
          onOpenChange={setShowEmojiPicker}
          onEmojiSelect={handleReactionSelect}
          mode="reaction"
          anchorPosition={emojiPickerAnchor}
        />

        {/* Message Info Sheet */}
        <MessageInfoSheet
          open={showInfoModal}
          onOpenChange={setShowInfoModal}
          messageText={message.body}
          createdAt={message.created_at}
          deliveredAt={message.delivered_at}
          seenAt={message.seen_at}
          playedAt={message.played_at}
          isSender={isSender}
          attachmentType={message.attachment_type}
          attachmentUrl={message.attachment_url}
          attachmentDuration={message.attachment_duration}
        />

        {/* Translate Modal - hidden for now, will implement later */}
        {/* <TranslateModal
          open={showTranslateModal}
          onOpenChange={setShowTranslateModal}
          messageText={message.body}
        /> */}

        {/* Forward Message Sheet */}
        <ForwardMessageSheet
          open={showForwardSheet}
          onOpenChange={setShowForwardSheet}
          messages={[{
            id: message.id,
            body: message.body,
            attachment_type: message.attachment_type,
            attachment_url: message.attachment_url,
            attachment_duration: message.attachment_duration,
          }]}
        />

        {/* Media Lightbox */}
        {(message.attachment_type === 'image' || message.attachment_type === 'video') && (
          <MediaLightbox
            open={showLightbox}
            onClose={() => setShowLightbox(false)}
            media={conversationMedia}
            initialIndex={currentMediaIndex >= 0 ? currentMediaIndex : 0}
            onForward={() => setShowForwardSheet(true)}
          />
        )}

        {/* Mobile Action Overlay with blur background */}
        <MessageActionOverlay
          open={showActionOverlay}
          onClose={() => setShowActionOverlay(false)}
          message={{
            id: message.id,
            body: message.body,
            created_at: message.created_at,
            sender_id: message.sender_id,
            is_starred: localIsStarred,
            is_pinned: localIsPinned,
            attachment_url: message.attachment_url,
            attachment_type: message.attachment_type,
          }}
          isSender={isSender}
          messageRect={messageRect}
          onReply={() => {
            onReply();
            setShowActionOverlay(false);
          }}
          onForward={handleForward}
          onCopy={handleCopy}
          onStar={handleStar}
          onPin={handlePin}
          onInfo={() => setShowInfoModal(true)}
          onTranslate={() => setShowTranslateModal(true)}
          onEdit={onEdit}
          onDelete={handleDelete}
          onReact={handleReactionSelect}
          onOpenEmojiPicker={() => setShowEmojiPicker(true)}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
