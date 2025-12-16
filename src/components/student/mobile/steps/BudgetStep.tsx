import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { DollarSign, Bed, Users, Home, Building2 } from 'lucide-react';

interface BudgetStepProps {
  data: {
    budget: number;
    room_type: string;
  };
  onChange: (data: Partial<BudgetStepProps['data']>) => void;
}

const BudgetStep = ({ data, onChange }: BudgetStepProps) => {
  const budgetPresets = [200, 300, 400, 500];
  
  const roomTypeOptions = [
    { value: 'private', label: 'Private Room', icon: Bed, description: 'Your own space' },
    { value: 'shared', label: 'Shared Room', icon: Users, description: 'Share with roommate' },
    { value: 'studio', label: 'Studio', icon: Home, description: 'All-in-one space' },
    { value: 'apartment', label: 'Apartment', icon: Building2, description: 'Full apartment' }
  ];

  return (
    <div className="px-6 pt-20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Budget & room type
        </h2>
        <p className="text-muted-foreground mb-8">
          Find dorms that fit your budget
        </p>

        {/* Budget */}
        <div className="mb-8">
          <Label className="text-base font-medium mb-3 block">Monthly budget</Label>
          
          {/* Current value display */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <DollarSign className="w-8 h-8 text-primary" />
            <span className="text-5xl font-bold text-foreground">{data.budget}</span>
            <span className="text-muted-foreground text-lg">/mo</span>
          </div>

          {/* Slider */}
          <Slider
            value={[data.budget]}
            onValueChange={(value) => onChange({ budget: value[0] })}
            min={100}
            max={800}
            step={25}
            className="mb-4"
          />

          {/* Quick presets */}
          <div className="flex gap-2 justify-center">
            {budgetPresets.map((preset) => (
              <motion.button
                key={preset}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange({ budget: preset })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  data.budget === preset
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                ${preset}
              </motion.button>
            ))}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ budget: 600 })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                data.budget >= 500
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              $500+
            </motion.button>
          </div>
        </div>

        {/* Room Type */}
        <div>
          <Label className="text-base font-medium mb-3 block">Preferred room type</Label>
          <div className="grid grid-cols-2 gap-3">
            {roomTypeOptions.map((option) => (
              <motion.button
                key={option.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange({ room_type: option.value })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  data.room_type === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  data.room_type === option.value ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <option.icon className={`w-5 h-5 ${
                    data.room_type === option.value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <span className="font-medium text-foreground block">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BudgetStep;
