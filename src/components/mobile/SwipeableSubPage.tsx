import { ReactNode, useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, animate } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface SwipeableSubPageProps {
  children: ReactNode;
  onBack?: () => void;
  enabled?: boolean;
}

export function SwipeableSubPage({ children, onBack, enabled = true }: SwipeableSubPageProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // iOS-style parallax effect
  const backgroundX = useTransform(x, [0, 300], [-100, 0]);
  const shadowOpacity = useTransform(x, [0, 300], [0, 0.3]);
  const scale = useTransform(x, [0, 300], [1, 0.95]);
  
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 100;
      const velocity = info.velocity.x;
      
      // Navigate back if swiped far enough or fast enough from left edge
      if (info.offset.x > threshold || velocity > 800) {
        // Animate out before navigating
        animate(x, window.innerWidth, {
          type: 'spring',
          stiffness: 400,
          damping: 40,
          onComplete: () => {
            if (onBack) {
              onBack();
            } else {
              navigate(-1);
            }
          }
        });
      } else {
        // Snap back
        animate(x, 0, {
          type: 'spring',
          stiffness: 400,
          damping: 35,
        });
      }
    },
    [navigate, onBack, x]
  );

  // Only enable on mobile
  if (!isMobile || !enabled) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden min-h-screen bg-background">
      {/* Previous page hint (background) */}
      <motion.div
        className="fixed inset-0 bg-muted/50 pointer-events-none"
        style={{
          x: backgroundX,
          opacity: shadowOpacity,
        }}
      />
      
      {/* Shadow overlay on left edge */}
      <motion.div
        className="fixed inset-y-0 left-0 w-6 pointer-events-none z-40"
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.15), transparent)',
          opacity: shadowOpacity,
        }}
      />
      
      <motion.div
        drag="x"
        dragDirectionLock
        dragElastic={0.15}
        dragConstraints={{ left: 0, right: 0 }}
        dragSnapToOrigin={false}
        onDragEnd={handleDragEnd}
        style={{ x, scale }}
        className="min-h-screen bg-background touch-pan-y will-change-transform"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
