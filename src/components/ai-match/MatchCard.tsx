import { useState } from 'react';
import { motion } from 'framer-motion';
import { ConfidenceRing } from './ConfidenceRing';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Users, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AmenityIcon } from '@/components/icons/AmenityIcon';

interface MatchCardProps {
  match: {
    dorm: string;
    room: string;
    matchPercentage: number;
    distance: string;
    price: number;
    capacity: number;
    reasons: string[];
    amenities: string[];
    dormId?: string;
    roomId?: string;
  };
  index: number;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, index }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
      className="relative"
      style={{ perspective: '1200px' }}
    >
      <motion.div
        animate={{ 
          y: [0, -6, 0],
          rotateX: isFlipped ? 180 : 0
        }}
        transition={{
          y: {
            repeat: Infinity,
            duration: 3,
            ease: 'easeInOut',
            delay: index * 0.2
          },
          rotateX: {
            duration: 0.6,
            ease: 'easeInOut'
          }
        }}
        className="relative w-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Face */}
        <motion.div
          className="glass-hover neon-border rounded-3xl p-8 min-h-[450px] relative"
          style={{ 
            backfaceVisibility: 'hidden',
            boxShadow: `0 20px 60px -15px hsl(var(--primary) / 0.3)`
          }}
          whileHover={{ scale: 1.02, boxShadow: `0 25px 80px -20px hsl(var(--primary) / 0.5)` }}
        >
          <div className="flex flex-col items-center space-y-6">
            <ConfidenceRing percentage={match.matchPercentage} size={100} />
            
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black gradient-text">{match.dorm}</h3>
              <p className="text-lg text-foreground/80">{match.room}</p>
            </div>

            <div className="w-full space-y-3">
              <div className="flex items-center justify-between p-3 glass rounded-xl">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm">Distance</span>
                </div>
                <span className="text-sm font-semibold">{match.distance}</span>
              </div>

              <div className="flex items-center justify-between p-3 glass rounded-xl">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-sm">Monthly</span>
                </div>
                <span className="text-sm font-semibold">${match.price}</span>
              </div>

              <div className="flex items-center justify-between p-3 glass rounded-xl">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm">Capacity</span>
                </div>
                <span className="text-sm font-semibold">{match.capacity} people</span>
              </div>
            </div>

            <p className="text-xs text-foreground/50 text-center">
              Tap to see why this matches you
            </p>
          </div>
        </motion.div>

        {/* Back Face */}
        <motion.div
          className="absolute inset-0 glass-hover neon-border rounded-3xl p-8"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)',
            boxShadow: `0 20px 60px -15px hsl(var(--secondary) / 0.3)`
          }}
        >
          <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h4 className="text-xl font-black gradient-text">Why This Match?</h4>
            </div>

            <div className="space-y-3 flex-1">
              {match.reasons.map((reason, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="flex items-start gap-3 p-3 glass rounded-xl"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{idx + 1}</span>
                  </div>
                  <p className="text-sm text-foreground/80">{reason}</p>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-foreground/60 mb-3">Amenities</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {match.amenities.slice(0, 6).map((amenity) => {
                  // Only render valid amenity types
                  const validAmenities = ['wifi', 'ac', 'laundry', 'parking', 'kitchen', 'study', 'security', 'furnished', 'balcony', 'gym', 'elevator', 'heating', 'cleaning'];
                  if (!validAmenities.includes(amenity)) return null;
                  
                  return (
                    <div key={amenity} className="flex items-center gap-1 glass px-2 py-1 rounded-lg">
                      <AmenityIcon name={amenity as any} size={14} />
                      <span className="text-xs capitalize">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (match.dormId) {
                  navigate(`/dorm/${match.dormId}${match.roomId ? `?room=${match.roomId}` : ''}`);
                }
              }}
              className="w-full neon-glow"
            >
              View Full Details
            </Button>

            <p className="text-xs text-foreground/50 text-center">
              Tap again to flip back
            </p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
