import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { createPortal } from "react-dom";

interface ReactionBarProps {
  onReactionSelect: (emoji: string) => void;
  onOpenFullPicker: () => void;
  selectedEmojis?: string[];
  isSender?: boolean;
  position?: 'top' | 'bottom';
  buttonRect?: DOMRect | null;
}

const WHATSAPP_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function ReactionBar({ 
  onReactionSelect, 
  onOpenFullPicker, 
  selectedEmojis = [], 
  isSender = false,
  position = 'top',
  buttonRect
}: ReactionBarProps) {
  // If we have buttonRect, use fixed positioning relative to the emoji button
  if (buttonRect) {
    const barWidth = 300; // Approximate width of the reaction bar
    const barHeight = 48; // Height of the reaction bar
    const gap = 8; // Gap between button and bar
    
    // Get the chat container's top boundary to ensure bar stays within chat area
    const chatContainer = document.querySelector('.whatsapp-scrollbar');
    const chatAreaTop = chatContainer?.getBoundingClientRect().top ?? 0;
    
    // Calculate horizontal position - center on button, but keep on screen
    let left = buttonRect.left + buttonRect.width / 2 - barWidth / 2;
    // Keep bar within viewport horizontally
    left = Math.max(10, Math.min(left, window.innerWidth - barWidth - 10));
    
    // Calculate vertical position based on space
    let top = position === 'top' 
      ? buttonRect.top - barHeight - gap
      : buttonRect.bottom + gap;
    
    // SAFETY: If top position would be above chat area, force bottom position
    if (position === 'top' && top < chatAreaTop) {
      top = buttonRect.bottom + gap;
    }

    const barContent = (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{
          position: 'fixed',
          top,
          left,
          zIndex: 9999,
        }}
      >
        <div className="bg-white dark:bg-[#233138] rounded-full shadow-lg px-1.5 py-1.5 flex items-center gap-0.5">
          {WHATSAPP_REACTIONS.map((emoji, index) => (
            <motion.div
              key={emoji}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                delay: index * 0.02, 
                type: "spring",
                stiffness: 600,
                damping: 25
              }}
            >
              <button
                className={`h-9 w-9 flex items-center justify-center text-[22px] hover:scale-125 active:scale-90 transition-transform rounded-full ${
                  selectedEmojis.includes(emoji) ? 'bg-[#e7e7e7] dark:bg-[#374248]' : 'hover:bg-[#f0f2f5] dark:hover:bg-[#374248]'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onReactionSelect(emoji);
                }}
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
          {/* Plus button */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: WHATSAPP_REACTIONS.length * 0.02 + 0.03,
              type: "spring",
              stiffness: 600,
              damping: 25
            }}
          >
            <button
              className="h-9 w-9 rounded-full bg-[#e7e7e7] dark:bg-[#374248] flex items-center justify-center hover:scale-110 active:scale-90 transition-transform ml-0.5"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onOpenFullPicker();
              }}
            >
              <Plus className="h-5 w-5 text-[#8696a0]" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    );

    // Render as portal to body for proper fixed positioning
    return createPortal(barContent, document.body);
  }

  // Fallback: relative positioning (legacy behavior)
  const positionClasses = position === 'top' 
    ? `-top-14 ${isSender ? 'right-0' : 'left-0'}`
    : `-bottom-14 ${isSender ? 'right-0' : 'left-0'}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`absolute z-50 ${positionClasses}`}
    >
      <div className="bg-white dark:bg-[#233138] rounded-full shadow-lg px-1.5 py-1.5 flex items-center gap-0.5">
        {WHATSAPP_REACTIONS.map((emoji, index) => (
          <motion.div
            key={emoji}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: index * 0.02, 
              type: "spring",
              stiffness: 600,
              damping: 25
            }}
          >
            <button
              className={`h-9 w-9 flex items-center justify-center text-[22px] hover:scale-125 active:scale-90 transition-transform rounded-full ${
                selectedEmojis.includes(emoji) ? 'bg-[#e7e7e7] dark:bg-[#374248]' : 'hover:bg-[#f0f2f5] dark:hover:bg-[#374248]'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onReactionSelect(emoji);
              }}
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
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: WHATSAPP_REACTIONS.length * 0.02 + 0.03,
            type: "spring",
            stiffness: 600,
            damping: 25
          }}
        >
          <button
            className="h-9 w-9 rounded-full bg-[#e7e7e7] dark:bg-[#374248] flex items-center justify-center hover:scale-110 active:scale-90 transition-transform ml-0.5"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onOpenFullPicker();
            }}
          >
            <Plus className="h-5 w-5 text-[#8696a0]" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
