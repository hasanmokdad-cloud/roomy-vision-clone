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
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
            What type of accommodation do you offer?
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
          {propertyTypes.map((type, index) => (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onChange(type.id)}
              className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[100px] text-left ${
                value === type.id
                  ? 'border-foreground bg-background shadow-sm'
                  : 'border-border hover:border-foreground/50'
              }`}
            >
              <type.icon className="w-6 h-6 text-foreground" />
              <div className="flex flex-col items-start mt-2">
                <span className="font-medium text-sm text-foreground">
                  {type.label}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {type.description}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
