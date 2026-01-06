import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Check } from 'lucide-react';
import { WizardRoomData } from './RoomNamesStep';

interface RoomPricingStepProps {
  rooms: WizardRoomData[];
  selectedIds: string[];
  onChange: (rooms: WizardRoomData[]) => void;
}

export function RoomPricingStep({ rooms, selectedIds, onChange }: RoomPricingStepProps) {
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [priceApplied, setPriceApplied] = useState(false);
  const [depositApplied, setDepositApplied] = useState(false);

  // Show all rooms when none selected (editing mode)
  const effectiveSelectedIds = selectedIds.length > 0 ? selectedIds : rooms.map(r => r.id);

  const applyPrice = () => {
    if (!price) return;
    const updated = rooms.map(room =>
      effectiveSelectedIds.includes(room.id)
        ? { ...room, price: parseFloat(price) }
        : room
    );
    onChange(updated);
    setPriceApplied(true);
    setTimeout(() => setPriceApplied(false), 2000);
  };

  const applyDeposit = () => {
    if (!deposit) return;
    const updated = rooms.map(room =>
      effectiveSelectedIds.includes(room.id)
        ? { ...room, deposit: parseFloat(deposit) }
        : room
    );
    onChange(updated);
    setDepositApplied(true);
    setTimeout(() => setDepositApplied(false), 2000);
  };

  const selectedCount = effectiveSelectedIds.length;

  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Set pricing for selected rooms
        </h1>
        <p className="text-muted-foreground">
          Enter prices and apply to {selectedCount} room{selectedCount !== 1 ? 's' : ''}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <div className="bg-card border border-border rounded-2xl p-5">
          <Label className="text-base font-semibold mb-3 block">
            Monthly Price
          </Label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="pl-9 h-12 rounded-xl text-lg"
              />
            </div>
            <Button
              onClick={applyPrice}
              disabled={!price || selectedCount === 0}
              className="h-12 px-6 rounded-xl gap-2"
            >
              {priceApplied ? <Check className="w-4 h-4" /> : 'Apply'}
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <Label className="text-base font-semibold mb-3 block">
            Deposit
          </Label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="0"
                className="pl-9 h-12 rounded-xl text-lg"
              />
            </div>
            <Button
              onClick={applyDeposit}
              disabled={!deposit || selectedCount === 0}
              className="h-12 px-6 rounded-xl gap-2"
            >
              {depositApplied ? <Check className="w-4 h-4" /> : 'Apply'}
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-xl">
          <p className="font-medium mb-2">Tip:</p>
          <p>For Double/Triple rooms, you can set tiered pricing in the next step.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {rooms.filter(r => effectiveSelectedIds.includes(r.id)).slice(0, 6).map(room => (
            <Badge key={room.id} variant="secondary" className="text-xs">
              {room.name || room.id.slice(0, 4)} {room.price ? `- $${room.price}` : ''}
            </Badge>
          ))}
          {selectedCount > 6 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedCount - 6} more
            </Badge>
          )}
        </div>
      </motion.div>
    </div>
  );
}
