import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactionBar } from "./ReactionBar";
import { MessageContextMenu } from "./MessageContextMenu";
import { EmojiPickerSheet } from "./EmojiPickerSheet";
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
  reply_to_message_id?: string | null;
  is_starred?: boolean;
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
}: MessageBubbleProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const longPressTimerRef = useRef<NodeJS.Timeout>();
  const touchStartPosRef = useRef({ x: 0, y: 0 });

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
    try {
      await supabase
        .from("messages")
        .update({ is_starred: !message.is_starred })
        .eq("id", message.id);

      toast({ title: message.is_starred ? "Unstarred" : "Starred message" });
    } catch (error) {
      console.error("Error starring message:", error);
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
          />
        )}

        {/* Message Bubble */}
        <div
          className={`rounded-lg px-4 py-2 ${
            isSender
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          {!isSender && showAvatar && (
            <p className="text-xs font-semibold mb-1">{senderName}</p>
          )}
          
          {renderContent()}

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs opacity-70">
              {format(new Date(message.created_at), "HH:mm")}
            </span>
            {message.edited_at && (
              <span className="text-xs opacity-70">• edited</span>
            )}
            {message.is_starred && <span className="text-xs">⭐</span>}
          </div>
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

        {/* Three-dots menu button (desktop only) */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
            onClick={() => setShowContextMenu(true)}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        )}

        {/* Context Menu - appears BELOW message */}
        <MessageContextMenu
          open={showContextMenu}
          onOpenChange={setShowContextMenu}
          isSender={isSender}
          messageId={message.id}
          messageText={message.body}
          createdAt={message.created_at}
          onReply={() => {
            onReply();
            setShowContextMenu(false);
          }}
          onCopy={handleCopy}
          onEdit={onEdit}
          onStar={handleStar}
          onDelete={handleDelete}
          canEdit={canEdit}
        />

        {/* Full Emoji Picker */}
        <EmojiPickerSheet
          open={showEmojiPicker}
          onOpenChange={setShowEmojiPicker}
          onEmojiSelect={handleReactionSelect}
          mode="reaction"
        />
      </div>
    </div>
  );
}
