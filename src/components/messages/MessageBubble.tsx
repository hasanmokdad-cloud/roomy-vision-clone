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
}: MessageBubbleProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const messageRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
    setShowReactionBar(true);
  };

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

  // MessageStatusIcon component
  const MessageStatusIcon = ({ status }: { status: 'sent' | 'delivered' | 'seen' }) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 opacity-70" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 opacity-70" />;
      case 'seen':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  // Can edit within 15 minutes
  const canEdit =
    isSender &&
    onEdit &&
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

  return (
    <div
      ref={messageRef}
      className={`flex ${isSender ? "justify-end" : "justify-start"} mb-4 group relative chat-message-bubble`}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!isMobile) {
          setShowReactionBar(true);
        }
      }}
    >
      {!isSender && showAvatar && (
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={senderAvatar} />
          <AvatarFallback>{senderName[0]}</AvatarFallback>
        </Avatar>
      )}

      <div className="relative max-w-xs md:max-w-md">
        {/* Reaction Bar - appears ABOVE message */}
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
          />
        )}

        {/* Main message row with emoji button + bubble */}
        <div className="flex items-start gap-1">
          {/* Emoji button - LEFT side for SENT messages */}
          {!isMobile && isSender && (
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 h-6 w-6 mt-1 transition-opacity flex-shrink-0"
              onClick={() => setShowReactionBar(!showReactionBar)}
            >
              <Smile className="h-4 w-4" />
            </Button>
          )}

          {/* Message Bubble */}
          <div
            ref={bubbleRef}
            className={`relative rounded-lg px-4 py-2 ${
              isSender
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
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

            {!isSender && showAvatar && (
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

            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs opacity-70">
                {format(new Date(message.created_at), "HH:mm")}
              </span>
              {message.edited_at && (
                <span className="text-xs opacity-70">• edited</span>
              )}
              {localIsStarred && <span className="text-xs">⭐</span>}
              {localIsPinned && <span className="text-xs">📌</span>}
              
              {/* Read Receipt - Only for sender */}
              {isSender && (
                <MessageStatusIcon status={getMessageStatus(message)} />
              )}
            </div>
          </div>

          {/* Emoji button - RIGHT side for RECEIVED messages */}
          {!isMobile && !isSender && (
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 h-6 w-6 mt-1 transition-opacity flex-shrink-0"
              onClick={() => setShowReactionBar(!showReactionBar)}
            >
              <Smile className="h-4 w-4" />
            </Button>
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
