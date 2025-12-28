import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReactionBarProps {
  onReactionSelect: (emoji: string) => void;
  onOpenFullPicker: () => void;
  selectedEmojis?: string[];
  isSender?: boolean;
  position?: 'top' | 'bottom';
}

const WHATSAPP_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "👏"];

export function ReactionBar({ 
  onReactionSelect, 
  onOpenFullPicker, 
  selectedEmojis = [], 
  isSender = false,
  position = 'top'
}: ReactionBarProps) {
  // Position classes based on whether reaction bar should appear above or below message
  const positionClasses = position === 'top' 
    ? `-top-14 ${isSender ? 'right-0' : 'left-0'}`
    : `-bottom-14 ${isSender ? 'right-0' : 'left-0'}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`absolute z-50 ${positionClasses}`}
    >
      <div className="bg-popover border border-border rounded-full shadow-lg px-2 py-2 flex items-center gap-1">
        {WHATSAPP_REACTIONS.map((emoji, index) => (
          <motion.div
            key={emoji}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: index * 0.03, 
              type: "spring",
              stiffness: 500,
              damping: 25
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-10 p-0 text-2xl hover:scale-125 active:scale-90 transition-transform ${
                selectedEmojis.includes(emoji) ? 'bg-accent' : ''
              }`}
              onClick={() => onReactionSelect(emoji)}
            >
              <motion.span
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
              >
                {emoji}
              </motion.span>
            </Button>
          </motion.div>
        ))}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: WHATSAPP_REACTIONS.length * 0.03 + 0.05 }}
        >
          <div className="w-px h-6 bg-border mx-1" />
        </motion.div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: WHATSAPP_REACTIONS.length * 0.03 + 0.08,
            type: "spring",
            stiffness: 500,
            damping: 25
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 hover:scale-110 active:scale-90 transition-transform"
            onClick={onOpenFullPicker}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
