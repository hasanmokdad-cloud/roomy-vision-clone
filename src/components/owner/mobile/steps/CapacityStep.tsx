import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CapacityStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function CapacityStep({ value, onChange }: CapacityStepProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input for typing
    if (inputValue === '') {
      onChange(0);
      return;
    }
    
    const numValue = parseInt(inputValue, 10);
    
    // Only update if it's a valid number within range
    if (!isNaN(numValue)) {
      // Clamp the value between 1 and 2000
      const clampedValue = Math.max(1, Math.min(2000, numValue));
      onChange(clampedValue);
    }
  };

  return (
    <div className="px-6 pt-24 pb-32 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 w-full"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          How many rooms does your dorm have?
        </h1>
        <p className="text-muted-foreground">
          This helps students know your dorm's size
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-xs"
      >
        <Label htmlFor="rooms" className="text-base font-medium text-center block mb-3">
          Number of Rooms
        </Label>
        <Input
          id="rooms"
          type="number"
          min={1}
          max={2000}
          value={value || ''}
          onChange={handleChange}
          placeholder="Enter number of rooms"
          className="h-16 text-3xl font-bold text-center"
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-muted-foreground mt-8"
      >
        {value === 1 ? '1 room' : `${value} rooms`}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 p-4 rounded-xl bg-primary/5 border border-primary/20"
      >
        <p className="text-sm text-center text-muted-foreground">
          💡 You can add individual room details later from your dashboard
        </p>
      </motion.div>
    </div>
  );
}
