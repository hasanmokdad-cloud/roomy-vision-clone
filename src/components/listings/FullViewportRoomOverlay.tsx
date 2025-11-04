import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { RoomExpansion3D } from './RoomExpansion3D';

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
  const roomTypes: RoomType[] = dorm.room_types_json || [];

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
          className="fixed inset-0 z-[80] bg-black/35 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
          data-room-overlay
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full ${
              isMobile 
                ? 'h-full rounded-none' 
                : 'max-w-[1400px] max-h-[90vh] rounded-2xl'
            } bg-background/95 shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-4 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl md:text-3xl font-black gradient-text mb-2 truncate">
                    {dorm.dorm_name}
                  </h2>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>{dorm.area}</span>
                    {dorm.university && (
                      <>
                        <span>•</span>
                        <span>Near {dorm.university}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{roomTypes.length} room type{roomTypes.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="shrink-0 hover:bg-destructive/10"
                  aria-label="Close room selection"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Room Cards Container */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] md:max-h-[calc(90vh-140px)]">
              <RoomExpansion3D
                rooms={roomTypes}
                dormId={dorm.id}
                isExpanded={true}
                isFullViewport={true}
                dormAddress={dorm.address}
                dormShuttle={dorm.shuttle}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
