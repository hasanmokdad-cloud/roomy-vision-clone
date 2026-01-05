import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Ruler, Check } from 'lucide-react';
import { WizardRoomData } from './RoomNamesStep';

interface RoomAreaStepProps {
  rooms: WizardRoomData[];
  selectedIds: string[];
  onChange: (rooms: WizardRoomData[]) => void;
}

export function RoomAreaStep({ rooms, selectedIds, onChange }: RoomAreaStepProps) {
  const [area, setArea] = useState('');
  const [applied, setApplied] = useState(false);

  const applyArea = () => {
    if (!area) return;
    const updated = rooms.map(room =>
      selectedIds.includes(room.id)
        ? { ...room, area_m2: parseFloat(area) }
        : room
    );
    onChange(updated);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const selectedCount = selectedIds.length;

  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Room dimensions
        </h1>
        <p className="text-muted-foreground">
          Set the area in square meters for {selectedCount} selected room{selectedCount !== 1 ? 's' : ''}
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
            Area (m²)
          </Label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.1"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g., 15"
                className="pl-9 h-12 rounded-xl text-lg"
              />
            </div>
            <Button
              onClick={applyArea}
              disabled={!area || selectedCount === 0}
              className="h-12 px-6 rounded-xl gap-2"
            >
              {applied ? <Check className="w-4 h-4" /> : 'Apply'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Common sizes: 12m² (small), 15m² (medium), 20m² (large)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {rooms.filter(r => selectedIds.includes(r.id)).slice(0, 6).map(room => (
            <Badge key={room.id} variant="secondary" className="text-xs">
              {room.name || room.id.slice(0, 4)} {room.area_m2 ? `- ${room.area_m2}m²` : ''}
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
