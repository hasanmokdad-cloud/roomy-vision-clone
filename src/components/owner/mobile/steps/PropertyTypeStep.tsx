import { motion } from 'framer-motion';
import { Building2, Home, Users, Building } from 'lucide-react';

interface PropertyTypeStepProps {
  value: string;
  onChange: (value: string) => void;
}

const propertyTypes = [
  { id: 'dormitory', label: 'Dormitory', icon: Building2, description: 'Traditional dorm building' },
  { id: 'student_residence', label: 'Student Residence', icon: Building, description: 'Dedicated student housing' },
  { id: 'shared_apartment', label: 'Shared Apartment', icon: Users, description: 'Shared living space' },
  { id: 'private_building', label: 'Private Building', icon: Home, description: 'Private rental property' },
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
          What best describes your property?
        </h1>
        <p className="text-muted-foreground">
          Choose the type that matches your dorm
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {propertyTypes.map((type, index) => (
          <motion.button
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onChange(type.id)}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
              value === type.id
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <type.icon 
              className={`w-10 h-10 mb-3 ${
                value === type.id ? 'text-primary' : 'text-muted-foreground'
              }`} 
            />
            <span className={`font-semibold text-sm text-center ${
              value === type.id ? 'text-primary' : 'text-foreground'
            }`}>
              {type.label}
            </span>
            <span className="text-xs text-muted-foreground text-center mt-1">
              {type.description}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
