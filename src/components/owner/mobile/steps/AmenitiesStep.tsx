import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, UtensilsCrossed, WashingMachine, Thermometer, Snowflake, 
  BookOpen, Users, TreePine, Dumbbell, Waves,
  ShieldCheck, ArrowUpDown, Car, Brush, Dog, Sofa, Tv, Zap, Droplets
} from 'lucide-react';
import { ElectricityOptionsModal } from './ElectricityOptionsModal';
import { WiFiOptionsModal } from './WiFiOptionsModal';
import { CleaningOptionsModal } from './CleaningOptionsModal';
import { WaterOptionsModal } from './WaterOptionsModal';
import type { ElectricityOption, WiFiOption, CleaningOption, WaterOption, AmenityDetails } from '@/types/amenities';

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
      { id: 'WiFi', label: 'WiFi', icon: Wifi, hasOptions: true, optionType: 'wifi' },
      { id: 'Kitchen', label: 'Kitchen', icon: UtensilsCrossed },
      { id: 'Laundry', label: 'Laundry', icon: WashingMachine },
      { id: 'Heating', label: 'Heating', icon: Thermometer },
      { id: 'Air Conditioning', label: 'AC', icon: Snowflake },
      { id: 'Furnished', label: 'Furnished', icon: Sofa },
      { id: 'TV', label: 'TV', icon: Tv },
      { id: 'Electricity', label: 'Electricity', icon: Zap, hasOptions: true, optionType: 'electricity' },
      { id: 'Water', label: 'Water', icon: Droplets, hasOptions: true, optionType: 'water' },
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
  const [wifiModalOpen, setWifiModalOpen] = useState(false);
  const [cleaningModalOpen, setCleaningModalOpen] = useState(false);
  const [waterModalOpen, setWaterModalOpen] = useState(false);

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
        case 'wifi':
          setWifiModalOpen(true);
          break;
        case 'cleaning':
          setCleaningModalOpen(true);
          break;
        case 'water':
          setWaterModalOpen(true);
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

  const handleWiFiSave = (option: WiFiOption) => {
    if (!selectedAmenities.includes('WiFi')) {
      onToggle('WiFi');
    }
    onUpdateAmenityDetails?.({ ...amenityDetails, wifi: option });
  };

  const handleCleaningSave = (option: CleaningOption) => {
    if (!selectedAmenities.includes('Cleaning Service')) {
      onToggle('Cleaning Service');
    }
    onUpdateAmenityDetails?.({ ...amenityDetails, cleaning: option });
  };

  const handleWaterSave = (option: WaterOption) => {
    if (!selectedAmenities.includes('Water')) {
      onToggle('Water');
    }
    onUpdateAmenityDetails?.({ ...amenityDetails, water: option });
  };

  const getOptionLabel = (itemId: string): string | null => {
    switch (itemId) {
      case 'Electricity':
        if (amenityDetails.electricity) {
          return amenityDetails.electricity.included === 'yes' ? 'Included' : 'Not incl.';
        }
        break;
      case 'WiFi':
        if (amenityDetails.wifi) {
          return amenityDetails.wifi.included === 'yes' ? 'Included' : 'Not incl.';
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
      case 'Water':
        if (amenityDetails.water) {
          const type = amenityDetails.water.waterType === 'sweet' ? 'Sweet' : 'Salty';
          const hot = amenityDetails.water.hotWater === '24/7' ? '24/7' : 'Custom';
          return `${type}, ${hot}`;
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
      <WiFiOptionsModal
        open={wifiModalOpen}
        onOpenChange={setWifiModalOpen}
        initialValue={amenityDetails.wifi}
        onSave={handleWiFiSave}
      />
      <CleaningOptionsModal
        open={cleaningModalOpen}
        onOpenChange={setCleaningModalOpen}
        initialValue={amenityDetails.cleaning}
        onSave={handleCleaningSave}
      />
      <WaterOptionsModal
        open={waterModalOpen}
        onOpenChange={setWaterModalOpen}
        initialValue={amenityDetails.water}
        onSave={handleWaterSave}
      />
    </div>
  );
}
