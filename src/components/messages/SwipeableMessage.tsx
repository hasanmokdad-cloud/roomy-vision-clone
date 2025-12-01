import { useRef } from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { Reply } from "lucide-react";

interface SwipeableMessageProps {
  children: React.ReactNode;
  onSwipeReply: () => void;
  disabled?: boolean;
}

export function SwipeableMessage({ 
  children, 
  onSwipeReply, 
  disabled = false 
}: SwipeableMessageProps) {
  const controls = useAnimation();
  const swipeThreshold = 80; // 80px swipe triggers reply

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Only trigger on right swipe (positive offset)
    if (info.offset.x > swipeThreshold && !disabled) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Trigger reply
      onSwipeReply();
    }
    
    // Snap back to original position
    await controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="relative touch-pan-y"
    >
      {/* Reply Icon - appears during swipe */}
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.5 }}
        whileTap={{ opacity: 1, scale: 1 }}
      >
        <Reply className="w-5 h-5 text-primary" />
      </motion.div>

      {children}
    </motion.div>
  );
}