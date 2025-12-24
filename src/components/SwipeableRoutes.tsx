import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, PanInfo, useMotionValue, useTransform, animate } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface SwipeableRoutesProps {
  children: React.ReactNode;
}

export function SwipeableRoutes({ children }: SwipeableRoutesProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Define the swipeable tabs in order
  const tabs = [
    '/dashboard',
    '/messages',
    '/listings',
    '/ai-match',
    '/profile',
  ];

  // Get current tab index - only match EXACT main tab routes, not subpages
  const getCurrentTabIndex = () => {
    const currentPath = location.pathname;
    const index = tabs.findIndex(path => currentPath === path);
    return index >= 0 ? index : -1;
  };

  const currentIndex = getCurrentTabIndex();

  // Handle drag end
  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // Determine if swipe was significant enough
    const swipeThreshold = 50;
    const velocityThreshold = 500;
    
    if (currentIndex === -1) return;

    if (offset > swipeThreshold || velocity > velocityThreshold) {
      // Swipe right - go to previous tab
      if (currentIndex > 0) {
        navigate(tabs[currentIndex - 1]);
      }
    } else if (offset < -swipeThreshold || velocity < -velocityThreshold) {
      // Swipe left - go to next tab
      if (currentIndex < tabs.length - 1) {
        navigate(tabs[currentIndex + 1]);
      }
    }

    // Animate back to center
    animate(x, 0, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    });
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Reset position when route changes
  useEffect(() => {
    x.set(0);
  }, [location.pathname, x]);

  // Don't apply swipe on non-mobile or non-swipeable pages
  if (!isMobile || currentIndex === -1) {
    return <>{children}</>;
  }

  // Calculate opacity for prev/next tab hints
  const opacity = useTransform(x, [-200, 0, 200], [0.3, 0, 0.3]);

  return (
    <div className="relative overflow-hidden">
      {/* Previous tab hint */}
      {currentIndex > 0 && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none z-10"
          style={{ opacity: useTransform(x, [0, 100], [0, 0.5]) }}
        />
      )}

      {/* Next tab hint */}
      {currentIndex < tabs.length - 1 && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none z-10"
          style={{ opacity: useTransform(x, [-100, 0], [0.5, 0]) }}
        />
      )}

      {/* Swipeable content */}
      <motion.div
        drag={isDragging || currentIndex >= 0 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      >
        {children}
      </motion.div>
    </div>
  );
}
