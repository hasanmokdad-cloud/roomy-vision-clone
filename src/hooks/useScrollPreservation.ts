import { useEffect, useRef, RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import { useScrollPosition } from '@/contexts/ScrollPositionContext';

/**
 * Hook to automatically save and restore scroll position for a page
 * @param containerRef - Optional ref to a scrollable container (uses window if not provided)
 */
export function useScrollPreservation(containerRef?: RefObject<HTMLElement>) {
  const location = useLocation();
  const { saveScrollPosition, getScrollPosition } = useScrollPosition();
  const isRestored = useRef(false);

  // Restore scroll position on mount
  useEffect(() => {
    const savedPosition = getScrollPosition(location.pathname);
    
    if (savedPosition > 0 && !isRestored.current) {
      isRestored.current = true;
      
      // Use requestAnimationFrame for smoother restoration
      requestAnimationFrame(() => {
        if (containerRef?.current) {
          containerRef.current.scrollTop = savedPosition;
        } else {
          window.scrollTo(0, savedPosition);
        }
      });
    }
  }, [location.pathname, getScrollPosition, containerRef]);

  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      const position = containerRef?.current?.scrollTop ?? window.scrollY;
      if (position > 0) {
        saveScrollPosition(location.pathname, position);
      }
    };
  }, [location.pathname, saveScrollPosition, containerRef]);

  // Reset restoration flag when pathname changes
  useEffect(() => {
    isRestored.current = false;
  }, [location.pathname]);
}
