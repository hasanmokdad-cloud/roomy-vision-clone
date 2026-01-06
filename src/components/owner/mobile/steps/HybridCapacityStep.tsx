import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, Building2 } from 'lucide-react';

interface HybridCapacityStepProps {
  dormRoomCount: number;
  apartmentCount: number;
  onDormRoomCountChange: (value: number) => void;
  onApartmentCountChange: (value: number) => void;
}

export function HybridCapacityStep({ 
  dormRoomCount, 
  apartmentCount, 
  onDormRoomCountChange, 
  onApartmentCountChange 
}: HybridCapacityStepProps) {
  
  const handleDormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      onDormRoomCountChange(0);
      return;
    }
    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(0, Math.min(1000, numValue));
      onDormRoomCountChange(clampedValue);
    }
  };

  const handleApartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      onApartmentCountChange(0);
      return;
    }
    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(0, Math.min(1000, numValue));
      onApartmentCountChange(clampedValue);
    }
  };

  const totalUnits = dormRoomCount + apartmentCount;

  return (
    <div className="px-6 pt-24 pb-32 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 w-full"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Tell us about your hybrid property
        </h1>
        <p className="text-muted-foreground">
          Enter the number of each unit type
        </p>
      </motion.div>

      <div className="w-full max-w-sm space-y-6">
        {/* Dorm Rooms Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border-2 border-border bg-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Home className="w-5 h-5 text-primary" />
            </div>
            <Label htmlFor="dorm-rooms" className="text-base font-medium">
              Stand-alone Dorm Rooms
            </Label>
          </div>
          <Input
            id="dorm-rooms"
            type="number"
            min={0}
            max={1000}
            value={dormRoomCount || ''}
            onChange={handleDormChange}
            placeholder="0"
            className="h-14 text-2xl font-bold text-center"
          />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Individual rooms for single or shared occupancy
          </p>
        </motion.div>

        {/* Apartments Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl border-2 border-border bg-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-secondary" />
            </div>
            <Label htmlFor="apartments" className="text-base font-medium">
              Apartments
            </Label>
          </div>
          <Input
            id="apartments"
            type="number"
            min={0}
            max={1000}
            value={apartmentCount || ''}
            onChange={handleApartmentChange}
            placeholder="0"
            className="h-14 text-2xl font-bold text-center"
          />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Multi-room units with their own facilities
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center mt-8 p-4 rounded-lg bg-muted/50"
      >
        <p className="text-sm text-muted-foreground">
          Total units: <span className="font-bold text-foreground">{totalUnits}</span>
        </p>
        {totalUnits > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {dormRoomCount > 0 && `${dormRoomCount} dorm room${dormRoomCount !== 1 ? 's' : ''}`}
            {dormRoomCount > 0 && apartmentCount > 0 && ' + '}
            {apartmentCount > 0 && `${apartmentCount} apartment${apartmentCount !== 1 ? 's' : ''}`}
          </p>
        )}
      </motion.div>
    </div>
  );
}
