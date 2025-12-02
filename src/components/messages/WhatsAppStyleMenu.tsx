import { motion, AnimatePresence } from "framer-motion";
import { Reply, Forward, Copy, Star, Trash2, MoreHorizontal, StarOff } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  body: string | null;
  created_at: string;
  sender_id: string;
  is_starred?: boolean;
  attachment_url?: string | null;
  attachment_type?: string | null;
}

interface WhatsAppStyleMenuProps {
  message: Message;
  isSender: boolean;
  onClose: () => void;
  onReply: () => void;
  onForward: () => void;
  onCopy: () => void;
  onStar: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
}

const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏'];

export const WhatsAppStyleMenu = ({
  message,
  isSender,
  onClose,
  onReply,
  onForward,
  onCopy,
  onStar,
  onDelete,
  onReact,
}: WhatsAppStyleMenuProps) => {
  const handleReact = (emoji: string) => {
    onReact(emoji);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Message Preview */}
            <div className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  isSender
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-card-foreground'
                }`}
              >
                {message.attachment_type === 'image' && message.attachment_url && (
                  <img
                    src={message.attachment_url}
                    alt="attachment"
                    className="w-full rounded-lg mb-2"
                  />
                )}
                {message.body && <p className="text-sm">{message.body}</p>}
                <p className="text-xs opacity-70 mt-1">
                  {format(new Date(message.created_at), 'HH:mm')}
                </p>
              </div>
            </div>

            {/* Reaction Bar */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-card/95 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-border/50"
            >
              <div className="flex items-center justify-around gap-2">
                {DEFAULT_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className="text-3xl hover:scale-125 transition-transform active:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  onClick={() => {
                    // TODO: Open emoji picker
                    onClose();
                  }}
                  className="text-2xl text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MoreHorizontal className="w-6 h-6" />
                </button>
              </div>
            </motion.div>

            {/* Action Menu */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-card/95 backdrop-blur-lg rounded-2xl overflow-hidden shadow-xl border border-border/50"
            >
              <button
                onClick={() => {
                  onReply();
                  onClose();
                }}
                className="w-full px-4 py-4 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
              >
                <Reply className="w-5 h-5 text-primary" />
                <span className="font-medium">Reply</span>
              </button>

              <button
                onClick={() => {
                  onForward();
                  onClose();
                }}
                className="w-full px-4 py-4 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left border-t border-border/30"
              >
                <Forward className="w-5 h-5 text-primary" />
                <span className="font-medium">Forward</span>
              </button>

              <button
                onClick={() => {
                  onCopy();
                  onClose();
                }}
                className="w-full px-4 py-4 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left border-t border-border/30"
              >
                <Copy className="w-5 h-5 text-primary" />
                <span className="font-medium">Copy</span>
              </button>

              <button
                onClick={() => {
                  onStar();
                  onClose();
                }}
                className="w-full px-4 py-4 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left border-t border-border/30"
              >
                {message.is_starred ? (
                  <>
                    <StarOff className="w-5 h-5 text-primary" />
                    <span className="font-medium">Unstar</span>
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5 text-primary" />
                    <span className="font-medium">Star</span>
                  </>
                )}
              </button>

              {isSender && (
                <button
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                  className="w-full px-4 py-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-left border-t border-border/30"
                >
                  <Trash2 className="w-5 h-5 text-destructive" />
                  <span className="font-medium text-destructive">Delete</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
