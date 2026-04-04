import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Layers, Plus, Trash2, GripVertical } from 'lucide-react';
import { WizardRoomData } from './RoomNamesStep';
import { getBlockDisplayName } from '@/utils/occupantLabel';

export interface FloorDefinition {
  id: string;
  label: string;
  order: number;
  blockNumber: number;
}

interface RoomFloorLevelStepProps {
  rooms: WizardRoomData[];
  onChange: (rooms: WizardRoomData[]) => void;
  hasMultipleBlocks?: boolean;
  blockCount?: number;
  floorDefinitions: FloorDefinition[];
  onFloorDefinitionsChange: (floors: FloorDefinition[]) => void;
  blockNames?: Array<{ block_number: number; name: string }>;
}

export function formatFloorDisplay(floor: string | null | undefined): string {
  if (!floor) return 'Not set';
  return floor;
}

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10);
}

// --- Floor Builder Sub-component ---
function FloorBuilder({
  floors,
  onChange,
  blockNumber,
  rooms,
  onRoomsChange,
}: {
  floors: FloorDefinition[];
  onChange: (floors: FloorDefinition[]) => void;
  blockNumber: number;
  rooms: WizardRoomData[];
  onRoomsChange: (rooms: WizardRoomData[]) => void;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const blockFloors = useMemo(
    () => floors.filter(f => f.blockNumber === blockNumber).sort((a, b) => a.order - b.order),
    [floors, blockNumber]
  );

  const otherFloors = useMemo(
    () => floors.filter(f => f.blockNumber !== blockNumber),
    [floors, blockNumber]
  );

  const addFloor = () => {
    const newFloor: FloorDefinition = {
      id: generateId(),
      label: '',
      order: blockFloors.length + 1,
      blockNumber,
    };
    onChange([...otherFloors, ...blockFloors, newFloor]);
  };

  const removeFloor = (floorId: string) => {
    const floor = blockFloors.find(f => f.id === floorId);
    if (!floor) return;

    // Unassign rooms on this floor
    const assignedCount = rooms.filter(
      r => r.floor_level === floor.label && (r.block_number || 1) === blockNumber
    ).length;

    if (assignedCount > 0) {
      const ok = window.confirm(
        `${assignedCount} unit${assignedCount > 1 ? 's are' : ' is'} assigned to "${floor.label}". Removing it will unassign them.`
      );
      if (!ok) return;
      onRoomsChange(
        rooms.map(r =>
          r.floor_level === floor.label && (r.block_number || 1) === blockNumber
            ? { ...r, floor_level: undefined }
            : r
        )
      );
    }

    const remaining = blockFloors.filter(f => f.id !== floorId);
    const reordered = remaining.map((f, i) => ({ ...f, order: i + 1 }));
    onChange([...otherFloors, ...reordered]);
  };

  const updateLabel = (floorId: string, newLabel: string) => {
    const oldFloor = blockFloors.find(f => f.id === floorId);
    const oldLabel = oldFloor?.label;

    const updated = blockFloors.map(f => (f.id === floorId ? { ...f, label: newLabel } : f));
    onChange([...otherFloors, ...updated]);

    // Update assigned rooms if label changed
    if (oldLabel && oldLabel !== newLabel) {
      onRoomsChange(
        rooms.map(r =>
          r.floor_level === oldLabel && (r.block_number || 1) === blockNumber
            ? { ...r, floor_level: newLabel }
            : r
        )
      );
    }
  };

  const getDuplicate = (floorId: string, label: string) => {
    if (!label.trim()) return false;
    return blockFloors.some(f => f.id !== floorId && f.label.trim().toLowerCase() === label.trim().toLowerCase());
  };

  // Simple drag reorder via drag index swap
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) return;
    const reordered = [...blockFloors];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    const withOrder = reordered.map((f, i) => ({ ...f, order: i + 1 }));
    onChange([...otherFloors, ...withOrder]);
    setDragIdx(targetIdx);
  };
  const handleDragEnd = () => setDragIdx(null);

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {blockFloors.map((floor, idx) => {
          const isDuplicate = getDuplicate(floor.id, floor.label);
          return (
            <div
              key={floor.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 p-2 bg-card border rounded-xl transition-colors ${
                dragIdx === idx ? 'border-primary/50 bg-primary/5' : 'border-border'
              }`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
              <span className="text-xs text-muted-foreground w-6 shrink-0">#{idx + 1}</span>
              <Input
                value={floor.label}
                onChange={(e) => updateLabel(floor.id, e.target.value)}
                placeholder="e.g. Ground Floor, 1st Floor, Mezzanine..."
                className={`flex-1 h-9 text-sm ${isDuplicate ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFloor(floor.id)}
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {blockFloors.some(f => getDuplicate(f.id, f.label)) && (
        <p className="text-xs text-destructive pl-1">This floor name is already used.</p>
      )}

      <Button variant="outline" size="sm" onClick={addFloor} className="rounded-xl gap-1.5">
        <Plus className="w-4 h-4" /> Add floor
      </Button>
    </div>
  );
}

// --- Unit Assignment Sub-component ---
function UnitAssignment({
  rooms,
  onChange,
  floors,
  blockNumber,
}: {
  rooms: WizardRoomData[];
  onChange: (rooms: WizardRoomData[]) => void;
  floors: FloorDefinition[];
  blockNumber: number;
}) {
  const [bulkFloor, setBulkFloor] = useState('');

  const blockFloors = useMemo(
    () => floors.filter(f => f.blockNumber === blockNumber && f.label.trim()).sort((a, b) => a.order - b.order),
    [floors, blockNumber]
  );

  const blockRooms = useMemo(
    () => rooms.filter(r => (r.block_number || 1) === blockNumber),
    [rooms, blockNumber]
  );

  const updateFloor = (roomId: string, floor: string) => {
    onChange(rooms.map(r => (r.id === roomId ? { ...r, floor_level: floor } : r)));
  };

  const applyBulk = () => {
    if (!bulkFloor) return;
    onChange(
      rooms.map(r => (r.block_number || 1) === blockNumber ? { ...r, floor_level: bulkFloor } : r)
    );
    setBulkFloor('');
  };

  if (blockFloors.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Bulk apply */}
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Apply to all:</span>
        <Select value={bulkFloor} onValueChange={setBulkFloor}>
          <SelectTrigger className="flex-1 h-9 rounded-xl text-sm">
            <SelectValue placeholder="Choose floor" />
          </SelectTrigger>
          <SelectContent>
            {blockFloors.map(f => (
              <SelectItem key={f.id} value={f.label}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={applyBulk} disabled={!bulkFloor} className="rounded-xl">
          Apply
        </Button>
      </div>

      {/* Room rows */}
      <div className="space-y-2">
        {blockRooms.map((room, i) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.015 }}
            className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl"
          >
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-foreground text-sm block truncate">
                {room.name || 'Room'}
              </span>
              {room.type && (
                <Badge variant="outline" className="text-xs mt-0.5">
                  {room.type}
                </Badge>
              )}
            </div>
            <Select
              value={room.floor_level || ''}
              onValueChange={(v) => updateFloor(room.id, v)}
            >
              <SelectTrigger className="w-32 h-9 rounded-xl text-sm">
                <SelectValue placeholder="Choose floor" />
              </SelectTrigger>
              <SelectContent>
                {blockFloors.map(f => (
                  <SelectItem key={f.id} value={f.label}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- Main Step Component ---
export function RoomFloorLevelStep({
  rooms,
  onChange,
  hasMultipleBlocks = false,
  blockCount = 1,
  floorDefinitions,
  onFloorDefinitionsChange,
  blockNames = [],
}: RoomFloorLevelStepProps) {
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set());

  const toggleBlock = (blockNum: number) => {
    setCollapsedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockNum)) next.delete(blockNum);
      else next.add(blockNum);
      return next;
    });
  };

  const hasAnyFloors = floorDefinitions.some(f => f.label.trim());

  if (!hasMultipleBlocks) {
    // Single block
    const blockFloors = floorDefinitions.filter(f => f.blockNumber === 1 && f.label.trim());

    return (
      <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
        <div className="w-full max-w-xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
              Which floor is each unit on?
            </h1>
            <p className="text-muted-foreground">
              First, define your building's floors — then assign each unit to a floor
            </p>
          </motion.div>

          {/* Step 1: Floor Builder */}
          <div className="mb-6">
            <h2 className="text-base font-semibold text-foreground mb-1">Define your floor levels</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Add each floor in your building, from bottom to top. You can use any name or numbering system.
            </p>
            <FloorBuilder
              floors={floorDefinitions}
              onChange={onFloorDefinitionsChange}
              blockNumber={1}
              rooms={rooms}
              onRoomsChange={onChange}
            />
          </div>

          {/* Step 2: Unit Assignment */}
          {blockFloors.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-520px)]">
              <UnitAssignment
                rooms={rooms}
                onChange={onChange}
                floors={floorDefinitions}
                blockNumber={1}
              />
            </ScrollArea>
          ) : (
            <div className="p-4 bg-muted/30 rounded-xl text-center">
              <p className="text-sm text-muted-foreground">
                No floors defined. You can skip this step or add floors above.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Multi-block layout
  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
            Which floor is each unit on?
          </h1>
          <p className="text-muted-foreground">
            First, define your building's floors — then assign each unit to a floor
          </p>
        </motion.div>

        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-4 pr-4">
            {Array.from({ length: blockCount }, (_, i) => i + 1).map(blockNum => {
              const blockRooms = rooms.filter(r => (r.block_number || 1) === blockNum);
              const isCollapsed = collapsedBlocks.has(blockNum);
              const blockFloors = floorDefinitions.filter(f => f.blockNumber === blockNum && f.label.trim());

              return (
                <div key={blockNum} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleBlock(blockNum)}
                    className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{getBlockDisplayName(blockNum, blockNames)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {blockRooms.length} units
                      </Badge>
                    </div>
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {!isCollapsed && (
                    <div className="p-3 space-y-4">
                      {/* Block floor builder */}
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-1">
                          Define {getBlockDisplayName(blockNum, blockNames)} floors
                        </h3>
                        <FloorBuilder
                          floors={floorDefinitions}
                          onChange={onFloorDefinitionsChange}
                          blockNumber={blockNum}
                          rooms={rooms}
                          onRoomsChange={onChange}
                        />
                      </div>

                      {/* Block unit assignment */}
                      {blockFloors.length > 0 ? (
                        <UnitAssignment
                          rooms={rooms}
                          onChange={onChange}
                          floors={floorDefinitions}
                          blockNumber={blockNum}
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Add floors above to assign units.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
