import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

export interface RoomType {
  type: string;
  capacity: number;
  price: number;
  amenities?: string[];
  images?: string[];
}

interface RoomExpansion3DProps {
  rooms: RoomType[];
  dormId: string;
  isExpanded: boolean;
  isFullViewport?: boolean;
  dormAddress?: string;
  dormShuttle?: boolean;
}

export function RoomExpansion3D({ 
  rooms, 
  dormId, 
  isExpanded, 
  isFullViewport = false,
  dormAddress,
  dormShuttle 
}: RoomExpansion3DProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  if (rooms.length <= 1) return null;

  const calculateArcPosition = (index: number, total: number) => {
    if (isFullViewport) {
      // Larger arc for full viewport
      const angle = (index - (total - 1) / 2) * (100 / Math.max(total, 2));
      const radius = 250;
      const x = Math.sin((angle * Math.PI) / 180) * radius;
      const z = Math.cos((angle * Math.PI) / 180) * radius - radius;
      return { x, z, rotateY: -angle };
    } else {
      // Original smaller arc
      const angle = (index - (total - 1) / 2) * (120 / Math.max(total, 2));
      const radius = 150;
      const x = Math.sin((angle * Math.PI) / 180) * radius;
      const z = Math.cos((angle * Math.PI) / 180) * radius - radius;
      return { x, z, rotateY: -angle };
    }
  };

  const handleViewDetails = (room: RoomType) => {
    navigate(`/dorm/${dormId}?roomType=${encodeURIComponent(room.type)}`);
  };

  // Mobile/tablet grid view (for full viewport)
  if (isMobile || isFullViewport) {
    return (
      <div className={`${isFullViewport ? 'p-4 md:p-8' : 'mt-4'}`}>
        <div className={`grid ${
          isFullViewport 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6' 
            : 'grid-cols-1 gap-2'
        }`}
        >
          {rooms.map((room, index) => {
            const isFlipped = flippedIndex === index;
            
            return (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ 
                  delay: index * 0.08,
                  type: 'spring',
                  damping: 20,
                  stiffness: 300
                }}
                className="group cursor-pointer"
                onClick={() => setFlippedIndex(isFlipped ? null : index)}
                onMouseEnter={() => !isMobile && setFlippedIndex(index)}
                onMouseLeave={() => !isMobile && setFlippedIndex(null)}
              >
                <motion.div
                  animate={{ rotateX: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative ${
                    isFullViewport ? 'h-80' : 'h-auto'
                  } flip-card-3d`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front Face */}
                  <div
                    className={`absolute inset-0 glass-hover rounded-xl p-6 border border-border shadow-lg backface-hidden ${
                      isFullViewport ? '' : 'relative'
                    }`}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <Badge variant="secondary" className="mb-3">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Available
                        </Badge>
                        <h3 className="text-xl md:text-2xl font-black gradient-text mb-3">
                          {room.type}
                        </h3>
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">Fits {room.capacity} student{room.capacity > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl font-black gradient-text mb-1">
                          ${room.price}
                        </div>
                        <div className="text-sm text-muted-foreground">per month</div>
                      </div>
                    </div>
                  </div>

                  {/* Back Face */}
                  <div
                    className={`absolute inset-0 glass-hover rounded-xl p-6 border border-border shadow-lg backface-hidden`}
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateX(180deg)'
                    }}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div className="space-y-3">
                        <h4 className="font-bold text-lg text-foreground">{room.type}</h4>
                        <div className="text-2xl font-black gradient-text">
                          ${room.price}/mo
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            <span>Capacity: {room.capacity}</span>
                          </div>
                          {dormShuttle && (
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-primary" />
                              <span>Shuttle available</span>
                            </div>
                          )}
                          {dormAddress && (
                            <div className="text-muted-foreground line-clamp-2">
                              {dormAddress}
                            </div>
                          )}
                        </div>

                        {room.amenities && room.amenities.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Amenities:</p>
                            <div className="flex flex-wrap gap-1">
                              {room.amenities.slice(0, 5).map((amenity, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                              {room.amenities.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{room.amenities.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(room);
                          }}
                          className="flex-1"
                          size="sm"
                        >
                          Learn More
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(room);
                          }}
                          variant="outline"
                          className="flex-1"
                          size="sm"
                        >
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop 3D arc view (old small version - kept for non-full-viewport use)
  return (
    <AnimatePresence>
      {isExpanded && !isFullViewport && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 perspective-deep pointer-events-none z-20"
          style={{ perspective: '2000px' }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {rooms.map((room, index) => {
              const { x, z, rotateY } = calculateArcPosition(index, rooms.length);
              const isFlipped = flippedIndex === index;

              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0, x: 0, z: 0, rotateY: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    x,
                    z,
                    rotateY
                  }}
                  exit={{ scale: 0, opacity: 0, x: 0, z: 0, rotateY: 0 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="absolute pointer-events-auto"
                  style={{ transformStyle: 'preserve-3d' }}
                  onMouseEnter={() => setFlippedIndex(index)}
                  onMouseLeave={() => setFlippedIndex(null)}
                >
                  <motion.div
                    animate={{ rotateX: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-64 h-72"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Front Face */}
                    <div
                      className="absolute inset-0 glass-hover rounded-2xl p-6 border border-border shadow-xl backface-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <Badge variant="secondary" className="mb-4">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Available
                          </Badge>
                          <h3 className="text-2xl font-black gradient-text mb-2">
                            {room.type}
                          </h3>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">Fits {room.capacity} student{room.capacity > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-3xl font-black gradient-text">
                            ${room.price}
                          </div>
                          <div className="text-sm text-muted-foreground">per month</div>
                        </div>
                      </div>
                    </div>

                    {/* Back Face */}
                    <div
                      className="absolute inset-0 glass-hover rounded-2xl p-6 border border-border shadow-xl backface-hidden"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateX(180deg)'
                      }}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <h4 className="font-bold text-foreground mb-3">{room.type} Details</h4>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="w-4 h-4 text-primary" />
                              <span className="text-foreground">Capacity: {room.capacity}</span>
                            </div>
                            <div className="text-2xl font-black gradient-text">
                              ${room.price}/mo
                            </div>
                          </div>
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground">Amenities:</p>
                              <div className="flex flex-wrap gap-1">
                                {room.amenities.slice(0, 4).map((amenity, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {amenity}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleViewDetails(room)}
                          className="w-full"
                          size="sm"
                        >
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
