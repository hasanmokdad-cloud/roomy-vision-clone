import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface RoomType {
  type: string;
  capacity: number;
  price: number;
  amenities?: string[];
}

interface RoomExpansion3DProps {
  rooms: RoomType[];
  dormId: string;
  isExpanded: boolean;
}

export function RoomExpansion3D({ rooms, dormId, isExpanded }: RoomExpansion3DProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  if (rooms.length <= 1) return null;

  const calculateArcPosition = (index: number, total: number) => {
    const angle = (index - (total - 1) / 2) * (120 / Math.max(total, 2));
    const radius = 150;
    const x = Math.sin((angle * Math.PI) / 180) * radius;
    const z = Math.cos((angle * Math.PI) / 180) * radius - radius;
    return { x, z, rotateY: -angle };
  };

  const handleViewDetails = (room: RoomType) => {
    navigate(`/dorm/${dormId}?roomType=${encodeURIComponent(room.type)}`);
  };

  // Mobile accordion view
  if (isMobile) {
    return (
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-4 space-y-2"
          >
            {rooms.map((room, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="glass-hover rounded-xl p-4 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-foreground">{room.type}</h4>
                  <Badge variant="secondary" className="neon-glow">
                    ${room.price}/mo
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Users className="w-4 h-4" />
                  <span>Capacity: {room.capacity}</span>
                </div>
                {room.amenities && room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {room.amenities.slice(0, 3).map((amenity, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                )}
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleViewDetails(room)}
                >
                  View Details
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Desktop 3D arc view
  return (
    <AnimatePresence>
      {isExpanded && (
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
