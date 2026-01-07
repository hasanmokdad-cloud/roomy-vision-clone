import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, DoorOpen, BedDouble, ChevronRight, Building2 } from 'lucide-react';
import type { AvailabilityState } from '@/utils/apartmentAvailability';

interface PricingTier {
  capacity: number;
  monthlyPrice: number;
  deposit: number;
}

interface ApartmentCardProps {
  apartment: {
    id: string;
    name: string;
    type: string;
    maxCapacity: number;
    enabledCapacities: number[];
    images: string[];
    enableFullApartmentReservation: boolean;
    enableBedroomReservation: boolean;
    enableBedReservation: boolean;
  };
  pricingTiers: PricingTier[];
  bedroomCount: number;
  availability: AvailabilityState;
  index: number;
  onReserveApartment: () => void;
  onViewBedrooms: () => void;
}

const ApartmentCardComponent = ({
  apartment,
  pricingTiers,
  bedroomCount,
  availability,
  index,
  onReserveApartment,
  onViewBedrooms,
}: ApartmentCardProps) => {
  // Use availability counts from the strict availability engine
  const availableBedroomsCount = availability.availableBedroomsCount;
  const availableBedsCount = availability.availableBedsCount;
  // Calculate starting price per resident
  const startingPrice = useMemo(() => {
    if (pricingTiers.length === 0) return 0;
    // Get lowest price per resident across all tiers
    const pricesPerPerson = pricingTiers.map(tier => tier.monthlyPrice / tier.capacity);
    return Math.min(...pricesPerPerson);
  }, [pricingTiers]);

  // Capacity range text
  const capacityRange = useMemo(() => {
    if (apartment.enabledCapacities.length === 0) return `1-${apartment.maxCapacity}`;
    const min = Math.min(...apartment.enabledCapacities);
    const max = Math.max(...apartment.enabledCapacities);
    return min === max ? `${min}` : `${min}-${max}`;
  }, [apartment.enabledCapacities, apartment.maxCapacity]);

  // Apartment type badge color
  const typeColor = useMemo(() => {
    switch (apartment.type) {
      case 'studio': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'small': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'large': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'penthouse': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  }, [apartment.type]);

  const apartmentImage = apartment.images?.[0] || '/placeholder.svg';

  // Use strict availability flags
  const canReserve = availability.apartmentReservable;
  const hasBedrooms = bedroomCount > 0;
  const isLocked = availability.isApartmentLocked;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="overflow-hidden glass-hover border-border hover:border-primary/50 transition-all duration-300 group">
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={apartmentImage}
            alt={apartment.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          
          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <Badge className={`${typeColor} capitalize`}>
              <Building2 className="w-3 h-3 mr-1" />
              {apartment.type}
            </Badge>
          </div>

          {/* Capacity Badge */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="backdrop-blur-sm">
              <Users className="w-3 h-3 mr-1" />
              {capacityRange} residents
            </Badge>
          </div>
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">{apartment.name}</h3>
              <p className="text-sm text-muted-foreground">
                {bedroomCount} {bedroomCount === 1 ? 'Bedroom' : 'Bedrooms'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold gradient-text">${Math.round(startingPrice)}</div>
              <div className="text-xs text-muted-foreground">per resident/mo</div>
            </div>
          </div>

          {/* Availability Stats - Using strict availability counts */}
          <div className="flex items-center gap-4 text-sm">
            {apartment.enableBedroomReservation && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DoorOpen className="w-4 h-4" />
                <span>
                  {availableBedroomsCount}/{availability.totalBedroomsCount} bedrooms
                </span>
              </div>
            )}
            {apartment.enableBedReservation && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BedDouble className="w-4 h-4" />
                <span>
                  {availableBedsCount}/{availability.totalBedsCount} beds
                </span>
              </div>
            )}
          </div>
          
          {/* Locked Status Warning */}
          {isLocked && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              <span>🔒 Apartment is fully reserved</span>
            </div>
          )}

          {/* Enabled Modes Badges */}
          <div className="flex flex-wrap gap-1.5">
            {apartment.enableFullApartmentReservation && (
              <Badge variant="outline" className="text-xs">
                Full Apartment
              </Badge>
            )}
            {apartment.enableBedroomReservation && (
              <Badge variant="outline" className="text-xs">
                Per Bedroom
              </Badge>
            )}
            {apartment.enableBedReservation && (
              <Badge variant="outline" className="text-xs">
                Per Bed
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {canReserve && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onReserveApartment();
                }}
                className="flex-1"
              >
                Reserve Apartment
              </Button>
            )}
            {hasBedrooms && (apartment.enableBedroomReservation || apartment.enableBedReservation) && (
              <Button
                variant={canReserve ? 'outline' : 'default'}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewBedrooms();
                }}
                className={canReserve ? '' : 'flex-1'}
              >
                View Bedrooms
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Availability Warning - More specific messaging */}
          {!canReserve && apartment.enableFullApartmentReservation && !isLocked && (
            <p className="text-xs text-muted-foreground text-center italic">
              {availability.hasAnyBedReserved 
                ? 'Beds already reserved - full apartment unavailable'
                : availability.hasAnyBedroomReserved
                  ? 'Bedrooms already reserved - full apartment unavailable'
                  : availability.reason || 'Full apartment not available'}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const ApartmentCard = memo(ApartmentCardComponent);
