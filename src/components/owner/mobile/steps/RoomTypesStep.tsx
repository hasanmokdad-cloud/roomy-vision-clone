import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ownerRoomTypes } from '@/data/roomTypes';
import { WizardRoomData } from './RoomNamesStep';
import { Check } from 'lucide-react';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkType, setBulkType] = useState('');
  const [applied, setApplied] = useState(false);

  const selectedCount = selectedIds.length;

  const toggleRoom = (roomId: string) => {
    setSelectedIds(prev =>
      prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const selectAll = () => setSelectedIds(rooms.map(r => r.id));
  const deselectAll = () => setSelectedIds([]);

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

  const applyToAll = (type: string) => {
    const autoCapacity = getCapacityFromType(type);
    const updated = rooms.map(room => ({
      ...room,
      type,
      capacity: autoCapacity ?? room.capacity
    }));
    onChange(updated);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const applyToSelected = () => {
    if (!bulkType || selectedIds.length === 0) return;
    const autoCapacity = getCapacityFromType(bulkType);
    const updated = rooms.map(room =>
      selectedIds.includes(room.id) 
        ? { ...room, type: bulkType, capacity: autoCapacity ?? room.capacity } 
        : room
    );
    onChange(updated);
    setSelectedIds([]);
    setBulkType('');
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
            What type are your rooms?
          </h1>
          <p className="text-muted-foreground">
            Assign a room type to each room
          </p>
        </motion.div>

      {/* Bulk operations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4 space-y-3"
      >
        {/* Apply to all */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Apply to all:</span>
          <Select onValueChange={applyToAll}>
            <SelectTrigger className="flex-1 h-10 rounded-xl">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {ownerRoomTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selection controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            className="rounded-lg text-xs"
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deselectAll}
            className="rounded-lg text-xs"
          >
            Deselect All
          </Button>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedCount} selected
            </Badge>
          )}
        </div>

        {/* Apply to selected */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Apply to selected:</span>
          <Select value={bulkType} onValueChange={setBulkType}>
            <SelectTrigger className="flex-1 h-10 rounded-xl">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {ownerRoomTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={applyToSelected}
            disabled={!bulkType || selectedIds.length === 0}
            size="sm"
            className="rounded-lg gap-1"
          >
            {applied ? <Check className="w-4 h-4" /> : 'Apply'}
          </Button>
        </div>
      </motion.div>

        <ScrollArea className="h-[calc(100vh-420px)]">
          <div className="space-y-3 pr-4">
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
              >
                <Checkbox
                  checked={selectedIds.includes(room.id)}
                  onCheckedChange={() => toggleRoom(room.id)}
                  className="h-5 w-5"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-foreground block truncate">
                    {room.name || `Room ${index + 1}`}
                  </span>
                </div>
                <Select
                  value={room.type || ''}
                  onValueChange={(v) => updateRoomType(index, v)}
                >
                  <SelectTrigger className="w-32 h-10 rounded-xl">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ownerRoomTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
