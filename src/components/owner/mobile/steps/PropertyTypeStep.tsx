import { motion } from 'framer-motion';
import { Building2, Building, Layers } from 'lucide-react';

interface PropertyTypeStepProps {
  value: string;
  onChange: (value: string) => void;
}

const propertyTypes = [
  { 
    id: 'dorm', 
    label: 'Dorm Building', 
    icon: Building2, 
    description: 'Stand-alone dorm with private rooms' 
  },
  { 
    id: 'apartment', 
    label: 'Apartment Building', 
    icon: Building, 
    description: 'Building with multiple apartments' 
  },
  { 
    id: 'hybrid', 
    label: 'Hybrid', 
    icon: Layers, 
    description: 'Dorm building with rooms and apartments' 
  },
];

export function PropertyTypeStep({ value, onChange }: PropertyTypeStepProps) {
  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          What type of accommodation do you offer?
        </h1>
        <p className="text-muted-foreground">
          This helps us customize your listing experience
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4">
        {propertyTypes.map((type, index) => (
          <motion.button
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onChange(type.id)}
            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
              value === type.id
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <type.icon 
              className={`w-10 h-10 flex-shrink-0 ${
                value === type.id ? 'text-primary' : 'text-muted-foreground'
              }`} 
            />
            <div>
              <span className={`font-semibold text-base block ${
                value === type.id ? 'text-primary' : 'text-foreground'
              }`}>
                {type.label}
              </span>
              <span className="text-sm text-muted-foreground">
                {type.description}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
