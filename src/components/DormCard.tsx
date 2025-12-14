import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAmenityIcon } from '@/utils/amenityIcons';

interface DormCardProps {
  image: string;
  name: string;
  match: number;
  location: string;
  price: number;
  amenities: string[];
  index: number;
}

export const DormCard = ({ image, name, match, location, price, amenities, index }: DormCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="glass-hover rounded-3xl overflow-hidden group card-tilt"
    >
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Match badge */}
        <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse" />
          <span className="text-sm font-semibold">{match}% Match</span>
        </div>

        {/* Verified badge */}
        <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-secondary" />
          <span className="text-xs font-medium">Verified</span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">{name}</h3>
          <p className="text-sm text-foreground/60">{location}</p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold gradient-text">${price}</span>
          <span className="text-foreground/60">per month</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => {
            const Icon = getAmenityIcon(amenity);
            return (
              <div
                key={amenity}
                className="glass px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm"
              >
                <Icon className="w-4 h-4 text-secondary" />
                <span>{amenity}</span>
              </div>
            );
          })}
        </div>

        <Button className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-6 rounded-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300">
          View Details
        </Button>
      </div>
    </motion.div>
  );
};
