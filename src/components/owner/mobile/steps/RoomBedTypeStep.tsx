/**
 * Room Bed Type Step (Dorm Buildings)
 * Allows owners to set descriptive bed type for rooms
 * IMPORTANT: This is descriptive only and does NOT affect capacity
 */

import { motion } from 'framer-motion';
import { AlertTriangle, Bed, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WizardRoomData } from './RoomNamesStep';

interface RoomBedTypeStepProps {
  rooms: WizardRoomData[];
  onRoomsChange: (rooms: WizardRoomData[]) => void;
}

const BED_TYPES = [
  { value: 'single', label: 'Single Bed', description: 'Standard single bed' },
  { value: 'double', label: 'Double Bed', description: 'Double/full size bed' },
  { value: 'queen', label: 'Queen Bed', description: 'Queen size bed' },
  { value: 'king', label: 'King Bed', description: 'King size bed' },
  { value: 'bunk', label: 'Bunk Bed', description: 'Bunk bed (stacked)' },
  { value: 'sofa', label: 'Sofa Bed', description: 'Convertible sofa bed' },
] as const;

export function RoomBedTypeStep({ rooms, onRoomsChange }: RoomBedTypeStepProps) {
  const handleBedTypeChange = (roomId: string, bedType: string) => {
    const updatedRooms = rooms.map(room =>
      room.id === roomId ? { ...room, bedType } : room
    );
    onRoomsChange(updatedRooms);
  };

  const handleApplyToAll = (bedType: string) => {
    const updatedRooms = rooms.map(room => ({ ...room, bedType }));
    onRoomsChange(updatedRooms);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bed className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          What type of beds are in your rooms?
        </h2>
        <p className="text-sm text-muted-foreground">
          This is for display purposes only
        </p>
      </div>

      {/* Important Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800">
              Bed type does NOT affect capacity
            </p>
            <p className="text-xs text-amber-700">
              This is descriptive information shown to students. The actual capacity 
              (number of beds/students) is set separately by you.
            </p>
          </div>
        </div>
      </div>

      {/* Bulk Apply */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <Label className="text-sm font-medium">Apply to all rooms</Label>
        <Select onValueChange={handleApplyToAll}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select bed type for all rooms..." />
          </SelectTrigger>
          <SelectContent>
            {BED_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex flex-col">
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Individual Room Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Or set individually</Label>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-3 bg-background rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{room.name}</p>
                  <p className="text-xs text-muted-foreground">{room.type}</p>
                </div>
                <Select
                  value={room.bedType || 'single'}
                  onValueChange={(value) => handleBedTypeChange(room.id, value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BED_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          Students will see this information when browsing your listing. 
          It helps them understand what to expect, but doesn't limit how many 
          students can reserve the room.
        </p>
      </div>
    </motion.div>
  );
}
