import { ReactNode, useCallback, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { useIsMobile } from '@/hooks/use-mobile';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startScrollTop = useRef(0);
  const isPulling = useRef(false);

  // Transform values for visual feedback
  const indicatorY = useTransform(y, [0, PULL_THRESHOLD, MAX_PULL], [-40, 0, 20]);
  const indicatorOpacity = useTransform(y, [0, PULL_THRESHOLD / 2, PULL_THRESHOLD], [0, 0.5, 1]);
  const indicatorScale = useTransform(y, [0, PULL_THRESHOLD, MAX_PULL], [0.5, 1, 1.1]);
  const indicatorRotate = useTransform(y, [0, PULL_THRESHOLD], [0, 180]);

  const handleDragStart = useCallback(() => {
    // Only allow pull if at top of scroll
    if (containerRef.current) {
      startScrollTop.current = containerRef.current.scrollTop;
    }
    isPulling.current = startScrollTop.current <= 0;
    setHasTriggeredHaptic(false);
  }, []);

  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isPulling.current || isRefreshing || disabled) return;

    const pullDistance = Math.max(0, info.offset.y);
    y.set(Math.min(pullDistance, MAX_PULL));

    // Haptic feedback when threshold is reached
    if (pullDistance >= PULL_THRESHOLD && !hasTriggeredHaptic) {
      haptics.medium();
      setHasTriggeredHaptic(true);
    } else if (pullDistance < PULL_THRESHOLD && hasTriggeredHaptic) {
      setHasTriggeredHaptic(false);
    }
  }, [y, isRefreshing, disabled, hasTriggeredHaptic]);

  const handleDragEnd = useCallback(async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isPulling.current || isRefreshing || disabled) {
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 });
      return;
    }

    const pullDistance = info.offset.y;

    if (pullDistance >= PULL_THRESHOLD) {
      // Trigger refresh
      haptics.success();
      setIsRefreshing(true);
      
      // Animate to loading position
      animate(y, PULL_THRESHOLD / 2, { type: 'spring', stiffness: 400, damping: 30 });

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 });
      }
    } else {
      // Snap back
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  }, [y, onRefresh, isRefreshing, disabled]);

  // Don't apply on desktop
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Pull indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        style={{ y: indicatorY, opacity: indicatorOpacity, scale: indicatorScale }}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center border border-primary/20">
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <motion.svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
              style={{ rotate: indicatorRotate }}
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </motion.svg>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag={disabled || isRefreshing ? false : "y"}
        dragDirectionLock
        dragElastic={0.3}
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
