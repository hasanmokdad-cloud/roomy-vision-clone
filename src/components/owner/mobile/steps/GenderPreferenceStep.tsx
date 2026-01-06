import { motion } from 'framer-motion';
import { usePropertyTerminology } from '@/hooks/use-property-terminology';

interface GenderPreferenceStepProps {
  value: string;
  onChange: (value: string) => void;
  propertyType?: string;
}

const options = [
  { id: 'male', label: 'Male only', emoji: '👨', description: 'Only male students' },
  { id: 'female', label: 'Female only', emoji: '👩', description: 'Only female students' },
  { id: 'mixed', label: 'Mixed (Co-ed)', emoji: '👥', description: 'All students welcome' },
];

export function GenderPreferenceStep({ value, onChange, propertyType = 'dorm' }: GenderPreferenceStepProps) {
  const { dormLabel } = usePropertyTerminology(propertyType);
  
  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
            Who can stay in your {dormLabel}?
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
          {options.map((option, index) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onChange(option.id)}
              className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[100px] text-left ${
                value === option.id
                  ? 'border-foreground bg-background shadow-sm'
                  : 'border-border hover:border-foreground/50'
              }`}
            >
              <span className="text-2xl">{option.emoji}</span>
              <div className="flex flex-col items-start mt-2">
                <span className="font-medium text-sm text-foreground">
                  {option.label}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
