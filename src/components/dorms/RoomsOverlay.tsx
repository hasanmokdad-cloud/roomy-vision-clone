import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { RoomFlipCard } from './RoomFlipCard';
import { SeedDorm } from '@/data/dorms.seed';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface RoomsOverlayProps {
  dorm: SeedDorm;
  isOpen: boolean;
  onClose: () => void;
  capacityFilter?: number;
}

export const RoomsOverlay: React.FC<RoomsOverlayProps> = ({
  dorm,
  isOpen,
  onClose,
  capacityFilter,
}) => {
  const navigate = useNavigate();

  // Keyboard support - ESC to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filteredRooms = capacityFilter
    ? dorm.rooms.filter((r) => r.capacity >= capacityFilter)
    : dorm.rooms;

  if (!filteredRooms.length) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-40"
            style={{ backdropFilter: 'blur(12px) brightness(0.8)' }}
            onClick={onClose}
          />

          {/* Overlay Container - Centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-5xl max-h-[85vh] z-50 overflow-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="overlay-title"
          >
            <div className="bg-white rounded-3xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.25)] relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="mb-8 pr-12">
                <h2 id="overlay-title" className="text-3xl font-black gradient-text mb-2">{dorm.name}</h2>
                <p className="text-foreground/70">{dorm.area}</p>
                {capacityFilter && (
                  <p className="text-sm text-primary mt-2">
                    Showing rooms for {capacityFilter}+ people
                  </p>
                )}
              </div>

              {/* Room Cards Grid */}
              <motion.div
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      delayChildren: 0.06,
                      staggerChildren: 0.06,
                    },
                  },
                }}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredRooms.map((room) => (
                  <motion.div
                    key={room.id}
                    variants={{
                      hidden: { opacity: 0, y: 12, rotateX: -8 },
                      show: { opacity: 1, y: 0, rotateX: 0 },
                    }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    <RoomFlipCard
                      room={room}
                      dormName={dorm.name}
                      onLearnMore={() => {
                        navigate(`/dorm/${dorm.id}?room=${room.id}`);
                      }}
                      onContact={() => {
                        // Open WhatsApp or contact modal
                        window.open(
                          `https://wa.me/96181858026?text=Hi, I'm interested in ${room.roomType} at ${dorm.name}`,
                          '_blank'
                        );
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
