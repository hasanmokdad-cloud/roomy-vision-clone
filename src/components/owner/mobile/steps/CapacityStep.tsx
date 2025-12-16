import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CapacityStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function CapacityStep({ value, onChange }: CapacityStepProps) {
  const handleDecrement = () => {
    if (value > 1) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < 100) onChange(value + 1);
  };

  return (
    <div className="px-6 pt-24 pb-32 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
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
        className="flex items-center gap-8"
      >
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={value <= 1}
          className="w-16 h-16 rounded-full border-2 hover:bg-muted"
        >
          <Minus className="w-6 h-6" />
        </Button>

        <motion.div
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 flex items-center justify-center"
        >
          <span className="text-6xl font-bold text-foreground">{value}</span>
        </motion.div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={value >= 100}
          className="w-16 h-16 rounded-full border-2 hover:bg-muted"
        >
          <Plus className="w-6 h-6" />
        </Button>
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
