import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DollarSign, Check, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { WizardRoomData } from './RoomNamesStep';

interface RoomPricingStepProps {
  rooms: WizardRoomData[];
  selectedIds: string[];
  onChange: (rooms: WizardRoomData[]) => void;
  propertyType?: string;
}

function getMaxOccupancy(room: WizardRoomData): number {
  switch (room.capacityType) {
    case 'single': return 1;
    case 'double': case 'twin': return 2;
    case 'triple': return 3;
    case 'quadruple': return 4;
    case 'suite': return room.capacity || 1;
    default: return room.capacity || 1;
  }
}

function canHaveTieredPricing(room: WizardRoomData): boolean {
  const cap = room.capacityType;
  return cap === 'double' || cap === 'twin' || cap === 'triple' || cap === 'quadruple';
}

function TierRow({ occupancy, maxOccupancy, price, deposit, onPriceChange, onDepositChange }: {
  occupancy: number;
  maxOccupancy: number;
  price: number | null;
  deposit: number | null;
  onPriceChange: (v: number | null) => void;
  onDepositChange: (v: number | null) => void;
}) {
  const label = occupancy === 1
    ? `1 occupant (whole unit)`
    : `${occupancy} occupants (split /${occupancy})`;
  const perPerson = price ? `$${Math.round(price / occupancy)}/mo each` : '';

  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        {occupancy > 1 && perPerson && (
          <p className="text-[10px] text-muted-foreground">Each pays: {perPerson}</p>
        )}
      </div>
      <div className="relative w-24">
        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        <Input
          type="number"
          value={price ?? ''}
          onChange={(e) => onPriceChange(e.target.value ? parseFloat(e.target.value) : null)}
          placeholder="Rent"
          className="pl-7 h-8 text-xs rounded-lg"
        />
      </div>
      <div className="relative w-24">
        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        <Input
          type="number"
          value={deposit ?? ''}
          onChange={(e) => onDepositChange(e.target.value ? parseFloat(e.target.value) : null)}
          placeholder="Deposit"
          className="pl-7 h-8 text-xs rounded-lg"
        />
      </div>
    </div>
  );
}

export function RoomPricingStep({ rooms, selectedIds, onChange, propertyType = 'dorm' }: RoomPricingStepProps) {
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkDeposit, setBulkDeposit] = useState('');
  const [applied, setApplied] = useState(false);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const effectiveSelectedIds = selectedIds.length > 0 ? selectedIds : rooms.map(r => r.id);
  const selectedRooms = rooms.filter(r => effectiveSelectedIds.includes(r.id));
  const selectedCount = selectedRooms.length;

  const hasTierableRooms = selectedRooms.some(r => canHaveTieredPricing(r));

  const applyBulkPrice = () => {
    if (!bulkPrice && !bulkDeposit) return;
    const updated = rooms.map(room => {
      if (!effectiveSelectedIds.includes(room.id)) return room;
      return {
        ...room,
        price: bulkPrice ? parseFloat(bulkPrice) : room.price,
        deposit: bulkDeposit ? parseFloat(bulkDeposit) : room.deposit,
      };
    });
    onChange(updated);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const updateRoom = (roomId: string, partial: Partial<WizardRoomData>) => {
    const updated = rooms.map(r => r.id === roomId ? { ...r, ...partial } : r);
    onChange(updated);
  };

  const updateTier = (roomId: string, occupancy: number, field: 'price' | 'deposit', value: number | null) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const tiers = [...(room.pricing_tiers || [])];
    const idx = tiers.findIndex(t => t.occupancy === occupancy);
    if (idx >= 0) {
      tiers[idx] = { ...tiers[idx], [field]: value };
    } else {
      tiers.push({ occupancy, price: field === 'price' ? value : null, deposit: field === 'deposit' ? value : null });
    }
    updateRoom(roomId, { pricing_tiers: tiers });
  };

  const getTierValue = (room: WizardRoomData, occupancy: number, field: 'price' | 'deposit'): number | null => {
    const tier = room.pricing_tiers?.find(t => t.occupancy === occupancy);
    return tier?.[field] ?? null;
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
            Set pricing for your rental units
          </h1>
          <p className="text-muted-foreground">
            Enter prices and apply to {selectedCount} units
          </p>
        </motion.div>

        {/* Bulk apply */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Monthly rent</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="number" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="0" className="pl-9 h-11 rounded-xl" />
              </div>
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="number" value={bulkDeposit} onChange={(e) => setBulkDeposit(e.target.value)}
                  placeholder="Deposit" className="pl-9 h-11 rounded-xl" />
              </div>
            </div>
          </div>
          <Button onClick={applyBulkPrice} disabled={!bulkPrice && !bulkDeposit}
            className="w-full rounded-xl gap-2">
            {applied ? <><Check className="w-4 h-4" /> Applied</> : 'Apply to all units'}
          </Button>
        </motion.div>

        {/* Tiered pricing tip */}
        {hasTierableRooms && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="flex items-start gap-2 p-3 bg-muted/50 rounded-xl mb-4 text-xs text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>Tip: Tiered pricing lets you set a higher price when only 1 tenant occupies a multi-person unit, and a lower shared price when it's fully occupied.</p>
          </motion.div>
        )}

        {/* Individual room cards */}
        <ScrollArea className="h-[calc(100vh-520px)]">
          <div className="space-y-3 pr-4">
            {selectedRooms.map((room, index) => {
              const expanded = expandedRoom === room.id;
              const maxOcc = getMaxOccupancy(room);
              const canTier = canHaveTieredPricing(room);

              return (
                <motion.div key={room.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.5) }}
                  className="bg-card border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedRoom(expanded ? null : room.id)}
                    className="w-full p-4 flex items-center justify-between text-left">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-sm text-foreground truncate block">{room.name}</span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{room.type || 'Untyped'}</Badge>
                        {room.price ? (
                          <span className="text-xs text-muted-foreground">${room.price}/mo - ${room.deposit || 0} dep</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not set</span>
                        )}
                        {room.tiered_pricing_enabled && <Badge variant="secondary" className="text-[10px]">Tiered</Badge>}
                      </div>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                      {/* Fixed price */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Monthly rent</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                            <Input type="number" value={room.price ?? ''} onChange={(e) => updateRoom(room.id, { price: e.target.value ? parseFloat(e.target.value) : null })}
                              className="pl-7 h-8 text-xs rounded-lg" placeholder="0" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Deposit</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                            <Input type="number" value={room.deposit ?? ''} onChange={(e) => updateRoom(room.id, { deposit: e.target.value ? parseFloat(e.target.value) : null })}
                              className="pl-7 h-8 text-xs rounded-lg" placeholder="0" />
                          </div>
                        </div>
                      </div>

                      {/* Tiered pricing toggle */}
                      {canTier && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Enable tiered pricing</span>
                            <Switch checked={!!room.tiered_pricing_enabled} onCheckedChange={(v) => {
                              const tiers = v ? Array.from({ length: maxOcc }, (_, i) => ({
                                occupancy: i + 1, price: null as number | null, deposit: null as number | null
                              })) : [];
                              updateRoom(room.id, { tiered_pricing_enabled: v, pricing_tiers: tiers });
                            }} />
                          </div>

                          {room.tiered_pricing_enabled && (
                            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                              {Array.from({ length: maxOcc }, (_, i) => i + 1).map(occ => (
                                <TierRow key={occ} occupancy={occ} maxOccupancy={maxOcc}
                                  price={getTierValue(room, occ, 'price')}
                                  deposit={getTierValue(room, occ, 'deposit')}
                                  onPriceChange={(v) => updateTier(room.id, occ, 'price', v)}
                                  onDepositChange={(v) => updateTier(room.id, occ, 'deposit', v)} />
                              ))}
                            </div>
                          )}
                        </>
                      )}
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
              {room.name} {room.price ? `$${room.price}` : ''}
              {room.tiered_pricing_enabled ? ' ⚡' : ''}
            </Badge>
          ))}
          {selectedCount > 6 && <Badge variant="secondary" className="text-xs">+{selectedCount - 6} more</Badge>}
        </div>
      </div>
    </div>
  );
}
