import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Sparkles, Zap, CheckCircle, MapPin, Home } from 'lucide-react';
import { getAmenityIcon } from '@/utils/amenityIcons';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { RoomType } from '@/types/RoomType';

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
  const prefersReducedMotion = useReducedMotion();
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  if (rooms.length === 0) return null;

  const handleViewDetails = (room: RoomType) => {
    navigate(`/dorm/${dormId}?roomType=${encodeURIComponent(room.type)}`);
  };

  const handleContact = () => {
    navigate(`/dorm/${dormId}?action=contact`);
  };

  const renderAmenityIcon = (amenity: string) => {
    const IconComponent = getAmenityIcon(amenity);
    return <IconComponent className="w-3 h-3" />;
  };

  // Calculate 3D arc positions for desktop cinematic view
  const calculateArcPosition = (index: number, total: number) => {
    if (total === 1) return { x: 0, y: 0, z: 0, rotateY: 0 };
    
    const angle = (index / (total - 1) - 0.5) * Math.PI * 0.7; // ~126 degree arc
    const radius = 450;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius - radius;
    const y = Math.abs(Math.sin(angle)) * -30; // Slight vertical curve
    const rotateY = -angle * (180 / Math.PI) * 0.4;
    
    return { x, y, z, rotateY };
  };

  const toggleFlip = (index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Cinematic Full-Viewport Layout
  if (isFullViewport) {
    return (
      <div 
        ref={containerRef}
        className={`w-full relative ${
          isMobile 
            ? 'grid grid-cols-1 gap-6 px-4' 
            : 'min-h-[700px] flex items-center justify-center'
        }`}
        style={!isMobile ? { 
          perspective: '2000px',
          perspectiveOrigin: 'center center'
        } : {}}
      >
        {rooms.map((room, index) => {
          const isFlipped = flippedCards.has(index);
          const arcPos = !isMobile && !prefersReducedMotion ? calculateArcPosition(index, rooms.length) : null;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8, y: 60 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
              }}
              transition={{
                delay: index * 0.12,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1]
              }}
              className={`relative ${
                isMobile 
                  ? 'w-full h-[500px]' 
                  : 'w-[420px] h-[540px] absolute'
              }`}
              style={{
                transformStyle: 'preserve-3d',
                ...(arcPos && !isMobile ? {
                  transform: `translate3d(${arcPos.x}px, ${arcPos.y}px, ${arcPos.z}px) rotateY(${arcPos.rotateY}deg)`,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-210px',
                  marginTop: '-270px',
                } : {})
              }}
              onMouseEnter={() => {
                if (!isMobile && !prefersReducedMotion) {
                  setFlippedCards(prev => new Set(prev).add(index));
                }
              }}
              onMouseLeave={() => {
                if (!isMobile && !prefersReducedMotion) {
                  setFlippedCards(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                  });
                }
              }}
              onClick={() => {
                if (isMobile) {
                  toggleFlip(index);
                }
              }}
            >
              <motion.div
                className="relative w-full h-full cursor-pointer"
                animate={{
                  rotateX: isFlipped && !prefersReducedMotion ? 180 : 0
                }}
                transition={{ 
                  duration: 0.6, 
                  ease: [0.22, 1, 0.36, 1]
                }}
                style={{ 
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'center top'
                }}
              >
                {/* Front Face */}
                <div
                  className="absolute inset-0 glass-hover rounded-3xl overflow-hidden border border-border/50 shadow-2xl backface-hidden"
                  style={{ 
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <div className="relative h-full flex flex-col justify-between p-8 bg-gradient-to-br from-background via-background to-muted/30">
                    {/* Room Type Badge */}
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary" className="neon-glow text-sm px-4 py-2">
                        <Home className="w-4 h-4 mr-2" />
                        {room.type}
                      </Badge>
                      <Badge variant="outline" className="backdrop-blur-sm border-primary/30">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Available
                      </Badge>
                    </div>

                    {/* Center Content - Price */}
                    <div className="space-y-6 my-auto">
                      <div className="space-y-3 text-center">
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-7xl md:text-8xl font-black gradient-text leading-none">
                            ${room.price}
                          </span>
                        </div>
                        <span className="text-xl text-muted-foreground block">/month</span>
                      </div>

                      <div className="flex items-center justify-center gap-3 text-muted-foreground">
                        <div className="flex items-center gap-2 bg-muted/50 backdrop-blur-sm rounded-full px-4 py-2">
                          <Users className="w-5 h-5" />
                          <span className="font-semibold">{room.capacity} student{room.capacity > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom - Key Amenities Preview */}
                    <div className="space-y-4">
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2">
                          {room.amenities.slice(0, 4).map((amenity, i) => (
                            <div 
                              key={i}
                              className="flex items-center gap-1.5 text-xs bg-muted/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/30"
                            >
                              {renderAmenityIcon(amenity)}
                              <span>{amenity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground text-center opacity-70 font-medium">
                        {isMobile ? 'Tap' : 'Hover'} to view full details
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back Face */}
                <div
                  className="absolute inset-0 glass rounded-3xl overflow-hidden border-2 border-primary/30 shadow-2xl backface-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateX(180deg)',
                  }}
                >
                  <div className="relative h-full flex flex-col p-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                    {/* Header */}
                    <div className="space-y-4 pb-6 border-b border-border/50">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-2xl md:text-3xl font-black gradient-text flex-1">
                          {room.type}
                        </h3>
                        <Badge className="neon-glow shrink-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Available
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black gradient-text">
                            ${room.price}
                          </span>
                          <span className="text-lg text-muted-foreground">/month</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>Fits {room.capacity} student{room.capacity > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-4 py-6 overflow-auto">
                      {dormAddress && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Location
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">{dormAddress}</p>
                        </div>
                      )}

                      {dormShuttle && (
                        <Badge variant="secondary" className="w-fit">
                          <Zap className="w-3 h-3 mr-1" />
                          Shuttle Service Available
                        </Badge>
                      )}

                      {room.amenities && room.amenities.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Amenities Included
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {room.amenities.slice(0, 6).map((amenity, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg px-2 py-1.5">
                                {renderAmenityIcon(amenity)}
                                <span className="truncate">{amenity}</span>
                              </div>
                            ))}
                          </div>
                          {room.amenities.length > 6 && (
                            <span className="text-xs text-muted-foreground italic">
                              +{room.amenities.length - 6} more amenities
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(room);
                        }}
                        className="neon-glow font-semibold"
                        size="lg"
                      >
                        Learn More
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContact();
                        }}
                        variant="outline"
                        size="lg"
                        className="font-semibold"
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
    );
  }

  // Legacy Desktop 3D Arc (non-fullviewport) - kept for backwards compatibility
  if (!isMobile && isExpanded && !isFullViewport) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 perspective-deep pointer-events-none z-20"
          style={{ perspective: '2000px' }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {rooms.map((room, index) => {
              const arcPos = calculateArcPosition(index, rooms.length);
              const isFlipped = flippedCards.has(index);

              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    x: arcPos.x,
                    y: arcPos.y,
                    z: arcPos.z,
                    rotateY: arcPos.rotateY
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="absolute pointer-events-auto w-64 h-80"
                  style={{ transformStyle: 'preserve-3d' }}
                  onMouseEnter={() => setFlippedCards(prev => new Set(prev).add(index))}
                  onMouseLeave={() => setFlippedCards(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                  })}
                >
                  <motion.div
                    animate={{ rotateX: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full h-full"
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
                            <span className="text-sm">Fits {room.capacity}</span>
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
                          <h4 className="font-bold text-foreground mb-3">{room.type}</h4>
                          <div className="text-2xl font-black gradient-text mb-4">
                            ${room.price}/mo
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
      </AnimatePresence>
    );
  }

  // Mobile grid fallback
  return (
    <div className="grid grid-cols-1 gap-4 p-4">
      {rooms.map((room, index) => {
        const isFlipped = flippedCards.has(index);
        
        return (
          <motion.div
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => toggleFlip(index)}
            className="cursor-pointer"
          >
            <motion.div
              animate={{ rotateX: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-64"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 glass-hover rounded-xl p-6 border border-border shadow-lg"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <Badge variant="secondary" className="mb-3">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Available
                </Badge>
                <h3 className="text-2xl font-black gradient-text mb-3">{room.type}</h3>
                <div className="text-3xl font-black gradient-text">${room.price}</div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 glass-hover rounded-xl p-6 border border-border shadow-lg"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateX(180deg)'
                }}
              >
                <div className="text-2xl font-black gradient-text mb-2">${room.price}/mo</div>
                <Button onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(room);
                }} className="w-full mt-4">
                  Learn More
                </Button>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
