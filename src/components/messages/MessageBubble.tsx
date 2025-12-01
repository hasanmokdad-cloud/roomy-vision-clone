import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronDown, Smile, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactionBar } from "./ReactionBar";
import { MessageContextMenu } from "./MessageContextMenu";
import { EmojiPickerSheet } from "./EmojiPickerSheet";
import { ReplyQuote } from "./ReplyQuote";
import { MessageInfoModal } from "./MessageInfoModal";
import { TranslateModal } from "./TranslateModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

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
}: MessageBubbleProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const messageRef = useRef<HTMLDivElement>(null);
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [localIsStarred, setLocalIsStarred] = useState(message.is_starred);
  const [localIsPinned, setLocalIsPinned] = useState(message.is_pinned);
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
        // Remove reaction
        await supabase
          .from("message_reactions")
          .delete()
          .eq("id", existingReaction.id);
      } else {
        // Add reaction
        await supabase.from("message_reactions").insert({
          message_id: message.id,
          user_id: userId,
          emoji,
        });
      }

      setShowReactionBar(false);
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

  // Long press detection for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPosRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };

    longPressTimerRef.current = setTimeout(() => {
      setShowReactionBar(true);
      // Haptic feedback if supported
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 1500); // 1.5 seconds
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);

    // Cancel if moved too much
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    }
  };

  const handleTouchEnd = () => {
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
    toast({
      title: "Coming Soon",
      description: "Message forwarding will be available soon!",
    });
    setShowContextMenu(false);
  };

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
      className={`flex ${isSender ? "justify-end" : "justify-start"} mb-4 group relative`}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      onContextMenu={!isMobile ? handleContextMenu : undefined}
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

        {/* Reactions Display - below message */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(groupedReactions).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => handleReactionSelect(emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  data.userReacted
                    ? "bg-primary/20 border border-primary"
                    : "bg-muted border border-border"
                }`}
              >
                <span>{emoji}</span>
                <span className="font-medium">{data.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Full Emoji Picker */}
        <EmojiPickerSheet
          open={showEmojiPicker}
          onOpenChange={setShowEmojiPicker}
          onEmojiSelect={handleReactionSelect}
          mode="reaction"
        />

        {/* Message Info Modal */}
        <MessageInfoModal
          open={showInfoModal}
          onOpenChange={setShowInfoModal}
          messageText={message.body}
          createdAt={message.created_at}
          deliveredAt={message.delivered_at}
          seenAt={message.seen_at}
          isSender={isSender}
        />

        {/* Translate Modal */}
        <TranslateModal
          open={showTranslateModal}
          onOpenChange={setShowTranslateModal}
          messageText={message.body}
        />
      </div>
    </div>
  );
}
