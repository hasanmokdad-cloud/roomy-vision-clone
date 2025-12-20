import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface AnimatedReactionProps {
  emoji: string;
  count: number;
  userReacted: boolean;
  onClick: () => void;
  onLongPress?: () => void;
  isNew?: boolean;
}

export function AnimatedReaction({
  emoji,
  count,
  userReacted,
  onClick,
  onLongPress,
  isNew = false,
}: AnimatedReactionProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.button
      initial={isNew ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
      animate={{ 
        scale: isPressed ? 0.9 : 1, 
        opacity: 1,
      }}
      whileTap={{ scale: 0.85 }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 25,
        duration: 0.2
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => {
        setIsPressed(true);
        if (onLongPress) {
          const timer = setTimeout(onLongPress, 500);
          const handleTouchEnd = () => {
            clearTimeout(timer);
            setIsPressed(false);
          };
          document.addEventListener('touchend', handleTouchEnd, { once: true });
        }
      }}
      onTouchEnd={() => setIsPressed(false)}
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
        userReacted
          ? "bg-primary/20 border border-primary"
          : "bg-muted border border-border hover:bg-muted/80"
      }`}
    >
      <motion.span
        key={`${emoji}-${count}`}
        initial={isNew ? { scale: 1.5 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {emoji}
      </motion.span>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="font-medium"
        >
          {count}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
