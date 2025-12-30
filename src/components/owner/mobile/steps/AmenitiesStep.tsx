import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, UtensilsCrossed, WashingMachine, Thermometer, Snowflake, 
  BookOpen, Users, TreePine, Dumbbell, Waves,
  ShieldCheck, ArrowUpDown, Car, Brush, Dog, Sofa, Tv, Zap
} from 'lucide-react';
import { ElectricityOptionsModal } from './ElectricityOptionsModal';
import { TVOptionsModal } from './TVOptionsModal';
import { CleaningOptionsModal } from './CleaningOptionsModal';
import type { ElectricityOption, TVOption, CleaningOption, AmenityDetails } from '@/types/amenities';

interface AmenitiesStepProps {
  category: 'essentials' | 'shared' | 'safety';
  selectedAmenities: string[];
  onToggle: (amenity: string) => void;
  amenityDetails?: AmenityDetails;
  onUpdateAmenityDetails?: (details: AmenityDetails) => void;
}

const amenityCategories = {
  essentials: {
    title: 'What essentials does your dorm offer?',
    subtitle: 'Select all that apply',
    items: [
      { id: 'WiFi', label: 'WiFi', icon: Wifi },
      { id: 'Kitchen', label: 'Kitchen', icon: UtensilsCrossed },
      { id: 'Laundry', label: 'Laundry', icon: WashingMachine },
      { id: 'Heating', label: 'Heating', icon: Thermometer },
      { id: 'Air Conditioning', label: 'AC', icon: Snowflake },
      { id: 'Furnished', label: 'Furnished', icon: Sofa },
      { id: 'TV', label: 'TV', icon: Tv, hasOptions: true, optionType: 'tv' },
      { id: 'Electricity', label: 'Electricity', icon: Zap, hasOptions: true, optionType: 'electricity' },
    ],
  },
  shared: {
    title: 'Any shared spaces?',
    subtitle: 'Great for student life',
    items: [
      { id: 'Study Room', label: 'Study Room', icon: BookOpen },
      { id: 'Common Area', label: 'Common Area', icon: Users },
      { id: 'Garden', label: 'Garden', icon: TreePine },
      { id: 'Gym', label: 'Gym', icon: Dumbbell },
      { id: 'Pool', label: 'Pool', icon: Waves },
    ],
  },
  safety: {
    title: 'Safety & convenience features?',
    subtitle: 'These are important to students',
    items: [
      { id: 'Security', label: 'Security', icon: ShieldCheck },
      { id: 'Elevator', label: 'Elevator', icon: ArrowUpDown },
      { id: 'Parking', label: 'Parking', icon: Car },
      { id: 'Cleaning Service', label: 'Cleaning', icon: Brush, hasOptions: true, optionType: 'cleaning' },
      { id: 'Pet Friendly', label: 'Pet Friendly', icon: Dog },
    ],
  },
};

export function AmenitiesStep({ 
  category, 
  selectedAmenities, 
  onToggle, 
  amenityDetails = {},
  onUpdateAmenityDetails 
}: AmenitiesStepProps) {
  const categoryData = amenityCategories[category];
  const [electricityModalOpen, setElectricityModalOpen] = useState(false);
  const [tvModalOpen, setTvModalOpen] = useState(false);
  const [cleaningModalOpen, setCleaningModalOpen] = useState(false);

  const handleAmenityClick = (item: { id: string; label: string; hasOptions?: boolean; optionType?: string }) => {
    if (item.hasOptions && item.optionType) {
      // If already selected, toggle off
      if (selectedAmenities.includes(item.id)) {
        onToggle(item.id);
        return;
      }
      
      // Open options modal
      switch (item.optionType) {
        case 'electricity':
          setElectricityModalOpen(true);
          break;
        case 'tv':
          setTvModalOpen(true);
          break;
        case 'cleaning':
          setCleaningModalOpen(true);
          break;
      }
    } else {
      onToggle(item.id);
    }
  };

  const handleElectricitySave = (option: ElectricityOption) => {
    if (!selectedAmenities.includes('Electricity')) {
      onToggle('Electricity');
    }
    onUpdateAmenityDetails?.({ ...amenityDetails, electricity: option });
  };

  const handleTVSave = (option: TVOption) => {
    if (!selectedAmenities.includes('TV')) {
      onToggle('TV');
    }
    onUpdateAmenityDetails?.({ ...amenityDetails, tv: option });
  };

  const handleCleaningSave = (option: CleaningOption) => {
    if (!selectedAmenities.includes('Cleaning Service')) {
      onToggle('Cleaning Service');
    }
    onUpdateAmenityDetails?.({ ...amenityDetails, cleaning: option });
  };

  const getOptionLabel = (itemId: string): string | null => {
    switch (itemId) {
      case 'Electricity':
        if (amenityDetails.electricity) {
          return amenityDetails.electricity.type === '24/7' ? '24/7' : 'Custom';
        }
        break;
      case 'TV':
        if (amenityDetails.tv) {
          return amenityDetails.tv.type === '24/7' ? '24/7' : 'Custom';
        }
        break;
      case 'Cleaning Service':
        if (amenityDetails.cleaning) {
          const freq = amenityDetails.cleaning.frequency;
          if (freq === 'once') return '1x/week';
          if (freq === 'twice') return '2x/week';
          if (freq === 'three') return '3x/week';
          return 'Custom';
        }
        break;
    }
    return null;
  };

  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {categoryData.title}
        </h1>
        <p className="text-muted-foreground">
          {categoryData.subtitle}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {categoryData.items.map((item, index) => {
          const isSelected = selectedAmenities.includes(item.id);
          const optionLabel = getOptionLabel(item.id);
          
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleAmenityClick(item)}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <item.icon 
                className={`w-8 h-8 mb-2 ${
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                }`} 
              />
              <span className={`font-medium text-sm ${
                isSelected ? 'text-primary' : 'text-foreground'
              }`}>
                {item.label}
              </span>
              {isSelected && optionLabel && (
                <span className="text-xs text-primary/70 mt-1">
                  {optionLabel}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-sm text-muted-foreground mt-6"
      >
        {selectedAmenities.length} selected
      </motion.p>

      {/* Option Modals */}
      <ElectricityOptionsModal
        open={electricityModalOpen}
        onOpenChange={setElectricityModalOpen}
        initialValue={amenityDetails.electricity}
        onSave={handleElectricitySave}
      />
      <TVOptionsModal
        open={tvModalOpen}
        onOpenChange={setTvModalOpen}
        initialValue={amenityDetails.tv}
        onSave={handleTVSave}
      />
      <CleaningOptionsModal
        open={cleaningModalOpen}
        onOpenChange={setCleaningModalOpen}
        initialValue={amenityDetails.cleaning}
        onSave={handleCleaningSave}
      />
    </div>
  );
}
