import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface ReactionBarProps {
  onReactionSelect: (emoji: string) => void;
  onOpenFullPicker: () => void;
  selectedEmojis?: string[];
  isSender?: boolean;
  position?: 'top' | 'bottom';
}

const WHATSAPP_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

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
      <div className="bg-white dark:bg-[#233138] rounded-full shadow-lg px-1.5 py-1.5 flex items-center gap-0.5">
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
            <button
              className={`h-9 w-9 flex items-center justify-center text-[22px] hover:scale-125 active:scale-90 transition-transform rounded-full ${
                selectedEmojis.includes(emoji) ? 'bg-[#e7e7e7] dark:bg-[#374248]' : 'hover:bg-[#f0f2f5] dark:hover:bg-[#374248]'
              }`}
              onClick={() => onReactionSelect(emoji)}
            >
              <motion.span
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
              >
                {emoji}
              </motion.span>
            </button>
          </motion.div>
        ))}
        {/* Plus button - WhatsApp style with round background, no separator */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: WHATSAPP_REACTIONS.length * 0.03 + 0.05,
            type: "spring",
            stiffness: 500,
            damping: 25
          }}
        >
          <button
            className="h-9 w-9 rounded-full bg-[#e7e7e7] dark:bg-[#374248] flex items-center justify-center hover:scale-110 active:scale-90 transition-transform ml-0.5"
            onClick={onOpenFullPicker}
          >
            <Plus className="h-5 w-5 text-[#8696a0]" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
