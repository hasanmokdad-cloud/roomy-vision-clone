import { 
  Wifi, Car, Snowflake, Dumbbell, ShieldCheck, UtensilsCrossed, 
  BookOpen, Users, Zap, Droplets, Armchair, 
  PawPrint, Sparkles, Waves, Flower2, DoorOpen, Home, Tv, 
  WashingMachine, Fan, Bath, Lock, Wind, Bed, Plug, Gamepad2,
  Baby, Cigarette, Mountain, Thermometer, Phone, Lamp, 
  SquareStack, Microwave, Coffee, Shirt, Flame, AlertTriangle,
  Package, Sofa, ArrowUpDown, Brush, type LucideIcon
} from 'lucide-react';

// Comprehensive amenity icon map matching AirbnbFiltersModal icons
export const amenityIconMap: Record<string, LucideIcon> = {
  // Popular
  'wifi': Wifi,
  'internet': Wifi,
  'wi-fi': Wifi,
  
  // Parking
  'parking': Car,
  'car park': Car,
  'garage': Car,
  
  // Climate
  'air conditioning': Snowflake,
  'ac': Snowflake,
  'a/c': Snowflake,
  'cooling': Snowflake,
  'heating': Zap,
  'heater': Thermometer,
  'central heating': Thermometer,
  
  // Essentials
  'laundry': Droplets,
  'washer': WashingMachine,
  'washing machine': WashingMachine,
  'dryer': Wind,
  'kitchen': UtensilsCrossed,
  'kitchenette': UtensilsCrossed,
  'furnished': Sofa,
  'fully furnished': Sofa,
  'electricity': Zap,
  'power': Plug,
  'electricity included': Zap,
  
  // Facilities
  'gym': Dumbbell,
  'fitness center': Dumbbell,
  'fitness': Dumbbell,
  'study room': BookOpen,
  'study area': BookOpen,
  'study': BookOpen,
  'library': BookOpen,
  'common area': Users,
  'common room': Users,
  'shared space': Users,
  'lounge': Armchair,
  'elevator': ArrowUpDown,
  'lift': ArrowUpDown,
  'tv': Tv,
  'television': Tv,
  'cable tv': Tv,
  'entertainment': Gamepad2,
  'game room': Gamepad2,
  
  // Safety & Services
  'security': ShieldCheck,
  '24/7 security': ShieldCheck,
  'cctv': ShieldCheck,
  'guard': ShieldCheck,
  'cleaning service': Brush,
  'cleaning': Brush,
  'housekeeping': Brush,
  'maid service': Brush,
  'pet friendly': PawPrint,
  'pets allowed': PawPrint,
  'reception': Phone,
  '24/7 reception': Phone,
  
  // Outdoor
  'pool': Waves,
  'swimming pool': Waves,
  'garden': Flower2,
  'outdoor space': Flower2,
  'terrace': Mountain,
  'rooftop': Mountain,
  'balcony': DoorOpen,
  'patio': DoorOpen,
  
  // Bathroom
  'private bathroom': Bath,
  'bathroom': Bath,
  'shared bathroom': Bath,
  'ensuite': Bath,
  
  // Bedroom
  'bed': Bed,
  'single bed': Bed,
  'double bed': Bed,
  'bunk bed': Bed,
  
  // Other
  'fan': Fan,
  'ceiling fan': Fan,
  'locker': Lock,
  'safe': Lock,
  'storage': Package,
  'baby friendly': Baby,
  'family friendly': Baby,
  'no smoking': Cigarette,
  'smoking allowed': Cigarette,
  
  // Additional common dorm amenities
  'desk': Lamp,
  'work desk': Lamp,
  'study desk': Lamp,
  'closet': SquareStack,
  'wardrobe': SquareStack,
  'cupboard': SquareStack,
  'microwave': Microwave,
  'refrigerator': Snowflake,
  'mini fridge': Snowflake,
  'fridge': Snowflake,
  'coffee maker': Coffee,
  'kettle': Coffee,
  'iron': Shirt,
  'ironing': Shirt,
  'towels': Shirt,
  'linens': Bed,
  'bedding': Bed,
  'smoke detector': AlertTriangle,
  'fire extinguisher': Flame,
  'first aid': AlertTriangle,
  'first aid kit': AlertTriangle,
  'mirror': SquareStack,
};

/**
 * Get the Lucide icon component for a given amenity name
 * @param amenity - The amenity name (case-insensitive)
 * @returns The Lucide icon component
 */
export function getAmenityIcon(amenity: string): LucideIcon {
  const normalized = amenity.toLowerCase().trim();
  return amenityIconMap[normalized] || Home; // Default to Home icon
}

/**
 * Human-readable labels for amenities
 */
export const amenityLabels: Record<string, string> = {
  'wifi': 'WiFi',
  'ac': 'Air Conditioning',
  'air conditioning': 'Air Conditioning',
  'parking': 'Parking',
  'laundry': 'Laundry',
  'kitchen': 'Kitchen',
  'gym': 'Gym',
  'study room': 'Study Room',
  'security': 'Security',
  'cleaning service': 'Cleaning Service',
  'pool': 'Pool',
  'garden': 'Garden',
  'balcony': 'Balcony',
  'elevator': 'Elevator',
  'furnished': 'Furnished',
  'heating': 'Heating',
  'tv': 'TV',
  'private bathroom': 'Private Bathroom',
  'pet friendly': 'Pet Friendly',
};
