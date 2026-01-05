import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { WizardRoomData } from './RoomNamesStep';

interface RoomOccupancyStepProps {
  rooms: WizardRoomData[];
  onChange: (rooms: WizardRoomData[]) => void;
}

export function RoomOccupancyStep({ rooms, onChange }: RoomOccupancyStepProps) {
  const updateOccupancy = (index: number, occupied: number) => {
    const updated = [...rooms];
    updated[index] = { ...updated[index], capacity_occupied: occupied };
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
          Current occupancy
        </h1>
        <p className="text-muted-foreground">
          How many students currently occupy each room?
        </p>
      </motion.div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-3 pr-4">
          {rooms.map((room, index) => (
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
                    {room.name || `Room ${index + 1}`}
                  </span>
                  <div className="flex items-center gap-2">
                    {room.type && (
                      <Badge variant="outline" className="text-xs">
                        {room.type}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Capacity: {room.capacity || '?'}
                    </span>
                  </div>
                </div>
              </div>

              <Select
                value={room.capacity_occupied.toString()}
                onValueChange={(v) => updateOccupancy(index, parseInt(v))}
                disabled={!room.capacity}
              >
                <SelectTrigger className="w-24 h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {room.capacity ? (
                    Array.from({ length: (room.capacity || 0) + 1 }, (_, i) => i).map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} / {room.capacity}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="0">0</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
