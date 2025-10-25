import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Users, Tag, MapPin } from 'lucide-react';
import AmenityIcon from './AmenityIcon';

interface RoomCardProps {
  room: {
    type: string;
    capacity: number;
    price: number;
    amenities: string[];
    images?: string[];
  };
  dormName: string;
  dormArea?: string;
  university?: string;
  onViewDetails: () => void;
  index?: number;
}

export default function RoomCard({ room, dormName, dormArea, university, onViewDetails, index = 0 }: RoomCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.35, 
        delay: index * 0.12,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="perspective-container"
      style={{ perspective: '1200px' }}
    >
      <motion.div
        className="relative w-full h-[280px] cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateX: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onClick={handleFlip}
        whileHover={{ scale: 1.02 }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 glass-hover rounded-2xl p-5 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <h4 className="text-lg font-bold mb-2">{room.type}</h4>
              {room.price && (
                <div className="inline-flex items-center gap-1 glass px-3 py-1 rounded-full text-sm mb-3">
                  <span className="text-primary font-semibold">${room.price}</span>
                  <span className="text-foreground/60">/mo</span>
                </div>
              )}
            </div>
            
            {room.amenities.length > 0 && (
              <div className="flex gap-3 items-center">
                {room.amenities.slice(0, 3).map((amenity) => (
                  <AmenityIcon key={amenity} name={amenity} className="w-5 h-5" />
                ))}
                {room.amenities.length > 3 && (
                  <span className="text-xs text-foreground/60">+{room.amenities.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Back Face - Vertical Flip (top to bottom) */}
        <div
          className="absolute inset-0 glass-hover rounded-2xl p-6 backface-hidden flex flex-col items-center justify-center space-y-4"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)'
          }}
        >
          {/* Big Price Badge */}
          <div className="text-center">
            <div className="text-4xl font-bold gradient-text mb-2">
              ${room.price}
            </div>
            <div className="text-sm text-foreground/60">per month</div>
          </div>

          {/* Tags Row */}
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            <div className="glass px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-secondary" />
              <span>{room.capacity} {room.capacity === 1 ? 'Person' : 'People'}</span>
            </div>
            <div className="glass px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-secondary" />
              <span>{room.type}</span>
            </div>
            {university && (
              <div className="glass px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-secondary" />
                <span>Near {university}</span>
              </div>
            )}
          </div>

          {/* Amenity Icons Grid */}
          {room.amenities.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center">
              {room.amenities.map((amenity) => (
                <AmenityIcon key={amenity} name={amenity} className="w-5 h-5" />
              ))}
            </div>
          )}

          {/* CTA Button */}
          <Button 
            className="w-full mt-2 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
          >
            View Details
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
