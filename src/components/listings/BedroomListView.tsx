import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DoorOpen, Building2 } from 'lucide-react';
import { BedroomCard } from './BedroomCard';
import { BedListView } from './BedListView';
import type { ApartmentData, BedroomData, Reservation } from '@/hooks/useApartmentDetails';
import type { AvailabilityState } from '@/utils/apartmentAvailability';

interface BedroomListViewProps {
  apartment: ApartmentData;
  reservations: Reservation[];
  availability: AvailabilityState;
  onBack: () => void;
  onReserve?: (level: 'bedroom' | 'bed', id: string) => void;
}

const BedroomListViewComponent = ({
  apartment,
  reservations,
  availability,
  onBack,
  onReserve,
}: BedroomListViewProps) => {
  const [selectedBedroom, setSelectedBedroom] = useState<BedroomData | null>(null);

  // Show bed view for selected bedroom
  if (selectedBedroom) {
    return (
      <BedListView
        bedroom={selectedBedroom}
        availability={availability}
        onBack={() => setSelectedBedroom(null)}
        onReserve={(bedId) => onReserve?.('bed', bedId)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Apartments
        </Button>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{apartment.name}</span>
          <span className="text-muted-foreground">/</span>
          <DoorOpen className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Bedrooms</h2>
          <span className="text-muted-foreground">
            — {apartment.bedrooms.length} {apartment.bedrooms.length === 1 ? 'Bedroom' : 'Bedrooms'}
          </span>
        </div>
      </div>

      {/* Bedrooms Grid */}
      <AnimatePresence mode="wait">
        {apartment.bedrooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 glass rounded-2xl"
          >
            <DoorOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No bedrooms configured</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {apartment.bedrooms.map((bedroom, index) => {
              const canReserveBedroom = availability.canReserveBedroom[bedroom.id] ?? false;
              const canViewBeds = apartment.enableBedReservation && 
                bedroom.beds.some(bed => availability.canReserveBed[bed.id]);

              return (
                <BedroomCard
                  key={bedroom.id}
                  bedroom={bedroom}
                  beds={bedroom.beds}
                  canReserveBedroom={canReserveBedroom}
                  canViewBeds={canViewBeds}
                  index={index}
                  onReserveBedroom={() => onReserve?.('bedroom', bedroom.id)}
                  onViewBeds={() => setSelectedBedroom(bedroom)}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const BedroomListView = memo(BedroomListViewComponent);
