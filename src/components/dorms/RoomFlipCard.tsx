import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AmenityIcon, amenityLabels } from '@/components/icons/AmenityIcon';
import { SeedRoom } from '@/data/dorms.seed';

interface RoomFlipCardProps {
  room: SeedRoom;
  dormName: string;
  onLearnMore: () => void;
  onContact: () => void;
}

export const RoomFlipCard: React.FC<RoomFlipCardProps> = ({
  room,
  dormName,
  onLearnMore,
  onContact,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      className="relative w-full h-[320px] cursor-pointer"
      style={{ perspective: '1200px' }}
      onHoverStart={() => setIsFlipped(true)}
      onHoverEnd={() => setIsFlipped(false)}
      onClick={() => setIsFlipped(!isFlipped)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateX: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 glass-hover rounded-2xl p-6 border-2 border-primary/20"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-black gradient-text">{room.roomType}</h3>
                <Badge variant="secondary" className="neon-glow">
                  <Users className="w-3 h-3 mr-1" />
                  {room.capacity}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-2xl font-black text-foreground">${room.price}</span>
                <span className="text-sm text-foreground/60">/month</span>
              </div>

              {room.nearUniversity && (
                <div className="flex items-center gap-2 mb-4 text-sm text-foreground/70">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Near {room.nearUniversity}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {room.amenities.slice(0, 5).map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10"
                    title={amenityLabels[amenity as keyof typeof amenityLabels]}
                  >
                    <AmenityIcon name={amenity as any} className="w-4 h-4 text-primary" />
                  </div>
                ))}
                {room.amenities.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{room.amenities.length - 5}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-xs text-center text-foreground/50 mt-4">
              Hover or tap to see details
            </p>
          </div>
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 glass-hover rounded-2xl p-6 border-2 border-primary/30 neon-glow"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)',
          }}
        >
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="text-center mb-6">
                <div className="text-4xl font-black gradient-text mb-2">
                  ${room.price}
                </div>
                <p className="text-sm text-foreground/70">per month</p>
              </div>

              <div className="flex items-center justify-center gap-6 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{room.capacity} {room.capacity === 1 ? 'Student' : 'Students'}</span>
                </div>
                <div className="text-foreground/50">•</div>
                <div>{room.roomType}</div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-foreground/60 mb-2 font-semibold">Amenities:</p>
                <div className="grid grid-cols-3 gap-2">
                  {room.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-1 text-xs"
                      title={amenityLabels[amenity as keyof typeof amenityLabels]}
                    >
                      <AmenityIcon name={amenity as any} className="w-3 h-3 text-primary" />
                      <span className="text-foreground/70 truncate">
                        {amenityLabels[amenity as keyof typeof amenityLabels]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-foreground/60 mb-4">
                <span className="font-semibold">Utilities:</span> {room.utilities}
              </div>

              {room.nearUniversity && (
                <div className="flex items-center gap-2 text-xs text-foreground/70 mb-4">
                  <MapPin className="w-3 h-3 text-primary" />
                  <span>Near {room.nearUniversity}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onLearnMore();
                }}
                className="w-full bg-gradient-to-r from-primary to-secondary neon-glow font-bold"
                size="sm"
              >
                View Details
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onContact();
                }}
                variant="outline"
                className="w-full border-primary/30"
                size="sm"
              >
                Reach Us
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
