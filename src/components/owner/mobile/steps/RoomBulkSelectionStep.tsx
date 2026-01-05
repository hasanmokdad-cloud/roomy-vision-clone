import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square } from 'lucide-react';
import { WizardRoomData } from './RoomNamesStep';

interface RoomBulkSelectionStepProps {
  rooms: WizardRoomData[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  title?: string;
  subtitle?: string;
}

export function RoomBulkSelectionStep({
  rooms,
  selectedIds,
  onSelectionChange,
  title = "Select rooms to update",
  subtitle = "Use filters to quickly select groups of rooms"
}: RoomBulkSelectionStepProps) {
  const uniqueTypes = useMemo(() => {
    const types = [...new Set(rooms.map(r => r.type).filter(Boolean))];
    return types.sort();
  }, [rooms]);

  const selectAll = () => {
    onSelectionChange(rooms.map(r => r.id));
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  const selectByType = (type: string) => {
    const matching = rooms.filter(r => r.type === type).map(r => r.id);
    onSelectionChange(matching);
  };

  const toggleRoom = (roomId: string) => {
    if (selectedIds.includes(roomId)) {
      onSelectionChange(selectedIds.filter(id => id !== roomId));
    } else {
      onSelectionChange([...selectedIds, roomId]);
    }
  };

  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {title}
        </h1>
        <p className="text-muted-foreground">
          {subtitle}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-4"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={selectAll}
          className="gap-2 rounded-xl"
        >
          <CheckSquare className="w-4 h-4" />
          Select All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={deselectAll}
          className="gap-2 rounded-xl"
        >
          <Square className="w-4 h-4" />
          Deselect All
        </Button>
        {uniqueTypes.length > 0 && (
          <Select onValueChange={selectByType}>
            <SelectTrigger className="w-36 h-9 rounded-xl">
              <SelectValue placeholder="By type" />
            </SelectTrigger>
            <SelectContent>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </motion.div>

      <Badge variant="secondary" className="mb-4">
        {selectedIds.length} of {rooms.length} selected
      </Badge>

      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-4">
          {rooms.map((room, index) => (
            <motion.button
              key={room.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => toggleRoom(room.id)}
              className={`relative bg-card border-2 rounded-xl p-3 text-left transition-all ${
                selectedIds.includes(room.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="absolute top-2 right-2">
                <Checkbox checked={selectedIds.includes(room.id)} />
              </div>
              <span className="font-semibold text-foreground block">
                {room.name || `Room ${index + 1}`}
              </span>
              {room.type && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {room.type}
                </Badge>
              )}
              {room.price && (
                <span className="text-xs text-muted-foreground mt-1 block">
                  ${room.price}/mo
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
