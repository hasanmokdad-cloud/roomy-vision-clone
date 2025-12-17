import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, BadgeCheck, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SeedDorm } from '@/data/dorms.seed';
import { useNavigate } from 'react-router-dom';

interface DormCardProps {
  dorm: SeedDorm;
  capacityFilter?: number;
}

export const DormCard: React.FC<DormCardProps> = ({ dorm, capacityFilter }) => {
  const navigate = useNavigate();

  // Filter rooms by capacity if filter is active
  const matchingRooms = capacityFilter
    ? dorm.rooms.filter((r) => r.capacity >= capacityFilter)
    : dorm.rooms;

  // Don't show dorm if no rooms match capacity filter
  if (capacityFilter && matchingRooms.length === 0) {
    return null;
  }

  const handleCardClick = () => {
    // Navigate to dorm detail page
    // Note: SeedDorm doesn't have an id field by default, using name as fallback
    const dormId = (dorm as any).id || dorm.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/dorm/${dormId}`);
  };

  return (
    <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative bg-white dark:bg-card rounded-2xl overflow-hidden cursor-pointer group shadow-[0_2px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_2px_hsl(var(--primary)/0.15)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_2px_hsl(var(--primary)/0.15)] transition-all duration-300"
        onClick={handleCardClick}
      >
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={dorm.exteriorPhoto}
            alt={dorm.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {dorm.verified && (
            <Badge className="absolute top-4 right-4 bg-primary backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
              <BadgeCheck className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-2xl font-black gradient-text mb-3">{dorm.name}</h3>

          <div className="flex items-center gap-2 mb-4 text-sm text-foreground/70">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{dorm.area}</span>
          </div>

          {/* Price Range */}
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-xl font-black text-foreground">
              From ${dorm.minPrice}
            </span>
            <span className="text-sm text-foreground/60">/month</span>
          </div>

          {/* Distance Badges - TODO: Re-enable after distance algorithm implementation
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(dorm.distanceToUniversities)
              .slice(0, 2)
              .map(([uni, dist]) => (
                <Badge key={uni} variant="outline" className="text-xs">
                  {uni}: {dist}
                </Badge>
              ))}
          </div>
          */}

          {/* Room Count */}
          <div className="text-sm text-foreground/70">
            {matchingRooms.length} room{matchingRooms.length !== 1 ? 's' : ''} available
          </div>

          {/* Hover Hint */}
          <div className="mt-4 text-center text-xs text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to view details →
          </div>
        </div>
      </motion.div>
  );
};
