import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ownerRoomTypes } from '@/data/roomTypes';
import { WizardRoomData } from './RoomNamesStep';

interface RoomTypesStepProps {
  rooms: WizardRoomData[];
  onChange: (rooms: WizardRoomData[]) => void;
}

const getCapacityFromType = (type: string): number | null => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('suite') || lowerType.includes('studio')) return null;
  if (lowerType.includes('single')) return 1;
  if (lowerType.includes('double')) return 2;
  if (lowerType.includes('triple')) return 3;
  if (lowerType.includes('quadruple')) return 4;
  return null;
};

export function RoomTypesStep({ rooms, onChange }: RoomTypesStepProps) {
  const updateRoomType = (index: number, type: string) => {
    const updated = [...rooms];
    const autoCapacity = getCapacityFromType(type);
    updated[index] = {
      ...updated[index],
      type,
      capacity: autoCapacity ?? updated[index].capacity
    };
    onChange(updated);
  };

  const applyTypeToAll = (type: string) => {
    const autoCapacity = getCapacityFromType(type);
    const updated = rooms.map(room => ({
      ...room,
      type,
      capacity: autoCapacity ?? room.capacity
    }));
    onChange(updated);
  };

  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          What type are your rooms?
        </h1>
        <p className="text-muted-foreground">
          Assign a type to each room
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 mb-6"
      >
        <span className="text-sm text-muted-foreground">Apply to all:</span>
        <Select onValueChange={applyTypeToAll}>
          <SelectTrigger className="w-40 h-9 rounded-xl">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {ownerRoomTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-4">
          {rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <span className="font-semibold text-foreground">
                  {room.name || index + 1}
                </span>
              </div>
              <Select
                value={room.type}
                onValueChange={(v) => updateRoomType(index, v)}
              >
                <SelectTrigger className="flex-1 h-10 rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ownerRoomTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
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
