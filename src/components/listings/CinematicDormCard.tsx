import { motion } from 'framer-motion';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle, Wifi, Zap, Home, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FullViewportRoomOverlay } from './FullViewportRoomOverlay';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useIsMobile } from '@/hooks/use-mobile';

interface RoomType {
  type: string;
  capacity: number;
  price: number;
  amenities?: string[];
}

interface CinematicDormCardProps {
  dorm: {
    id: string;
    dorm_name: string;
    area: string;
    location?: string;
    monthly_price?: number;
    price?: number;
    verification_status?: string;
    cover_image?: string;
    image_url?: string;
    room_types_json?: any;
    amenities?: string[];
    shuttle?: boolean;
    address?: string;
    university?: string;
  };
  index: number;
  isExpanded: boolean;
  onExpand: () => void;
  onClose: () => void;
}

export function CinematicDormCard({ dorm, index, isExpanded, onExpand, onClose }: CinematicDormCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // Parse room types
  const roomTypes: RoomType[] = dorm.room_types_json || [];
  const hasMultipleRooms = roomTypes.length > 1;
  
  // Calculate starting price
  const startingPrice = roomTypes.length > 0
    ? Math.min(...roomTypes.map(r => r.price))
    : dorm.monthly_price || dorm.price || 0;

  const dormImage = dorm.cover_image || dorm.image_url || '/placeholder.svg';
  const isVerified = dorm.verification_status === 'Verified';

  const handleLearnMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dorm/${dorm.id}`);
  };

  const handleCardClick = () => {
    if (hasMultipleRooms) {
      onExpand();
    } else {
      navigate(`/dorm/${dorm.id}`);
    }
  };

  const amenityIcons: Record<string, any> = {
    'WiFi': Wifi,
    'Internet': Wifi,
    'Electricity': Zap,
    'Furnished': Home,
  };

  const getAmenityIcon = (amenity: string) => {
    const IconComponent = amenityIcons[amenity] || Navigation;
    return <IconComponent className="w-3 h-3" />;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: prefersReducedMotion ? 0 : index * 0.1,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative perspective-deep group cursor-pointer"
        onMouseEnter={() => {
          if (!isMobile && !prefersReducedMotion) {
            setIsFlipped(true);
          }
        }}
        onMouseLeave={() => {
          if (!isMobile && !prefersReducedMotion) {
            setIsFlipped(false);
          }
        }}
        onClick={handleCardClick}
      >
      <motion.div
        animate={{
          rotateX: !prefersReducedMotion && !isMobile && isFlipped ? 180 : 0
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full h-[420px] cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 flip-card-3d glass-hover rounded-3xl overflow-hidden border border-border shadow-xl card-glow-hover"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Image */}
          <div className="relative h-56 overflow-hidden">
              <img
                src={dormImage}
                alt={dorm.dorm_name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              {isVerified && (
                <Badge variant="secondary" className="neon-glow backdrop-blur-sm">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              {hasMultipleRooms && (
                <Badge variant="secondary" className="backdrop-blur-sm">
                  {roomTypes.length} Room Types
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-2xl font-black gradient-text mb-2 line-clamp-1">
                {dorm.dorm_name}
              </h3>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">{dorm.area || dorm.location}</span>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  {hasMultipleRooms ? 'Starting from' : 'Monthly Price'}
                </div>
                <div className="text-3xl font-black gradient-text">
                  ${startingPrice}
                </div>
              </div>
              {hasMultipleRooms && (
                <Badge variant="outline" className="text-xs">
                  Click to explore
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 flip-card-3d glass-hover rounded-3xl overflow-hidden border border-border shadow-xl p-6"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)'
          }}
        >
          <div className="flex flex-col h-full justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black gradient-text mb-2 line-clamp-2">
                  {dorm.dorm_name}
                </h3>
                {dorm.university && (
                  <p className="text-sm text-muted-foreground">Near {dorm.university}</p>
                )}
              </div>

              {hasMultipleRooms && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Available Rooms:</p>
                  <div className="flex flex-wrap gap-1">
                    {roomTypes.map((room, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {room.type} - ${room.price}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {dorm.shuttle && (
                <Badge variant="secondary" className="w-fit">
                  <Zap className="w-3 h-3 mr-1" />
                  Shuttle Available
                </Badge>
              )}

              {dorm.address && (
                <div className="text-sm text-foreground">
                  <p className="font-semibold mb-1">Address:</p>
                  <p className="text-muted-foreground line-clamp-2">{dorm.address}</p>
                </div>
              )}

              {dorm.amenities && dorm.amenities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Amenities:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {dorm.amenities.slice(0, 6).map((amenity, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                        {getAmenityIcon(amenity)}
                        <span className="truncate">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handleLearnMore} className="w-full">
              {hasMultipleRooms ? 'View All Rooms' : 'Learn More'}
            </Button>
          </div>
        </div>
      </motion.div>

      </motion.div>

      {/* Full Viewport Overlay */}
      {hasMultipleRooms && (
        <FullViewportRoomOverlay
          isOpen={isExpanded}
          onClose={onClose}
          dorm={dorm}
        />
      )}
    </>
  );
}
