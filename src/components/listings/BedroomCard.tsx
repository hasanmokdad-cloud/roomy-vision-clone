import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BedDouble, ChevronRight, DoorOpen, Plus } from 'lucide-react';

interface BedData {
  id: string;
  label: string;
  bedType: string;
  monthlyPrice?: number;
  deposit?: number;
  available: boolean;
}

interface BedroomCardProps {
  bedroom: {
    id: string;
    name: string;
    bedType: string;
    baseCapacity: number;
    maxCapacity: number;
    allowExtraBeds: boolean;
    pricingMode: 'per_bed' | 'per_bedroom' | 'both';
    bedroomPrice?: number;
    bedroomDeposit?: number;
    bedPrice?: number;
    bedDeposit?: number;
    images: string[];
  };
  beds: BedData[];
  canReserveBedroom: boolean;
  canViewBeds: boolean;
  index: number;
  onReserveBedroom: () => void;
  onViewBeds: () => void;
}

const BedroomCardComponent = ({
  bedroom,
  beds,
  canReserveBedroom,
  canViewBeds,
  index,
  onReserveBedroom,
  onViewBeds,
}: BedroomCardProps) => {
  // Calculate available beds
  const availableBedsCount = useMemo(() => 
    beds.filter(bed => bed.available).length,
    [beds]
  );

  // Bed type badge styling
  const bedTypeColor = useMemo(() => {
    switch (bedroom.bedType) {
      case 'single': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'double': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'master': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'king': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'bunk': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  }, [bedroom.bedType]);

  const bedroomImage = bedroom.images?.[0] || '/placeholder.svg';
  const showBedroomPrice = bedroom.pricingMode === 'per_bedroom' || bedroom.pricingMode === 'both';
  const showBedPrice = bedroom.pricingMode === 'per_bed' || bedroom.pricingMode === 'both';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="overflow-hidden glass-hover border-border hover:border-primary/50 transition-all duration-300 group">
        {/* Image Section */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={bedroomImage}
            alt={bedroom.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          
          {/* Bed Type Badge - Descriptive Only */}
          <div className="absolute top-3 left-3">
            <Badge className={`${bedTypeColor} capitalize`}>
              <BedDouble className="w-3 h-3 mr-1" />
              {bedroom.bedType}
            </Badge>
          </div>

          {/* Capacity Badge */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="backdrop-blur-sm">
              <Users className="w-3 h-3 mr-1" />
              {bedroom.baseCapacity === bedroom.maxCapacity 
                ? `${bedroom.baseCapacity}` 
                : `${bedroom.baseCapacity}-${bedroom.maxCapacity}`
              }
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-semibold text-foreground">{bedroom.name}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DoorOpen className="w-3.5 h-3.5" />
                <span>Base capacity: {bedroom.baseCapacity}</span>
              </div>
            </div>
          </div>

          {/* Capacity Info */}
          <div className="flex items-center gap-3 text-sm">
            {bedroom.maxCapacity > bedroom.baseCapacity && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Plus className="w-3 h-3" />
                <span>Max: {bedroom.maxCapacity}</span>
              </div>
            )}
            {bedroom.allowExtraBeds && (
              <Badge variant="outline" className="text-xs">
                Extra beds allowed
              </Badge>
            )}
          </div>

          {/* Beds Available */}
          {beds.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <BedDouble className="w-4 h-4" />
              <span>{availableBedsCount} of {beds.length} beds available</span>
            </div>
          )}

          {/* Pricing */}
          <div className="flex flex-wrap gap-3 pt-1">
            {showBedroomPrice && bedroom.bedroomPrice && (
              <div className="text-sm">
                <span className="text-muted-foreground">Bedroom: </span>
                <span className="font-semibold text-foreground">${bedroom.bedroomPrice}/mo</span>
              </div>
            )}
            {showBedPrice && bedroom.bedPrice && (
              <div className="text-sm">
                <span className="text-muted-foreground">Per bed: </span>
                <span className="font-semibold text-foreground">${bedroom.bedPrice}/mo</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {canReserveBedroom && (bedroom.pricingMode === 'per_bedroom' || bedroom.pricingMode === 'both') && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onReserveBedroom();
                }}
                size="sm"
                className="flex-1"
              >
                Reserve Bedroom
              </Button>
            )}
            {canViewBeds && beds.length > 0 && (bedroom.pricingMode === 'per_bed' || bedroom.pricingMode === 'both') && (
              <Button
                variant={canReserveBedroom ? 'outline' : 'default'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewBeds();
                }}
                className={canReserveBedroom ? '' : 'flex-1'}
              >
                View Beds
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Availability Message */}
          {!canReserveBedroom && (bedroom.pricingMode === 'per_bedroom' || bedroom.pricingMode === 'both') && (
            <p className="text-xs text-muted-foreground text-center italic">
              Bedroom not available - beds already reserved
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const BedroomCard = memo(BedroomCardComponent);
