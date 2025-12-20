import { ReactNode, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, PanInfo, useMotionValue, animate } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

interface MobileSwipeLayoutProps {
  children: ReactNode;
}

// Student pages in correct order matching bottom nav
const studentPages = ['/wishlists', '/ai-match', '/listings', '/messages', '/profile'];
const ownerPages = ['/owner/wallet', '/owner/bookings', '/owner', '/messages', '/profile'];
const adminPages = ['/admin/wallet', '/admin/chats', '/admin', '/messages', '/profile'];

export function MobileSwipeLayout({ children }: MobileSwipeLayoutProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const x = useMotionValue(0);
  const isDragging = useRef(false);
  const startX = useRef(0);

  // Get pages based on role
  const getPages = () => {
    if (role === 'owner') return ownerPages;
    if (role === 'admin') return adminPages;
    return studentPages;
  };

  const pages = getPages();

  const getCurrentIndex = () => {
    return pages.findIndex(
      (page) => location.pathname === page || 
      (page !== '/' && location.pathname.startsWith(page) && !location.pathname.includes('/wallet'))
    );
  };

  const currentIndex = getCurrentIndex();

  const handleSwipe = useCallback((offsetX: number, velocity: number) => {
    const swipeThreshold = 50; // Reduced for quicker response
    const velocityThreshold = 300; // Lower velocity threshold

    if (currentIndex === -1) return;

    // Swipe left to go to next page (higher index)
    if ((offsetX < -swipeThreshold || velocity < -velocityThreshold) && currentIndex < pages.length - 1) {
      navigate(pages[currentIndex + 1]);
    }
    // Swipe right to go to previous page (lower index)
    else if ((offsetX > swipeThreshold || velocity > velocityThreshold) && currentIndex > 0) {
      navigate(pages[currentIndex - 1]);
    }
  }, [currentIndex, navigate, pages]);

  // Reset position on route change - instant, no animation
  useEffect(() => {
    x.set(0);
  }, [location.pathname, x]);

  // Don't apply swipe layout on desktop or non-swipeable pages
  if (!isMobile || currentIndex === -1) {
    return <>{children}</>;
  }

  const canSwipeLeft = currentIndex < pages.length - 1;
  const canSwipeRight = currentIndex > 0;

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Edge indicators */}
      {canSwipeRight && (
        <motion.div
          className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-primary/20 to-transparent z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isDragging.current ? 1 : 0 }}
        />
      )}
      {canSwipeLeft && (
        <motion.div
          className="fixed right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-primary/20 to-transparent z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isDragging.current ? 1 : 0 }}
        />
      )}

      <motion.div
        drag="x"
        dragDirectionLock
        dragElastic={0.05} // Very tight elastic for snappy feel
        dragConstraints={{ 
          left: canSwipeLeft ? -50 : 0, 
          right: canSwipeRight ? 50 : 0 
        }}
        onDragStart={(_, info) => {
          isDragging.current = true;
          startX.current = info.point.x;
          document.body.style.overflow = 'hidden';
        }}
        onDragEnd={(_, info: PanInfo) => {
          isDragging.current = false;
          document.body.style.overflow = '';
          handleSwipe(info.offset.x, info.velocity.x);
          // Instant reset
          animate(x, 0, {
            type: 'spring',
            stiffness: 500,
            damping: 40,
            duration: 0.15,
          });
        }}
        style={{ x }}
        className="min-h-screen touch-pan-y will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}
