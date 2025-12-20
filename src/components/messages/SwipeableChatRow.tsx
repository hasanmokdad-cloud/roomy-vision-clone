import { useRef, useState } from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { Archive, ArchiveRestore, Pin, PinOff, MoreHorizontal, Mail } from "lucide-react";

interface SwipeableChatRowProps {
  children: React.ReactNode;
  conversationId: string;
  isPinned: boolean;
  isArchived: boolean;
  hasUnread: boolean;
  onPin: () => Promise<void>;
  onArchive: () => Promise<void>;
  onMore: () => void;
  onMarkRead?: () => Promise<void>;
}

export function SwipeableChatRow({
  children,
  conversationId,
  isPinned,
  isArchived,
  hasUnread,
  onPin,
  onArchive,
  onMore,
  onMarkRead,
}: SwipeableChatRowProps) {
  const controls = useAnimation();
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);
  const swipeThreshold = 80;
  const actionWidth = 160; // Width for action buttons (2 buttons × 80px each)
  const pinActionWidth = 80; // Width for pin button

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    
    // Right swipe (reveal left actions: More + Archive/Unarchive)
    if (offset.x > swipeThreshold || velocity.x > 500) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
      await controls.start({ 
        x: actionWidth, 
        transition: { type: "spring", stiffness: 300, damping: 30 } 
      });
      setIsRevealed('left');
      return;
    }
    
    // Left swipe (reveal right action: Pin)
    if (offset.x < -swipeThreshold || velocity.x < -500) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
      await controls.start({ 
        x: -pinActionWidth, 
        transition: { type: "spring", stiffness: 300, damping: 30 } 
      });
      setIsRevealed('right');
      return;
    }
    
    // Snap back
    await controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
    setIsRevealed(null);
  };

  const handleAction = async (action: () => Promise<void> | void) => {
    await action();
    // Snap back after action
    await controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
    setIsRevealed(null);
  };

  const resetPosition = async () => {
    await controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
    setIsRevealed(null);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left action buttons (revealed on right swipe) */}
      <div className="absolute left-0 inset-y-0 flex items-stretch">
        {/* More button */}
        <button
          onClick={() => handleAction(onMore)}
          className="w-20 flex flex-col items-center justify-center gap-1 bg-muted-foreground/80 text-white"
        >
          <MoreHorizontal className="w-6 h-6" />
          <span className="text-xs font-medium">More</span>
        </button>
        
        {/* Archive/Unarchive OR Unread/Unpin based on state */}
        {isPinned ? (
          <>
            {hasUnread && onMarkRead ? (
              <button
                onClick={() => handleAction(onMarkRead)}
                className="w-20 flex flex-col items-center justify-center gap-1 bg-blue-500 text-white"
              >
                <Mail className="w-6 h-6" />
                <span className="text-xs font-medium">Read</span>
              </button>
            ) : (
              <button
                onClick={() => handleAction(onPin)}
                className="w-20 flex flex-col items-center justify-center gap-1 bg-amber-500 text-white"
              >
                <PinOff className="w-6 h-6" />
                <span className="text-xs font-medium">Unpin</span>
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => handleAction(onArchive)}
            className="w-20 flex flex-col items-center justify-center gap-1 bg-emerald-500 text-white"
          >
            {isArchived ? (
              <>
                <ArchiveRestore className="w-6 h-6" />
                <span className="text-xs font-medium">Unarchive</span>
              </>
            ) : (
              <>
                <Archive className="w-6 h-6" />
                <span className="text-xs font-medium">Archive</span>
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Right action button (revealed on left swipe) */}
      <div className="absolute right-0 inset-y-0 flex items-stretch">
        <button
          onClick={() => handleAction(onPin)}
          className="w-20 flex flex-col items-center justify-center gap-1 bg-amber-500 text-white"
        >
          {isPinned ? (
            <>
              <PinOff className="w-6 h-6" />
              <span className="text-xs font-medium">Unpin</span>
            </>
          ) : (
            <>
              <Pin className="w-6 h-6" />
              <span className="text-xs font-medium">Pin</span>
            </>
          )}
        </button>
      </div>
      
      {/* Main content (slides) */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -pinActionWidth, right: actionWidth }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative bg-background touch-pan-y"
        onClick={() => {
          // If revealed, reset on tap instead of navigating
          if (isRevealed) {
            resetPosition();
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
