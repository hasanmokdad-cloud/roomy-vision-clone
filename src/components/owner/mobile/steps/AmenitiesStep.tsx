import { motion } from 'framer-motion';
import { 
  Wifi, UtensilsCrossed, WashingMachine, Thermometer, Snowflake, 
  BookOpen, Users, TreePine, Dumbbell, Waves,
  ShieldCheck, Building2, Car, Sparkles, Dog
} from 'lucide-react';

interface AmenitiesStepProps {
  category: 'essentials' | 'shared' | 'safety';
  selectedAmenities: string[];
  onToggle: (amenity: string) => void;
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
      { id: 'Furnished', label: 'Furnished', icon: Building2 },
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
      { id: 'Elevator', label: 'Elevator', icon: Building2 },
      { id: 'Parking', label: 'Parking', icon: Car },
      { id: 'Cleaning Service', label: 'Cleaning', icon: Sparkles },
      { id: 'Pet Friendly', label: 'Pet Friendly', icon: Dog },
    ],
  },
};

export function AmenitiesStep({ category, selectedAmenities, onToggle }: AmenitiesStepProps) {
  const categoryData = amenityCategories[category];

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
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onToggle(item.id)}
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
    </div>
  );
}
