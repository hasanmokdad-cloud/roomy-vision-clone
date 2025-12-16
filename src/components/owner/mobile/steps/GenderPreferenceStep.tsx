import { motion } from 'framer-motion';

interface GenderPreferenceStepProps {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  { id: 'male', label: 'Male only', emoji: '👨', description: 'Only male students' },
  { id: 'female', label: 'Female only', emoji: '👩', description: 'Only female students' },
  { id: 'mixed', label: 'Mixed (Co-ed)', emoji: '👥', description: 'All students welcome' },
];

export function GenderPreferenceStep({ value, onChange }: GenderPreferenceStepProps) {
  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Who can stay in your dorm?
        </h1>
        <p className="text-muted-foreground">
          This helps match you with the right students
        </p>
      </motion.div>

      <div className="space-y-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onChange(option.id)}
            className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
              value === option.id
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <span className="text-4xl">{option.emoji}</span>
            <div className="text-left">
              <p className={`font-semibold text-lg ${
                value === option.id ? 'text-primary' : 'text-foreground'
              }`}>
                {option.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {option.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
