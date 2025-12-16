import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Clock, Volume2, VolumeX, Volume1, Sparkles, Home, Smile } from 'lucide-react';

interface LivingHabitsStepProps {
  data: {
    personality_sleep_schedule: string;
    personality_noise_tolerance: string;
    personality_cleanliness_level: string;
  };
  onChange: (data: Partial<LivingHabitsStepProps['data']>) => void;
}

const LivingHabitsStep = ({ data, onChange }: LivingHabitsStepProps) => {
  const sleepOptions = [
    { value: 'early_bird', label: 'Early bird', icon: Sun, description: 'I sleep early, wake early' },
    { value: 'night_owl', label: 'Night owl', icon: Moon, description: 'I stay up late' },
    { value: 'flexible', label: 'Flexible', icon: Clock, description: 'Depends on the day' }
  ];

  const noiseOptions = [
    { value: 'quiet', label: 'Quiet', icon: VolumeX, description: 'I prefer silence' },
    { value: 'some_noise', label: 'Some noise', icon: Volume1, description: 'Background noise is fine' },
    { value: 'dont_mind', label: "Don't mind", icon: Volume2, description: 'Noise doesn\'t bother me' }
  ];

  const cleanlinessOptions = [
    { value: 'very_tidy', label: 'Very tidy', icon: Sparkles, description: 'Everything in its place' },
    { value: 'average', label: 'Average', icon: Home, description: 'Clean but relaxed' },
    { value: 'relaxed', label: 'Relaxed', icon: Smile, description: 'Organized chaos' }
  ];

  const renderOptions = (
    options: typeof sleepOptions,
    field: keyof LivingHabitsStepProps['data'],
    value: string
  ) => (
    <div className="grid grid-cols-1 gap-2">
      {options.map((option) => (
        <motion.button
          key={option.value}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange({ [field]: option.value })}
          className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
            value === option.value
              ? 'border-primary bg-primary/5'
              : 'border-border bg-background hover:border-primary/50'
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            value === option.value ? 'bg-primary/10' : 'bg-muted'
          }`}>
            <option.icon className={`w-6 h-6 ${
              value === option.value ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          <div className="text-left">
            <span className="font-medium text-foreground block">{option.label}</span>
            <span className="text-sm text-muted-foreground">{option.description}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );

  return (
    <div className="px-6 pt-20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Your living habits
        </h2>
        <p className="text-muted-foreground mb-8">
          This helps us find roommates with similar habits
        </p>

        {/* Sleep Schedule */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">Sleep schedule</Label>
          {renderOptions(sleepOptions, 'personality_sleep_schedule', data.personality_sleep_schedule)}
        </div>

        {/* Noise Tolerance */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">Noise tolerance</Label>
          {renderOptions(noiseOptions, 'personality_noise_tolerance', data.personality_noise_tolerance)}
        </div>

        {/* Cleanliness */}
        <div>
          <Label className="text-base font-medium mb-3 block">Cleanliness level</Label>
          {renderOptions(cleanlinessOptions, 'personality_cleanliness_level', data.personality_cleanliness_level)}
        </div>
      </motion.div>
    </div>
  );
};

export default LivingHabitsStep;
