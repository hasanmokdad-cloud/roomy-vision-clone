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
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { haptics } from "@/utils/haptics";

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

// WhatsApp-style smart positioning - ensure everything fits within viewport
const calculateSmartPosition = (messageRect: DOMRect, isSender: boolean) => {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  const REACTION_BAR_HEIGHT = 56;
  const MENU_MAX_HEIGHT = 280; // Reduced menu height
  const SAFE_MARGIN = 16;
  const TOP_MARGIN = 60; // Safe area from top
  const BOTTOM_MARGIN = 40; // Safe area from bottom
  
  // Calculate space available
  const spaceBelow = viewportHeight - messageRect.bottom - BOTTOM_MARGIN;
  const spaceAbove = messageRect.top - TOP_MARGIN;
  
  let shiftY = 0;
  
  // Calculate total space needed
  const totalNeeded = REACTION_BAR_HEIGHT + messageRect.height + MENU_MAX_HEIGHT + SAFE_MARGIN * 2;
  
  // If message is too close to bottom, shift up so menu fits
  if (spaceBelow < MENU_MAX_HEIGHT + SAFE_MARGIN) {
    const neededShift = (MENU_MAX_HEIGHT + SAFE_MARGIN) - spaceBelow;
    // But don't shift so much that reactions go off top
    const maxShift = spaceAbove - REACTION_BAR_HEIGHT - SAFE_MARGIN;
    shiftY = Math.min(neededShift, Math.max(0, maxShift));
  }
  
  // Ensure reactions bar doesn't go above safe top margin
  let adjustedTop = messageRect.top - shiftY;
  if (adjustedTop - REACTION_BAR_HEIGHT < TOP_MARGIN) {
    adjustedTop = TOP_MARGIN + REACTION_BAR_HEIGHT + SAFE_MARGIN;
  }
  
  // Ensure we don't go too low either
  const maxTop = viewportHeight - MENU_MAX_HEIGHT - messageRect.height - BOTTOM_MARGIN - SAFE_MARGIN;
  adjustedTop = Math.min(adjustedTop, Math.max(TOP_MARGIN + REACTION_BAR_HEIGHT, maxTop));
  
  // Horizontal positioning with proper bounds
  const messageWidth = Math.min(messageRect.width, viewportWidth - 32);
  const messageLeft = isSender ? undefined : Math.max(16, messageRect.left);
  const messageRight = isSender ? Math.max(16, viewportWidth - messageRect.right) : undefined;
  
  return {
    top: adjustedTop,
    left: messageLeft,
    right: messageRight,
    width: messageWidth,
    shiftY,
  };
};

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
  const prefersReducedMotion = useReducedMotion();

  if (!open || !messageRect) return null;

  const handleAction = (action: () => void) => {
    haptics.selection();
    action();
    onClose();
  };

  const handleReact = (emoji: string) => {
    haptics.light();
    onReact(emoji);
    onClose();
  };

  // Calculate smart position with WhatsApp-style shifting
  const position = calculateSmartPosition(messageRect, isSender);
  const viewportWidth = window.innerWidth;

  // Animation variants with reduced motion support
  const fadeVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const scaleVariants = {
    initial: { scale: prefersReducedMotion ? 1 : 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: prefersReducedMotion ? 1 : 0.95, opacity: 0 },
  };

  const slideDownVariants = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
  };

  const slideUpVariants = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : -10 },
  };

  const transitionFast = prefersReducedMotion ? { duration: 0.1 } : { duration: 0.2 };
  const transitionDelayed = prefersReducedMotion ? { duration: 0.1 } : { delay: 0.1, duration: 0.2 };

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Blur backdrop - with proper touch handling for mobile */}
          <motion.div
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitionFast}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            style={{ pointerEvents: 'auto', touchAction: 'none' }}
          />

          {/* Message clone with smart positioning */}
          <motion.div
            variants={scaleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed z-[101]"
            style={{
              top: position.top,
              left: position.left,
              right: position.right,
              width: position.width,
              maxWidth: 'calc(100vw - 16px)',
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Reaction bar - ABOVE message */}
            <motion.div
              variants={slideDownVariants}
              initial="initial"
              animate="animate"
              transition={transitionDelayed}
              className={`flex items-center gap-1 mb-2 ${isSender ? 'justify-end' : 'justify-start'}`}
            >
              <div className="bg-card/95 backdrop-blur-lg rounded-full px-2 py-1.5 flex items-center gap-0.5 shadow-lg border border-border/50">
                {QUICK_REACTIONS.map((emoji, index) => (
                  <motion.button
                    key={emoji}
                    initial={prefersReducedMotion ? {} : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.1 + index * 0.03, type: "spring", stiffness: 400 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReact(emoji);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleReact(emoji);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-xl hover:scale-125 active:scale-95 transition-transform"
                    style={{ touchAction: 'manipulation', pointerEvents: 'auto' }}
                    whileHover={prefersReducedMotion ? {} : { scale: 1.2 }}
                    whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
                  >
                    {emoji}
                  </motion.button>
                ))}
                <div className="w-px h-5 bg-border mx-0.5" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    haptics.light();
                    onOpenEmojiPicker();
                    onClose();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    haptics.light();
                    onOpenEmojiPicker();
                    onClose();
                  }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-accent rounded-full transition-colors"
                  style={{ touchAction: 'manipulation', pointerEvents: 'auto' }}
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </motion.div>

            {/* Message preview bubble */}
            <div
              className={`rounded-2xl px-4 py-3 shadow-lg max-h-48 overflow-y-auto ${
                isSender
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-card text-card-foreground"
              }`}
              style={{ maxWidth: position.width }}
            >
              {message.attachment_type === "image" && message.attachment_url && (
                <img
                  src={message.attachment_url}
                  alt="attachment"
                  className="w-full rounded-lg mb-2 max-h-32 object-cover"
                />
              )}
              {message.body && (
                <p className="text-sm whitespace-pre-wrap line-clamp-6">{message.body}</p>
              )}
              <p className="text-xs opacity-70 mt-1">
                {format(new Date(message.created_at), "HH:mm")}
              </p>
            </div>

            {/* Action menu - BELOW message */}
            <motion.div
              variants={slideUpVariants}
              initial="initial"
              animate="animate"
              transition={prefersReducedMotion ? { duration: 0.1 } : { delay: 0.15, duration: 0.2 }}
              className={`mt-2 ${isSender ? 'ml-auto' : ''}`}
              style={{ width: 'fit-content', minWidth: '180px', maxWidth: 'calc(100vw - 32px)' }}
            >
              <div className="bg-card/95 backdrop-blur-lg rounded-2xl overflow-hidden shadow-lg border border-border/50 max-h-[260px] overflow-y-auto">
                <ActionButton icon={Reply} label="Reply" onClick={() => handleAction(onReply)} index={0} reduced={prefersReducedMotion} />
                <ActionButton icon={Forward} label="Forward" onClick={() => handleAction(onForward)} index={1} reduced={prefersReducedMotion} />
                {message.body && (
                  <ActionButton icon={Copy} label="Copy" onClick={() => handleAction(onCopy)} index={2} reduced={prefersReducedMotion} />
                )}
                {isSender && canEdit && (
                  <ActionButton icon={Edit3} label="Edit" onClick={() => handleAction(onEdit!)} index={3} reduced={prefersReducedMotion} />
                )}
                {isSender && (
                  <ActionButton icon={Info} label="Info" onClick={() => handleAction(onInfo)} index={4} reduced={prefersReducedMotion} />
                )}
                <ActionButton 
                  icon={message.is_starred ? StarOff : Star} 
                  label={message.is_starred ? "Unstar" : "Star"} 
                  onClick={() => handleAction(onStar)}
                  index={5}
                  reduced={prefersReducedMotion}
                />
                <ActionButton 
                  icon={Pin} 
                  label={message.is_pinned ? "Unpin" : "Pin"} 
                  onClick={() => handleAction(onPin)}
                  index={6}
                  reduced={prefersReducedMotion}
                />
                {/* Translate button hidden for now - will implement later */}
                {/* <ActionButton icon={Languages} label="Translate" onClick={() => handleAction(onTranslate)} index={7} reduced={prefersReducedMotion} /> */}
                <ActionButton 
                  icon={Trash2} 
                  label="Delete" 
                  onClick={() => {
                    haptics.warning();
                    setShowDeleteDrawer(true);
                  }} 
                  destructive
                  index={7}
                  reduced={prefersReducedMotion}
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
              haptics.medium();
              onDelete(false);
              onClose();
            }}
            onDeleteForEveryone={() => {
              haptics.heavy();
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
  index?: number;
  reduced?: boolean;
}

function ActionButton({ icon: Icon, label, onClick, destructive, index = 0, reduced }: ActionButtonProps) {
  return (
    <motion.button
      initial={reduced ? {} : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={reduced ? { duration: 0 } : { delay: 0.2 + index * 0.02, duration: 0.15 }}
      onClick={onClick}
      className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent/50 active:bg-accent transition-colors text-left border-t border-border/30 first:border-t-0 touch-manipulation ${
        destructive ? 'text-destructive' : ''
      }`}
      whileTap={reduced ? {} : { scale: 0.98 }}
    >
      <Icon className={`w-5 h-5 ${destructive ? '' : 'text-primary'}`} />
      <span className="font-medium text-sm">{label}</span>
    </motion.button>
  );
}
