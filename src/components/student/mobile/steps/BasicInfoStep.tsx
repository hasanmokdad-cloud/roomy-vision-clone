import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BasicInfoStepProps {
  data: {
    full_name: string;
    age: number;
    gender: string;
  };
  onChange: (data: Partial<BasicInfoStepProps['data']>) => void;
}

const BasicInfoStep = ({ data, onChange }: BasicInfoStepProps) => {
  const genderOptions = [
    { value: 'male', label: 'Male', emoji: '👨' },
    { value: 'female', label: 'Female', emoji: '👩' }
  ];

  return (
    <div className="px-6 pt-20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Tell us about yourself
        </h2>
        <p className="text-muted-foreground mb-8">
          This helps match you with compatible dorms and roommates
        </p>

        {/* Full Name */}
        <div className="mb-6">
          <Label htmlFor="fullName" className="text-base font-medium">
            Full name
          </Label>
          <Input
            id="fullName"
            value={data.full_name}
            onChange={(e) => onChange({ full_name: e.target.value })}
            placeholder="Enter your full name"
            className="mt-2 h-12 text-base"
          />
        </div>

        {/* Age */}
        <div className="mb-6">
          <Label className="text-base font-medium">Age</Label>
          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={() => onChange({ age: Math.max(16, data.age - 1) })}
              disabled={data.age <= 16}
            >
              <Minus className="w-5 h-5" />
            </Button>
            <span className="text-3xl font-bold text-foreground w-16 text-center">
              {data.age}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={() => onChange({ age: Math.min(99, data.age + 1) })}
              disabled={data.age >= 99}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Gender */}
        <div>
          <Label className="text-base font-medium">Gender</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {genderOptions.map((option) => (
              <motion.button
                key={option.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange({ gender: option.value })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  data.gender === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <span className="text-3xl mb-2 block">{option.emoji}</span>
                <span className="font-medium text-foreground">{option.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BasicInfoStep;
