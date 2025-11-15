import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, PanInfo, useMotionValue, animate } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileSwipeLayoutProps {
  children: ReactNode;
}

const mobilePages = ['/dashboard', '/messages', '/listings', '/ai-match', '/profile'];

export function MobileSwipeLayout({ children }: MobileSwipeLayoutProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const x = useMotionValue(0);

  const currentIndex = mobilePages.findIndex(
    (page) => location.pathname === page || location.pathname.startsWith(page)
  );

  const handleSwipe = (offsetX: number, velocity: number) => {
    const swipeThreshold = 80;
    const velocityThreshold = 500;

    if (currentIndex === -1) return;

    // Swipe left to go to next page
    if ((offsetX < -swipeThreshold || velocity < -velocityThreshold) && currentIndex < mobilePages.length - 1) {
      navigate(mobilePages[currentIndex + 1]);
    }
    // Swipe right to go to previous page
    else if ((offsetX > swipeThreshold || velocity > velocityThreshold) && currentIndex > 0) {
      navigate(mobilePages[currentIndex - 1]);
    }
  };

  // Reset position on route change
  useEffect(() => {
    animate(x, 0, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    });
  }, [location.pathname, x]);

  // Don't apply swipe layout on desktop or non-swipeable pages
  if (!isMobile || currentIndex === -1) {
    return <>{children}</>;
  }

  return (
    <motion.div
      drag="x"
      dragDirectionLock
      dragElastic={0.08}
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={() => {
        document.body.style.overflow = 'hidden';
      }}
      onDragEnd={(e: any, info: PanInfo) => {
        document.body.style.overflow = 'auto';
        handleSwipe(info.offset.x, info.velocity.x);
        animate(x, 0, {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        });
      }}
      style={{ x }}
      className="overflow-hidden touch-pan-y min-h-screen"
    >
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
