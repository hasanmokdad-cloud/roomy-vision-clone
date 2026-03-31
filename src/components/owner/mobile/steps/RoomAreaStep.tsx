import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Ruler, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { WizardRoomData } from './RoomNamesStep';

interface RoomAreaStepProps {
  rooms: WizardRoomData[];
  selectedIds: string[];
  onChange: (rooms: WizardRoomData[]) => void;
  propertyType?: string;
}

export function RoomAreaStep({ rooms, selectedIds, onChange, propertyType = 'dorm' }: RoomAreaStepProps) {
  const [area, setArea] = useState('');
  const [applied, setApplied] = useState(false);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const effectiveSelectedIds = selectedIds.length > 0 ? selectedIds : rooms.map(r => r.id);
  const selectedRooms = rooms.filter(r => effectiveSelectedIds.includes(r.id));
  const selectedCount = selectedRooms.length;

  const applyArea = () => {
    if (!area) return;
    const updated = rooms.map(room =>
      effectiveSelectedIds.includes(room.id)
        ? { ...room, area_m2: parseFloat(area) }
        : room
    );
    onChange(updated);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const updateRoomArea = (roomId: string, value: string) => {
    const updated = rooms.map(r =>
      r.id === roomId ? { ...r, area_m2: value ? parseFloat(value) : null } : r
    );
    onChange(updated);
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">Rental unit dimensions</h1>
          <p className="text-muted-foreground">Set the area in square meters for your selected units</p>
        </motion.div>

        {/* Bulk apply */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="number" step="0.1" value={area} onChange={(e) => setArea(e.target.value)}
                placeholder="e.g., 15" className="pl-9 h-11 rounded-xl" />
            </div>
            <Button onClick={applyArea} disabled={!area} className="h-11 px-6 rounded-xl gap-2">
              {applied ? <Check className="w-4 h-4" /> : 'Apply to all'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Common sizes: 12m² (small) · 15m² (medium) · 20m² (large)
          </p>
        </motion.div>

        {/* Individual room cards */}
        <ScrollArea className="h-[calc(100vh-460px)]">
          <div className="space-y-3 pr-4">
            {selectedRooms.map((room, index) => {
              const expanded = expandedRoom === room.id;
              const isSuite = room.capacityType === 'suite';
              return (
                <motion.div key={room.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.5) }}
                  className="bg-card border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setExpandedRoom(expanded ? null : room.id)}
                    className="w-full p-4 flex items-center justify-between text-left">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-sm text-foreground truncate block">{room.name}</span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{room.type || 'Untyped'}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {room.area_m2 ? `${room.area_m2}m²` : 'Not set'}
                        </span>
                      </div>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs shrink-0">Area (m²)</Label>
                        <Input type="number" step="0.1" value={room.area_m2 ?? ''}
                          onChange={(e) => updateRoomArea(room.id, e.target.value)}
                          placeholder="e.g., 15" className="h-8 rounded-lg text-sm" />
                      </div>
                      {isSuite && (
                        <p className="text-[10px] text-muted-foreground">Enter total area including all bedrooms and shared spaces.</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">Common sizes: 12m² (small) · 15m² (medium) · 20m² (large)</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {selectedRooms.slice(0, 6).map(room => (
            <Badge key={room.id} variant="secondary" className="text-xs">
              {room.name} {room.area_m2 ? `${room.area_m2}m²` : ''}
            </Badge>
          ))}
          {selectedCount > 6 && <Badge variant="secondary" className="text-xs">+{selectedCount - 6} more</Badge>}
        </div>
      </div>
    </div>
  );
}
