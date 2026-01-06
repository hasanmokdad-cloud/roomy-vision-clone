import { 
  Wifi, UtensilsCrossed, WashingMachine, Thermometer, Snowflake, 
  BookOpen, Users, TreePine, Dumbbell, Waves,
  ShieldCheck, ArrowUpDown, Car, Brush, Dog, Sofa, Tv, Zap, Droplets,
  type LucideIcon
} from 'lucide-react';

export interface AmenityConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  hasOptions?: boolean;
  optionType?: 'electricity' | 'wifi' | 'cleaning' | 'water' | 'laundry';
}

export interface AmenityCategoryConfig {
  title: string;
  subtitle: string;
  items: AmenityConfig[];
}

export const AMENITIES_CONFIG: Record<string, AmenityCategoryConfig> = {
  essentials: {
    title: 'What essentials does your dorm offer?',
    subtitle: 'Select all that apply',
    items: [
      { id: 'WiFi', label: 'WiFi', icon: Wifi, hasOptions: true, optionType: 'wifi' },
      { id: 'Kitchen', label: 'Kitchen', icon: UtensilsCrossed },
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

export const ALL_AMENITIES: AmenityConfig[] = [
  ...AMENITIES_CONFIG.essentials.items,
  ...AMENITIES_CONFIG.shared.items,
  ...AMENITIES_CONFIG.safety.items,
];

export const AMENITIES_WITH_OPTIONS = ALL_AMENITIES.filter(a => a.hasOptions);

// Simple list of amenity IDs for legacy compatibility
export const AMENITIES_LIST = ALL_AMENITIES.map(a => a.id);
