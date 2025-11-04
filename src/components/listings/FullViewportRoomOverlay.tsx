import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { RoomExpansion3D } from './RoomExpansion3D';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface RoomType {
  type: string;
  capacity: number;
  price: number;
  amenities?: string[];
}

interface FullViewportRoomOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  dorm: {
    id: string;
    dorm_name: string;
    area: string;
    room_types_json?: any;
    university?: string;
    address?: string;
    shuttle?: boolean;
  };
}

export function FullViewportRoomOverlay({ isOpen, onClose, dorm }: FullViewportRoomOverlayProps) {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const roomTypes: RoomType[] = dorm.room_types_json || [];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Parallax scroll effect
  const { scrollYProgress } = useScroll({
    container: scrollContainerRef,
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      const focusableElements = document.querySelectorAll(
        '[data-room-overlay] button, [data-room-overlay] a, [data-room-overlay] [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      };

      window.addEventListener('keydown', handleTab);
      firstElement?.focus();

      return () => window.removeEventListener('keydown', handleTab);
    }
  }, [isOpen]);

  if (roomTypes.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-md"
          onClick={onClose}
          data-room-overlay
        >
          {/* Parallax Background Layer */}
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{ 
              y: prefersReducedMotion ? 0 : backgroundY,
              backgroundImage: 'radial-gradient(circle at 50% 50%, hsl(var(--primary)) 0%, transparent 70%)'
            }}
          />

          {/* Main Content Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.22, 1, 0.36, 1]
            }}
            className="absolute inset-0 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cinematic Header */}
            <motion.div 
              className="relative z-10 bg-background/95 backdrop-blur-xl border-b border-border/50"
              style={{ opacity: prefersReducedMotion ? 1 : headerOpacity }}
            >
              <div className="container mx-auto px-6 py-8">
                <div className="flex items-start justify-between gap-4">
                  <motion.div 
                    className="flex-1 min-w-0"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <h2 className="text-3xl md:text-5xl font-black gradient-text mb-3">
                      {dorm.dorm_name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-base text-muted-foreground">
                      <span className="font-semibold">{dorm.area}</span>
                      {dorm.university && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                          <span>Near {dorm.university}</span>
                        </>
                      )}
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                      <span className="font-medium gradient-text">
                        {roomTypes.length} room type{roomTypes.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </motion.div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="shrink-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all"
                    aria-label="Close room selection"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Scrollable Room Container */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: 'hsl(var(--primary) / 0.3) transparent'
              }}
            >
              <div className="container mx-auto px-6 py-12">
                <RoomExpansion3D
                  rooms={roomTypes}
                  dormId={dorm.id}
                  isExpanded={true}
                  isFullViewport={true}
                  dormAddress={dorm.address}
                  dormShuttle={dorm.shuttle}
                />
              </div>

              {/* Scroll Indicator */}
              <motion.div
                className="flex flex-col items-center gap-2 pb-8 opacity-50"
                animate={{ y: [0, 8, 0] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: "easeInOut"
                }}
              >
                <span className="text-xs text-muted-foreground">Scroll to explore</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
