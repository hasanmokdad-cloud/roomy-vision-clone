import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Circle } from 'lucide-react';
import { WizardRoomData } from './RoomNamesStep';

interface RoomBulkSelectionStepProps {
  rooms: WizardRoomData[];
  selectedIds: string[];
  completedIds?: string[];
  onSelectionChange: (ids: string[]) => void;
  title?: string;
  subtitle?: string;
}

// Check if room has all required data
function isRoomComplete(room: WizardRoomData): boolean {
  return !!(
    room.type &&
    room.price !== null &&
    room.area_m2 !== null &&
    room.capacity !== null
  );
}

export function RoomBulkSelectionStep({
  rooms,
  selectedIds,
  completedIds = [],
  onSelectionChange,
  title = 'Select rooms for pricing',
  subtitle = 'Choose which rooms to configure'
}: RoomBulkSelectionStepProps) {
  
  const uniqueTypes = useMemo(() => {
    const types = rooms.map(r => r.type).filter(Boolean);
    return [...new Set(types)];
  }, [rooms]);

  // Separate completed and incomplete rooms
  const incompleteRooms = useMemo(() => 
    rooms.filter(r => !completedIds.includes(r.id)),
    [rooms, completedIds]
  );
  
  const completedRooms = useMemo(() => 
    rooms.filter(r => completedIds.includes(r.id)),
    [rooms, completedIds]
  );

  const selectByType = (type: string) => {
    if (!type) return;
    const idsOfType = incompleteRooms.filter(r => r.type === type).map(r => r.id);
    onSelectionChange(idsOfType);
  };

  const toggleRoom = (roomId: string) => {
    // Allow toggling any room (including completed ones for re-editing)
    onSelectionChange(
      selectedIds.includes(roomId)
        ? selectedIds.filter(id => id !== roomId)
        : [...selectedIds, roomId]
    );
  };

  const selectedCount = selectedIds.length;
  const allComplete = incompleteRooms.length === 0;

  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {title}
        </h1>
        <p className="text-muted-foreground">
          {subtitle}
        </p>
      </motion.div>

      {/* Progress indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-4"
      >
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-muted-foreground">
            {completedRooms.length} of {rooms.length} rooms complete
          </span>
        </div>
      </motion.div>

      {allComplete ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            All rooms configured!
          </h2>
          <p className="text-muted-foreground">
            Continue to upload room photos and videos.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Filter by type - only option now */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Select by type:</span>
              <Select onValueChange={selectByType}>
                <SelectTrigger className="flex-1 h-10 rounded-xl">
                  <SelectValue placeholder="Choose room type" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCount > 0 && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {selectedCount} room{selectedCount !== 1 ? 's' : ''} selected
              </Badge>
            )}
          </motion.div>

          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-3 pr-4">
              {/* Incomplete rooms (selectable) */}
              {incompleteRooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`bg-card border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                    selectedIds.includes(room.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                  }`}
                  onClick={() => toggleRoom(room.id)}
                >
                  <Checkbox
                    checked={selectedIds.includes(room.id)}
                    onCheckedChange={() => toggleRoom(room.id)}
                    className="h-5 w-5"
                  />
                  <Circle className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-foreground block truncate">
                      {room.name}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {room.type && (
                        <Badge variant="outline" className="text-xs">
                          {room.type}
                        </Badge>
                      )}
                      {room.price && (
                        <span className="text-xs text-muted-foreground">
                          ${room.price}/mo
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Completed rooms (not selectable, shown with checkmark) */}
              {completedRooms.length > 0 && (
                <>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide pt-4 pb-2">
                    Completed
                  </div>
                  {completedRooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (incompleteRooms.length + index) * 0.02 }}
                      className={`bg-muted/50 border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                        selectedIds.includes(room.id) 
                          ? 'border-primary bg-primary/5 opacity-100' 
                          : 'border-border opacity-60'
                      }`}
                      onClick={() => toggleRoom(room.id)}
                    >
                      <Checkbox
                        checked={selectedIds.includes(room.id)}
                        onCheckedChange={() => toggleRoom(room.id)}
                        className="h-5 w-5"
                      />
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-foreground block truncate">
                          {room.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          {room.type && (
                            <Badge variant="outline" className="text-xs">
                              {room.type}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            ${room.price}/mo • {room.area_m2}m²
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
