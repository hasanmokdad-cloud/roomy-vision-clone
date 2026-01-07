import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BedDouble, DoorOpen } from 'lucide-react';
import { BedCard } from './BedCard';
import type { BedroomData } from '@/hooks/useApartmentDetails';
import type { AvailabilityState } from '@/utils/apartmentAvailability';

interface BedListViewProps {
  bedroom: BedroomData;
  availability: AvailabilityState;
  onBack: () => void;
  onReserve?: (bedId: string) => void;
}

const BedListViewComponent = ({
  bedroom,
  availability,
  onBack,
  onReserve,
}: BedListViewProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bedrooms
        </Button>
        <div className="flex items-center gap-2">
          <DoorOpen className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{bedroom.name}</span>
          <span className="text-muted-foreground">/</span>
          <BedDouble className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Beds</h2>
          <span className="text-muted-foreground">
            — {bedroom.beds.length} {bedroom.beds.length === 1 ? 'Bed' : 'Beds'}
          </span>
        </div>
      </div>

      {/* Beds Grid */}
      <AnimatePresence mode="wait">
        {bedroom.beds.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 glass rounded-2xl"
          >
            <BedDouble className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No beds configured</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {bedroom.beds.map((bed, index) => {
              const canReserve = availability.canReserveBed[bed.id] ?? false;

              return (
                <BedCard
                  key={bed.id}
                  bed={{
                    ...bed,
                    monthlyPrice: bed.monthlyPrice ?? bedroom.bedPrice ?? undefined,
                    deposit: bed.deposit ?? bedroom.bedDeposit ?? undefined,
                  }}
                  canReserve={canReserve}
                  index={index}
                  onReserve={() => onReserve?.(bed.id)}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bedroom Info */}
      <div className="glass rounded-xl p-4 text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> Bed type labels ({bedroom.bedType}) are descriptive only and do not affect capacity.
          Capacity is defined by the property owner.
        </p>
      </div>
    </div>
  );
};

export const BedListView = memo(BedListViewComponent);
