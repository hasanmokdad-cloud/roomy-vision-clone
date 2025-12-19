import { ReactNode, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface SwipeBackWrapperProps {
  children: ReactNode;
  enabled?: boolean;
  onBack?: () => void;
}

export function SwipeBackWrapper({ children, enabled = true, onBack }: SwipeBackWrapperProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const x = useMotionValue(0);
  
  // Transform for the shadow overlay that appears on the left
  const shadowOpacity = useTransform(x, [0, 100], [0, 0.15]);
  
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 100;
      const velocity = info.velocity.x;
      
      // Navigate back if swiped far enough or fast enough
      if (info.offset.x > threshold || velocity > 500) {
        if (onBack) {
          onBack();
        } else {
          navigate(-1);
        }
      }
    },
    [navigate, onBack]
  );

  // Only enable on mobile
  if (!isMobile || !enabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Shadow overlay */}
      <motion.div
        className="fixed inset-y-0 left-0 w-8 pointer-events-none z-40"
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.3), transparent)',
          opacity: shadowOpacity,
        }}
      />
      
      <motion.div
        drag="x"
        dragDirectionLock
        dragElastic={0.2}
        dragConstraints={{ left: 0, right: 0 }}
        dragSnapToOrigin
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="min-h-screen touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
