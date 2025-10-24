import { MapPin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DormCardProps {
  dorm: {
    id: string;
    name: string;
    location: string;
    price: number;
    capacity?: number;
    type?: string;
    image_url?: string;
  };
  onViewDetails: () => void;
}

export const DormCard = ({ dorm, onViewDetails }: DormCardProps) => {
  return (
    <div className="glass rounded-xl p-4 space-y-3 hover:bg-white/5 transition-all">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{dorm.name}</h3>
          <div className="flex items-center gap-1 text-sm text-foreground/60">
            <MapPin className="w-3 h-3" />
            <span>{dorm.location}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <DollarSign className="w-4 h-4 text-secondary" />
          <span className="text-lg font-bold gradient-text">{dorm.price}</span>
          <span className="text-xs text-foreground/60">/mo</span>
        </div>
      </div>

      {dorm.type && (
        <div className="flex gap-2">
          <span className="text-xs px-2 py-1 rounded-full glass">{dorm.type}</span>
          {dorm.capacity && (
            <span className="text-xs px-2 py-1 rounded-full glass">{dorm.capacity} capacity</span>
          )}
        </div>
      )}

      <Button
        onClick={onViewDetails}
        size="sm"
        className="w-full bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
      >
        View Details
      </Button>
    </div>
  );
};