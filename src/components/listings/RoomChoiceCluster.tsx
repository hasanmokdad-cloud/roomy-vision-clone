import { motion, AnimatePresence } from 'framer-motion';
import RoomCard from './RoomCard';
import { X } from 'lucide-react';

interface RoomType {
  type: string;
  capacity: number;
  price: number;
  amenities: string[];
  images?: string[];
}

interface RoomChoiceClusterProps {
  rooms: RoomType[];
  dormName: string;
  dormArea?: string;
  university?: string;
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: (roomType: string) => void;
  isMobile?: boolean;
}

export default function RoomChoiceCluster({ 
  rooms, 
  dormName, 
  dormArea, 
  university, 
  isOpen, 
  onClose,
  onViewDetails,
  isMobile = false
}: RoomChoiceClusterProps) {
  
  if (!isOpen) return null;

  const content = (
    <div className={`${isMobile ? 'p-4' : ''} relative`}>
      {isMobile && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-50 glass-hover rounded-full p-2"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold">{dormName}</h3>
        <p className="text-sm text-foreground/60">Choose a room type</p>
      </div>

      <div className={`grid gap-4 ${rooms.length === 1 ? 'grid-cols-1' : rooms.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {rooms.map((room, idx) => (
          <RoomCard
            key={`${room.type}-${idx}`}
            room={room}
            dormName={dormName}
            dormArea={dormArea}
            university={university}
            onViewDetails={() => onViewDetails(room.type)}
            index={idx}
          />
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Modal content */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto glass-hover rounded-t-3xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Desktop: 3D arc expansion
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
        style={{ transform: 'translateZ(50px)' }}
      >
        <div className="pointer-events-auto max-w-4xl">
          {content}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
