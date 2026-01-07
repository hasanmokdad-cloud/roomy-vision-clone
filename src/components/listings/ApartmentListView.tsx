import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';
import { ApartmentCard } from './ApartmentCard';
import { BedroomListView } from './BedroomListView';
import { useApartmentDetails } from '@/hooks/useApartmentDetails';
import { useMultipleApartmentAvailability } from '@/hooks/useApartmentAvailability';
import { Skeleton } from '@/components/ui/skeleton';

interface ApartmentListViewProps {
  buildingId: string;
  buildingName: string;
  onBack?: () => void;
  onReserve?: (level: 'apartment' | 'bedroom' | 'bed', id: string, apartmentId: string) => void;
}

const ApartmentListViewComponent = ({
  buildingId,
  buildingName,
  onBack,
  onReserve,
}: ApartmentListViewProps) => {
  const { apartments, reservations, loading, error } = useApartmentDetails(buildingId);
  const availabilityMap = useMultipleApartmentAvailability(apartments, reservations);
  
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);
  const selectedApartment = apartments.find(a => a.id === selectedApartmentId);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  // Show bedroom view for selected apartment
  if (selectedApartment) {
    const availability = availabilityMap.get(selectedApartment.id);
    return (
      <BedroomListView
        apartment={selectedApartment}
        reservations={reservations}
        availability={availability!}
        onBack={() => setSelectedApartmentId(null)}
        onReserve={(level, id) => onReserve?.(level, id, selectedApartment.id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">{buildingName}</h2>
          <span className="text-muted-foreground">
            — {apartments.length} {apartments.length === 1 ? 'Apartment' : 'Apartments'}
          </span>
        </div>
      </div>

      {/* Apartments Grid */}
      <AnimatePresence mode="wait">
        {apartments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 glass rounded-2xl"
          >
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No apartments available</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {apartments.map((apartment, index) => {
              const availability = availabilityMap.get(apartment.id);
              if (!availability) return null;

              return (
                <ApartmentCard
                  key={apartment.id}
                  apartment={apartment}
                  pricingTiers={apartment.pricingTiers}
                  bedroomCount={apartment.bedrooms.length}
                  availability={availability}
                  index={index}
                  onReserveApartment={() => onReserve?.('apartment', apartment.id, apartment.id)}
                  onViewBedrooms={() => setSelectedApartmentId(apartment.id)}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ApartmentListView = memo(ApartmentListViewComponent);
