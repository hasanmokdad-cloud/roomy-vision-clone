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
    { value: 'Male', label: 'Male', emoji: '👨' },
    { value: 'Female', label: 'Female', emoji: '👩' }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-10">
            <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
              Tell us about yourself
            </h1>
            <p className="text-muted-foreground mt-2">
              This helps match you with compatible dorms and roommates
            </p>
          </div>

          {/* Full Name */}
          <div className="mb-8">
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
          <div className="mb-8">
            <Label className="text-base font-medium">Age</Label>
            <div className="flex items-center justify-center gap-4 mt-2">
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
    </div>
  );
};

export default BasicInfoStep;
