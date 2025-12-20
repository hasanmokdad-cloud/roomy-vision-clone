import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { 
  Reply, 
  Forward, 
  Copy, 
  Star, 
  StarOff, 
  Pin, 
  Languages, 
  Info, 
  Trash2,
  Plus,
  Edit3
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { DeleteMessageDrawer } from "./DeleteMessageDrawer";

interface Message {
  id: string;
  body: string | null;
  created_at: string;
  sender_id: string;
  is_starred?: boolean;
  is_pinned?: boolean;
  attachment_url?: string | null;
  attachment_type?: string | null;
}

interface MessageActionOverlayProps {
  open: boolean;
  onClose: () => void;
  message: Message;
  isSender: boolean;
  messageRect: DOMRect | null;
  onReply: () => void;
  onForward: () => void;
  onCopy: () => void;
  onStar: () => void;
  onPin: () => void;
  onInfo: () => void;
  onTranslate: () => void;
  onEdit?: () => void;
  onDelete: (forEveryone: boolean) => void;
  onReact: (emoji: string) => void;
  onOpenEmojiPicker: () => void;
  canEdit?: boolean;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "👏"];

export function MessageActionOverlay({
  open,
  onClose,
  message,
  isSender,
  messageRect,
  onReply,
  onForward,
  onCopy,
  onStar,
  onPin,
  onInfo,
  onTranslate,
  onEdit,
  onDelete,
  onReact,
  onOpenEmojiPicker,
  canEdit = false,
}: MessageActionOverlayProps) {
  const [showDeleteDrawer, setShowDeleteDrawer] = useState(false);

  if (!open || !messageRect) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const handleReact = (emoji: string) => {
    onReact(emoji);
    onClose();
  };

  // Calculate position to keep message in place
  const messageTop = messageRect.top;
  const messageLeft = isSender ? undefined : messageRect.left;
  const messageRight = isSender ? window.innerWidth - messageRect.right : undefined;
  const messageWidth = messageRect.width;

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Blur backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Message clone in original position */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[101]"
            style={{
              top: messageTop,
              left: messageLeft,
              right: messageRight,
              width: messageWidth,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Reaction bar - ABOVE message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`flex items-center gap-1 mb-2 ${isSender ? 'justify-end' : 'justify-start'}`}
            >
              <div className="bg-card/95 backdrop-blur-lg rounded-full px-3 py-2 flex items-center gap-1 shadow-lg border border-border/50">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className="w-10 h-10 flex items-center justify-center text-2xl hover:scale-125 active:scale-95 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
                <div className="w-px h-6 bg-border mx-1" />
                <button
                  onClick={() => {
                    onOpenEmojiPicker();
                    onClose();
                  }}
                  className="w-10 h-10 flex items-center justify-center hover:bg-accent rounded-full transition-colors"
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>

            {/* Message preview bubble */}
            <div
              className={`rounded-2xl px-4 py-3 shadow-lg ${
                isSender
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-card text-card-foreground"
              }`}
              style={{ maxWidth: messageWidth }}
            >
              {message.attachment_type === "image" && message.attachment_url && (
                <img
                  src={message.attachment_url}
                  alt="attachment"
                  className="w-full rounded-lg mb-2 max-h-48 object-cover"
                />
              )}
              {message.body && <p className="text-sm whitespace-pre-wrap">{message.body}</p>}
              <p className="text-xs opacity-70 mt-1">
                {format(new Date(message.created_at), "HH:mm")}
              </p>
            </div>

            {/* Action menu - BELOW message */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`mt-2 ${isSender ? 'ml-auto' : ''}`}
              style={{ width: 'fit-content', minWidth: '200px' }}
            >
              <div className="bg-card/95 backdrop-blur-lg rounded-2xl overflow-hidden shadow-lg border border-border/50">
                <ActionButton icon={Reply} label="Reply" onClick={() => handleAction(onReply)} />
                <ActionButton icon={Forward} label="Forward" onClick={() => handleAction(onForward)} />
                {message.body && (
                  <ActionButton icon={Copy} label="Copy" onClick={() => handleAction(onCopy)} />
                )}
                {isSender && canEdit && (
                  <ActionButton icon={Edit3} label="Edit" onClick={() => handleAction(onEdit!)} />
                )}
                {isSender && (
                  <ActionButton icon={Info} label="Info" onClick={() => handleAction(onInfo)} />
                )}
                <ActionButton 
                  icon={message.is_starred ? StarOff : Star} 
                  label={message.is_starred ? "Unstar" : "Star"} 
                  onClick={() => handleAction(onStar)} 
                />
                <ActionButton 
                  icon={Pin} 
                  label={message.is_pinned ? "Unpin" : "Pin"} 
                  onClick={() => handleAction(onPin)} 
                />
                <ActionButton icon={Languages} label="Translate" onClick={() => handleAction(onTranslate)} />
                <ActionButton 
                  icon={Trash2} 
                  label="Delete" 
                  onClick={() => setShowDeleteDrawer(true)} 
                  destructive 
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Delete confirmation drawer */}
          <DeleteMessageDrawer
            open={showDeleteDrawer}
            onOpenChange={setShowDeleteDrawer}
            isSender={isSender}
            onDeleteForMe={() => {
              onDelete(false);
              onClose();
            }}
            onDeleteForEveryone={() => {
              onDelete(true);
              onClose();
            }}
          />
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

function ActionButton({ icon: Icon, label, onClick, destructive }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left border-t border-border/30 first:border-t-0 ${
        destructive ? 'text-destructive' : ''
      }`}
    >
      <Icon className={`w-5 h-5 ${destructive ? '' : 'text-primary'}`} />
      <span className="font-medium">{label}</span>
    </button>
  );
}
