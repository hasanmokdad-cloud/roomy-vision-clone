import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { WizardRoomData } from './RoomNamesStep';

interface RoomCapacityStepProps {
  rooms: WizardRoomData[];
  selectedIds: string[];
  onChange: (rooms: WizardRoomData[]) => void;
}

// Check if room type has auto-capacity
function hasAutoCapacity(type: string): boolean {
  const t = type?.toLowerCase() || '';
  return t.includes('single') || t.includes('double') || t.includes('triple') || t.includes('quadruple');
}

export function RoomCapacityStep({ rooms, selectedIds, onChange }: RoomCapacityStepProps) {
  // Filter to only show selected rooms that need manual capacity
  const roomsNeedingCapacity = rooms.filter(
    r => selectedIds.includes(r.id) && !hasAutoCapacity(r.type)
  );

  const updateCapacity = (roomId: string, capacity: number) => {
    const updated = rooms.map(room =>
      room.id === roomId ? { ...room, capacity } : room
    );
    onChange(updated);
  };

  if (roomsNeedingCapacity.length === 0) {
    return (
      <div className="px-6 pt-24 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Capacity set automatically
          </h1>
          <p className="text-muted-foreground">
            All selected rooms have standard types with automatic capacity.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Set room capacity
        </h1>
        <p className="text-muted-foreground">
          How many students can each room accommodate?
        </p>
      </motion.div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-3 pr-4">
          {roomsNeedingCapacity.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-foreground block truncate">
                    {room.name || `Room`}
                  </span>
                  {room.type && (
                    <Badge variant="outline" className="text-xs">
                      {room.type}
                    </Badge>
                  )}
                </div>
              </div>

              <Select
                value={room.capacity?.toString() || ''}
                onValueChange={(v) => updateCapacity(room.id, parseInt(v))}
              >
                <SelectTrigger className="w-24 h-10 rounded-xl">
                  <SelectValue placeholder="Cap" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'person' : 'people'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
