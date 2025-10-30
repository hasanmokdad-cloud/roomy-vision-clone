import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FilterChipsProps {
  filters: {
    priceRange: [number, number];
    universities: string[];
    areas: string[];
    roomTypes: string[];
    capacity?: number;
  };
  onRemoveFilter: (category: 'universities' | 'areas' | 'roomTypes' | 'capacity', value?: string) => void;
  onResetPrice: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ filters, onRemoveFilter, onResetPrice }) => {
  const hasActiveFilters = 
    filters.universities.length > 0 ||
    filters.areas.length > 0 ||
    filters.roomTypes.length > 0 ||
    filters.capacity !== undefined ||
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 2000);

  if (!hasActiveFilters) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-hover rounded-2xl p-4 mb-6"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-foreground/70">Active Filters:</span>
        
        <AnimatePresence mode="popLayout">
          {/* Price Range */}
          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 2000) && (
            <motion.div
              key="price"
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Badge variant="secondary" className="neon-glow gap-2 hover:bg-secondary/80 transition-colors">
                ${filters.priceRange[0]} - ${filters.priceRange[1]}
                <button
                  onClick={onResetPrice}
                  className="hover:text-primary transition-colors"
                  aria-label="Remove price filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            </motion.div>
          )}

          {/* Capacity */}
          {filters.capacity && (
            <motion.div
              key="capacity"
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Badge variant="secondary" className="neon-glow gap-2 hover:bg-secondary/80 transition-colors">
                Capacity: {filters.capacity}+
                <button
                  onClick={() => onRemoveFilter('capacity')}
                  className="hover:text-primary transition-colors"
                  aria-label="Remove capacity filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            </motion.div>
          )}

          {/* Universities */}
          {filters.universities.map((uni) => (
            <motion.div
              key={`uni-${uni}`}
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Badge variant="secondary" className="neon-glow gap-2 hover:bg-secondary/80 transition-colors">
                {uni}
                <button
                  onClick={() => onRemoveFilter('universities', uni)}
                  className="hover:text-primary transition-colors"
                  aria-label={`Remove ${uni} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            </motion.div>
          ))}

          {/* Areas */}
          {filters.areas.map((area) => (
            <motion.div
              key={`area-${area}`}
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Badge variant="secondary" className="neon-glow gap-2 hover:bg-secondary/80 transition-colors">
                {area}
                <button
                  onClick={() => onRemoveFilter('areas', area)}
                  className="hover:text-primary transition-colors"
                  aria-label={`Remove ${area} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            </motion.div>
          ))}

          {/* Room Types */}
          {filters.roomTypes.map((type) => (
            <motion.div
              key={`type-${type}`}
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Badge variant="secondary" className="neon-glow gap-2 hover:bg-secondary/80 transition-colors">
                {type}
                <button
                  onClick={() => onRemoveFilter('roomTypes', type)}
                  className="hover:text-primary transition-colors"
                  aria-label={`Remove ${type} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
