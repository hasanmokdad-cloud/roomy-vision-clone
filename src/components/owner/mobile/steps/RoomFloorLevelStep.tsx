import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { WizardRoomData } from './RoomNamesStep';

interface RoomFloorLevelStepProps {
  rooms: WizardRoomData[];
  onChange: (rooms: WizardRoomData[]) => void;
  hasMultipleBlocks?: boolean;
  blockCount?: number;
}

const FLOOR_OPTIONS = [
  { value: 'B2', label: 'B2 — Second basement' },
  { value: 'B1', label: 'B1 — First basement' },
  { value: 'G', label: 'G — Ground floor' },
  ...Array.from({ length: 20 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1} — Floor ${i + 1}`,
  })),
];

export function formatFloorDisplay(floor: string | null | undefined): string {
  if (!floor) return 'Not set';
  if (floor === 'G') return 'Ground floor';
  if (floor === 'B1') return 'Basement 1';
  if (floor === 'B2') return 'Basement 2';
  return `Floor ${floor}`;
}

export function RoomFloorLevelStep({
  rooms,
  onChange,
  hasMultipleBlocks = false,
  blockCount = 1,
}: RoomFloorLevelStepProps) {
  const [bulkFloor, setBulkFloor] = useState<string>('');
  const [blockBulkFloors, setBlockBulkFloors] = useState<Record<string, string>>({});
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set());

  const updateFloor = (roomId: string, floor: string) => {
    onChange(rooms.map(r => r.id === roomId ? { ...r, floor_level: floor } : r));
  };

  const applyBulkAll = () => {
    if (!bulkFloor) return;
    onChange(rooms.map(r => ({ ...r, floor_level: bulkFloor })));
  };

  const applyBulkBlock = (blockNum: number) => {
    const floor = blockBulkFloors[String(blockNum)];
    if (!floor) return;
    onChange(rooms.map(r => (r.block_number || 1) === blockNum ? { ...r, floor_level: floor } : r));
  };

  const toggleBlock = (blockNum: number) => {
    setCollapsedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockNum)) next.delete(blockNum);
      else next.add(blockNum);
      return next;
    });
  };

  const roomsByBlock = useMemo(() => {
    const groups: Record<number, WizardRoomData[]> = {};
    rooms.forEach(r => {
      const bn = r.block_number || 1;
      if (!groups[bn]) groups[bn] = [];
      groups[bn].push(r);
    });
    return groups;
  }, [rooms]);

  const renderRoomRow = (room: WizardRoomData, index: number) => (
    <motion.div
      key={room.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.015 }}
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
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Floor:</span>
        <Select
          value={room.floor_level || ''}
          onValueChange={(v) => updateFloor(room.id, v)}
        >
          <SelectTrigger className="w-28 h-9 rounded-xl text-sm">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {FLOOR_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );

  const renderBulkApply = (
    value: string,
    onValueChange: (v: string) => void,
    onApply: () => void,
    label: string,
  ) => (
    <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-xl">
      <span className="text-sm text-muted-foreground whitespace-nowrap">{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="flex-1 h-9 rounded-xl text-sm">
          <SelectValue placeholder="Select floor" />
        </SelectTrigger>
        <SelectContent>
          {FLOOR_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        onClick={onApply}
        disabled={!value}
        className="rounded-xl"
      >
        Apply
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
            Which floor is each unit on?
          </h1>
          <p className="text-muted-foreground">
            Help tenants find their way around your building
          </p>
        </motion.div>

        {!hasMultipleBlocks ? (
          <>
            {renderBulkApply(bulkFloor, setBulkFloor, applyBulkAll, 'Apply floor to all units:')}
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-2 pr-4">
                {rooms.map((room, i) => renderRoomRow(room, i))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-4 pr-4">
              {Array.from({ length: blockCount }, (_, i) => i + 1).map(blockNum => {
                const blockRooms = roomsByBlock[blockNum] || [];
                const isCollapsed = collapsedBlocks.has(blockNum);
                return (
                  <div key={blockNum} className="border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleBlock(blockNum)}
                      className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">Block {blockNum}</span>
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
                      <div className="p-3 space-y-2">
                        {renderBulkApply(
                          blockBulkFloors[String(blockNum)] || '',
                          (v) => setBlockBulkFloors(prev => ({ ...prev, [String(blockNum)]: v })),
                          () => applyBulkBlock(blockNum),
                          `Apply to all Block ${blockNum} units:`,
                        )}
                        {blockRooms.map((room, i) => renderRoomRow(room, i))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
