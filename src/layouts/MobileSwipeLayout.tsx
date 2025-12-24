import { ReactNode, useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, PanInfo, useMotionValue, animate } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { haptics } from '@/utils/haptics';

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
  const hasTriggeredHaptic = useRef(false);
  const [dragDisabled, setDragDisabled] = useState(false);

  // Get pages based on role
  const getPages = () => {
    if (role === 'owner') return ownerPages;
    if (role === 'admin') return adminPages;
    return studentPages;
  };

  const pages = getPages();

  // Check if drag should be disabled (chat open or recording)
  const checkDragDisabled = useCallback(() => {
    return document.body.hasAttribute('data-chat-open') || 
           document.body.hasAttribute('data-recording');
  }, []);

  // Update drag disabled state on mount and when relevant
  useEffect(() => {
    const checkAndUpdate = () => setDragDisabled(checkDragDisabled());
    checkAndUpdate();
    
    // Use MutationObserver to watch for attribute changes on body
    const observer = new MutationObserver(checkAndUpdate);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-chat-open', 'data-recording'] });
    
    return () => observer.disconnect();
  }, [checkDragDisabled]);

  const getCurrentIndex = () => {
    // Only allow swipe on exact main page matches (not subpages)
    return pages.findIndex((page) => location.pathname === page);
  };

  const currentIndex = getCurrentIndex();

  const handleSwipe = useCallback((offsetX: number, velocity: number) => {
    // Double-check at swipe time
    if (checkDragDisabled()) {
      return;
    }
    
    const swipeThreshold = 50;
    const velocityThreshold = 300;

    if (currentIndex === -1) return;

    // Swipe left to go to next page (higher index)
    if ((offsetX < -swipeThreshold || velocity < -velocityThreshold) && currentIndex < pages.length - 1) {
      haptics.pageChange();
      navigate(pages[currentIndex + 1]);
    }
    // Swipe right to go to previous page (lower index)
    else if ((offsetX > swipeThreshold || velocity > velocityThreshold) && currentIndex > 0) {
      haptics.pageChange();
      navigate(pages[currentIndex - 1]);
    }
  }, [currentIndex, navigate, pages, checkDragDisabled]);

  // Reset position on route change - instant, no animation
  useEffect(() => {
    x.set(0);
    hasTriggeredHaptic.current = false;
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
        drag={dragDisabled ? false : "x"}
        dragDirectionLock
        dragElastic={0.05}
        dragConstraints={{ 
          left: canSwipeLeft ? -50 : 0, 
          right: canSwipeRight ? 50 : 0 
        }}
        onDragStart={(_, info) => {
          isDragging.current = true;
          startX.current = info.point.x;
          hasTriggeredHaptic.current = false;
          document.body.style.overflow = 'hidden';
        }}
        onDrag={(_, info: PanInfo) => {
          const offsetX = info.offset.x;
          const atLeftBoundary = currentIndex === 0 && offsetX > 30;
          const atRightBoundary = currentIndex === pages.length - 1 && offsetX < -30;
          
          // Haptic feedback when threshold is reached
          if (Math.abs(offsetX) > 50 && !hasTriggeredHaptic.current) {
            if (atLeftBoundary || atRightBoundary) {
              haptics.boundary();
            } else {
              haptics.swipeReady();
            }
            hasTriggeredHaptic.current = true;
          }
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
