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
import { LaundryOptionsModal } from './LaundryOptionsModal';
import type { 
  ElectricityOption, WiFiOption, CleaningOption, WaterOption, LaundryOption, AmenityDetails,
  formatElectricityOption, formatLaundryOption 
} from '@/types/amenities';
import { usePropertyTerminology } from '@/hooks/use-property-terminology';

interface AmenitiesStepProps {
  category: 'essentials' | 'shared' | 'safety';
  selectedAmenities: string[];
  onToggle: (amenity: string) => void;
  amenityDetails?: AmenityDetails;
  onUpdateAmenityDetails?: (details: AmenityDetails) => void;
  propertyType?: string;
}

export function AmenitiesStep({ 
  category, 
  selectedAmenities, 
  onToggle, 
  amenityDetails = {},
  onUpdateAmenityDetails,
  propertyType = 'dorm'
}: AmenitiesStepProps) {
  const { dormLabel } = usePropertyTerminology(propertyType);
  
  const amenityCategories = {
    essentials: {
      title: `What essentials does your ${dormLabel} offer?`,
      subtitle: 'Select all that apply',
      items: [
        { id: 'WiFi', label: 'WiFi', icon: Wifi, hasOptions: true, optionType: 'wifi' },
        { id: 'Kitchenette', label: 'Kitchenette', icon: UtensilsCrossed },
        { id: 'Laundry', label: 'Laundry', icon: WashingMachine, hasOptions: true, optionType: 'laundry' },
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

  const categoryData = amenityCategories[category];
  const [electricityModalOpen, setElectricityModalOpen] = useState(false);
  const [wifiModalOpen, setWifiModalOpen] = useState(false);
  const [cleaningModalOpen, setCleaningModalOpen] = useState(false);
  const [waterModalOpen, setWaterModalOpen] = useState(false);
  const [laundryModalOpen, setLaundryModalOpen] = useState(false);

  const handleAmenityClick = (item: { id: string; label: string; hasOptions?: boolean; optionType?: string }) => {
    if (item.hasOptions && item.optionType) {
      // Always open modal for amenities with options (for both selecting and editing)
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
        case 'laundry':
          setLaundryModalOpen(true);
          break;
      }
    } else {
      onToggle(item.id);
    }
  };

  // Remove handlers for amenities with options
  const handleElectricityRemove = () => {
    if (selectedAmenities.includes('Electricity')) {
      onToggle('Electricity');
    }
    const newDetails = { ...amenityDetails };
    delete newDetails.electricity;
    onUpdateAmenityDetails?.(newDetails);
    setElectricityModalOpen(false);
  };

  const handleWiFiRemove = () => {
    if (selectedAmenities.includes('WiFi')) {
      onToggle('WiFi');
    }
    const newDetails = { ...amenityDetails };
    delete newDetails.wifi;
    onUpdateAmenityDetails?.(newDetails);
    setWifiModalOpen(false);
  };

  const handleCleaningRemove = () => {
    if (selectedAmenities.includes('Cleaning Service')) {
      onToggle('Cleaning Service');
    }
    const newDetails = { ...amenityDetails };
    delete newDetails.cleaning;
    onUpdateAmenityDetails?.(newDetails);
    setCleaningModalOpen(false);
  };

  const handleWaterRemove = () => {
    if (selectedAmenities.includes('Water')) {
      onToggle('Water');
    }
    const newDetails = { ...amenityDetails };
    delete newDetails.water;
    onUpdateAmenityDetails?.(newDetails);
    setWaterModalOpen(false);
  };

  const handleLaundryRemove = () => {
    if (selectedAmenities.includes('Laundry')) {
      onToggle('Laundry');
    }
    const newDetails = { ...amenityDetails };
    delete newDetails.laundry;
    onUpdateAmenityDetails?.(newDetails);
    setLaundryModalOpen(false);
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

  const handleLaundrySave = (option: LaundryOption) => {
    if (!selectedAmenities.includes('Laundry')) {
      onToggle('Laundry');
    }
    onUpdateAmenityDetails?.({ ...amenityDetails, laundry: option });
  };

  const getOptionLabel = (itemId: string): string | null => {
    switch (itemId) {
      case 'Electricity':
        if (amenityDetails.electricity) {
          const e = amenityDetails.electricity;
          const avail = e.availability === '24/7' ? '24/7' : 'Ltd';
          const bill = e.included === 'yes' ? 'Incl.' : 'Sep.';
          return `${avail}, ${bill}`;
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
      case 'Laundry':
        if (amenityDetails.laundry) {
          const machines = [];
          if (amenityDetails.laundry.washingMachine) machines.push('W');
          if (amenityDetails.laundry.dryingMachine) machines.push('D');
          const billing = amenityDetails.laundry.billing === 'included' ? 'Incl.' : 'Per use';
          return `${machines.join('+')} (${billing})`;
        }
        break;
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
            {categoryData.title}
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            You can add more amenities after you submit your listing.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {categoryData.items.map((item, index) => {
            const isSelected = selectedAmenities.includes(item.id);
            const optionLabel = getOptionLabel(item.id);
            
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleAmenityClick(item)}
                className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[90px] lg:min-h-[100px] text-left ${
                  isSelected
                    ? 'border-foreground bg-background shadow-sm'
                    : 'border-border hover:border-foreground/50'
                }`}
              >
                <item.icon className="w-6 h-6 text-foreground" />
                <div className="flex flex-col items-start mt-2">
                  <span className="font-medium text-sm text-foreground">
                    {item.label}
                  </span>
                  {isSelected && optionLabel && (
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {optionLabel}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Option Modals */}
      <ElectricityOptionsModal
        open={electricityModalOpen}
        onOpenChange={setElectricityModalOpen}
        initialValue={amenityDetails.electricity}
        onSave={handleElectricitySave}
        isSelected={selectedAmenities.includes('Electricity')}
        onRemove={handleElectricityRemove}
      />
      <WiFiOptionsModal
        open={wifiModalOpen}
        onOpenChange={setWifiModalOpen}
        initialValue={amenityDetails.wifi}
        onSave={handleWiFiSave}
        isSelected={selectedAmenities.includes('WiFi')}
        onRemove={handleWiFiRemove}
      />
      <CleaningOptionsModal
        open={cleaningModalOpen}
        onOpenChange={setCleaningModalOpen}
        initialValue={amenityDetails.cleaning}
        onSave={handleCleaningSave}
        isSelected={selectedAmenities.includes('Cleaning Service')}
        onRemove={handleCleaningRemove}
      />
      <WaterOptionsModal
        open={waterModalOpen}
        onOpenChange={setWaterModalOpen}
        initialValue={amenityDetails.water}
        onSave={handleWaterSave}
        isSelected={selectedAmenities.includes('Water')}
        onRemove={handleWaterRemove}
      />
      <LaundryOptionsModal
        open={laundryModalOpen}
        onOpenChange={setLaundryModalOpen}
        initialValue={amenityDetails.laundry}
        onSave={handleLaundrySave}
        isSelected={selectedAmenities.includes('Laundry')}
        onRemove={handleLaundryRemove}
      />
    </div>
  );
}
