import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, ChevronDown, ChevronUp, AlertCircle, Check, Users } from 'lucide-react';
import { WizardRoomData } from './RoomNamesStep';

interface TieredPricingStepProps {
  rooms: WizardRoomData[];
  selectedIds: string[];
  onChange: (rooms: WizardRoomData[]) => void;
}

function getMaxOccupancy(room: WizardRoomData): number {
  switch (room.capacityType) {
    case 'double': case 'twin': return 2;
    case 'triple': return 3;
    case 'quadruple': return 4;
    default: return room.capacity || 1;
  }
}

export function TieredPricingStep({ rooms, selectedIds, onChange }: TieredPricingStepProps) {
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [applied, setApplied] = useState<Record<string, boolean>>({});

  const effectiveSelectedIds = selectedIds.length > 0 ? selectedIds : rooms.map(r => r.id);
  
  const tieredRooms = useMemo(() => 
    rooms.filter(r => effectiveSelectedIds.includes(r.id) && r.tiered_pricing_enabled),
    [rooms, effectiveSelectedIds]
  );

  // Group by canonical type
  const typeGroups = useMemo(() => {
    const groups: Record<string, WizardRoomData[]> = {};
    tieredRooms.forEach(r => {
      const key = r.type || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  }, [tieredRooms]);

  const updateTier = (roomId: string, occupancy: number, field: 'price' | 'deposit', value: number | null) => {
    const updated = rooms.map(r => {
      if (r.id !== roomId) return r;
      const tiers = [...(r.pricing_tiers || [])];
      const idx = tiers.findIndex(t => t.occupancy === occupancy);
      if (idx >= 0) {
        tiers[idx] = { ...tiers[idx], [field]: value };
      } else {
        tiers.push({ occupancy, price: field === 'price' ? value : null, deposit: field === 'deposit' ? value : null });
      }
      return { ...r, pricing_tiers: tiers };
    });
    onChange(updated);
  };

  const applyToType = (sourceRoomId: string, type: string) => {
    const sourceRoom = rooms.find(r => r.id === sourceRoomId);
    if (!sourceRoom?.pricing_tiers) return;
    const updated = rooms.map(r => {
      if (r.type !== type || !r.tiered_pricing_enabled || r.id === sourceRoomId) return r;
      return { ...r, pricing_tiers: [...sourceRoom.pricing_tiers!] };
    });
    onChange(updated);
    setApplied(prev => ({ ...prev, [type]: true }));
    setTimeout(() => setApplied(prev => ({ ...prev, [type]: false })), 2000);
  };

  const getTierValue = (room: WizardRoomData, occ: number, field: 'price' | 'deposit'): number | null => {
    return room.pricing_tiers?.find(t => t.occupancy === occ)?.[field] ?? null;
  };

  const hasEmptyTiers = tieredRooms.some(r =>
    r.pricing_tiers?.some(t => t.price === null || t.price === undefined)
  );

  if (tieredRooms.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
        <div className="w-full max-w-xl mx-auto text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">No tiered pricing needed</h1>
          <p className="text-muted-foreground">No units have tiered pricing enabled.</p>
        </div>
      </div>
    );
  }

  const summaryParts = Object.entries(typeGroups).map(([type, rms]) => `${type} (${rms.length} units)`);

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4">
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">Review tiered pricing</h1>
          <p className="text-muted-foreground text-sm">Confirm pricing for each occupancy level across your tiered units</p>
        </motion.div>

        {/* Type summary banner */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="p-3 bg-muted/50 rounded-xl mb-4 text-xs text-muted-foreground">
          Tiered pricing configured for: {summaryParts.join(' · ')}
        </motion.div>

        {hasEmptyTiers && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-xl mb-4 text-xs text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>Some tiers have no price set — tenants will see — for those occupancy levels</p>
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="space-y-3 pr-4">
            {tieredRooms.map((room, index) => {
              const expanded = expandedRoom === room.id;
              const maxOcc = getMaxOccupancy(room);
              const tiers = room.pricing_tiers || [];

              // Summary text
              const prices = tiers.filter(t => t.price !== null).map(t => `$${t.price}`);
              const summary = prices.length > 0 ? `${tiers.length} tiers - ${prices.join(' → ')}/mo` : 'No prices set';

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
                        <Badge variant="outline" className="text-[10px]">{room.type}</Badge>
                        <span className="text-[10px] text-muted-foreground">{summary}</span>
                      </div>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                      <div className="space-y-2">
                        <div className="grid grid-cols-[1fr_80px_80px_80px] gap-1 text-[10px] text-muted-foreground font-medium">
                          <span>Occupancy</span>
                          <span>Monthly rent</span>
                          <span>Deposit</span>
                          <span>Per person</span>
                        </div>
                        {Array.from({ length: maxOcc }, (_, i) => i + 1).map(occ => {
                          const price = getTierValue(room, occ, 'price');
                          const deposit = getTierValue(room, occ, 'deposit');
                          const perPerson = price ? `$${Math.round(price / occ)}` : '—';
                          return (
                            <div key={occ} className="grid grid-cols-[1fr_80px_80px_80px] gap-1 items-center">
                              <span className="text-xs text-foreground">
                                {occ === 1 ? '1 tenant alone' : `${occ} tenants`}
                              </span>
                              <div className="relative">
                                <Input type="number" value={price ?? ''} onChange={(e) => updateTier(room.id, occ, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                                  className="h-7 text-[10px] rounded px-1" placeholder="—" />
                              </div>
                              <div className="relative">
                                <Input type="number" value={deposit ?? ''} onChange={(e) => updateTier(room.id, occ, 'deposit', e.target.value ? parseFloat(e.target.value) : null)}
                                  className="h-7 text-[10px] rounded px-1" placeholder="—" />
                              </div>
                              <span className="text-[10px] text-muted-foreground text-center">
                                {occ > 1 ? `${perPerson} each` : perPerson}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <Button size="sm" variant="outline" className="w-full text-xs rounded-lg gap-1"
                        onClick={() => applyToType(room.id, room.type!)}>
                        {applied[room.type!] ? <><Check className="w-3 h-3" /> Applied</> : `Apply to all ${room.type} units`}
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
