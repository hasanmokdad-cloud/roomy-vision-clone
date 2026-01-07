import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Wifi,
  Car,
  Snowflake,
  Tv,
  UtensilsCrossed,
  WashingMachine,
  Dumbbell,
  ShieldCheck,
  Waves,
  Coffee,
  Cigarette,
  Dog,
  Accessibility,
  Flame,
  Wind,
  Bath,
  Refrigerator,
  Microwave,
  CheckCircle2,
} from 'lucide-react';

interface AmenitiesGridProps {
  amenities: string[];
  maxVisible?: number;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-5 w-5" />,
  parking: <Car className="h-5 w-5" />,
  ac: <Snowflake className="h-5 w-5" />,
  air_conditioning: <Snowflake className="h-5 w-5" />,
  tv: <Tv className="h-5 w-5" />,
  kitchen: <UtensilsCrossed className="h-5 w-5" />,
  washer: <WashingMachine className="h-5 w-5" />,
  dryer: <Wind className="h-5 w-5" />,
  gym: <Dumbbell className="h-5 w-5" />,
  security: <ShieldCheck className="h-5 w-5" />,
  pool: <Waves className="h-5 w-5" />,
  coffee: <Coffee className="h-5 w-5" />,
  smoking: <Cigarette className="h-5 w-5" />,
  pets: <Dog className="h-5 w-5" />,
  accessible: <Accessibility className="h-5 w-5" />,
  heating: <Flame className="h-5 w-5" />,
  bathtub: <Bath className="h-5 w-5" />,
  refrigerator: <Refrigerator className="h-5 w-5" />,
  microwave: <Microwave className="h-5 w-5" />,
};

function getAmenityIcon(amenity: string): React.ReactNode {
  const key = amenity.toLowerCase().replace(/[\s-]/g, '_');
  return AMENITY_ICONS[key] || <CheckCircle2 className="h-5 w-5" />;
}

function formatAmenityName(amenity: string): string {
  return amenity
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function AmenitiesGridComponent({ amenities, maxVisible = 10 }: AmenitiesGridProps) {
  const [showAll, setShowAll] = useState(false);
  
  const uniqueAmenities = [...new Set(amenities)];
  const visibleAmenities = uniqueAmenities.slice(0, maxVisible);
  const hasMore = uniqueAmenities.length > maxVisible;

  return (
    <div className="py-6 border-b">
      <h3 className="text-xl font-semibold mb-4">What this place offers</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleAmenities.map((amenity, index) => (
          <div key={index} className="flex items-center gap-4">
            <span className="text-muted-foreground">
              {getAmenityIcon(amenity)}
            </span>
            <span>{formatAmenityName(amenity)}</span>
          </div>
        ))}
      </div>

      {hasMore && (
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => setShowAll(true)}
        >
          Show all {uniqueAmenities.length} amenities
        </Button>
      )}

      {/* All Amenities Modal */}
      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>What this place offers</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {uniqueAmenities.map((amenity, index) => (
              <div key={index} className="flex items-center gap-4 py-2">
                <span className="text-muted-foreground">
                  {getAmenityIcon(amenity)}
                </span>
                <span>{formatAmenityName(amenity)}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const AmenitiesGrid = memo(AmenitiesGridComponent);
