import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WizardRoomData, BedConfigRow, SuiteBedroomConfig } from './RoomNamesStep';
import { Check, Plus, Minus, Trash2, AlertCircle } from 'lucide-react';

interface RoomTypesStepProps {
  rooms: WizardRoomData[];
  onChange: (rooms: WizardRoomData[]) => void;
  propertyType?: string;
  blockSettings?: Record<string, { kitchenette_type: string; balcony_type: string; furnished_type: string }>;
  currentBlockNumber?: number;
}

const CAPACITY_OPTIONS = [
  { value: 'single', label: 'Single', desc: '1 person, 1 single bed' },
  { value: 'double', label: 'Double', desc: '1 large or king-size bed, shared by 2 people' },
  { value: 'twin', label: 'Twin', desc: '2 separate single beds within the same unit' },
  { value: 'triple', label: 'Triple', desc: '3 people' },
  { value: 'quadruple', label: 'Quadruple', desc: '4 people' },
  { value: 'suite', label: 'Suite', desc: '1+ bedrooms with a living room' },
];

const SIZE_OPTIONS = [
  { value: '', label: 'No size' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const BED_TYPE_OPTIONS = [
  { value: 'single', label: 'Single bed', sleeps: 1 },
  { value: 'double', label: 'Double bed', sleeps: 2 },
  { value: 'twin', label: 'Twin bed', sleeps: 1 },
];

const SUITE_BEDROOM_CAPACITY = [
  { value: 'single', label: 'Single', target: 1 },
  { value: 'double', label: 'Double', target: 2 },
  { value: 'twin', label: 'Twin', target: 2 },
  { value: 'triple', label: 'Triple', target: 3 },
];

function getCapacityNumber(cap: string): number {
  switch (cap) {
    case 'single': return 1;
    case 'double': return 2;
    case 'twin': return 2;
    case 'triple': return 3;
    case 'quadruple': return 4;
    default: return 0;
  }
}

function getBedConfigTotal(config: BedConfigRow[]): number {
  return config.reduce((sum, row) => {
    const sleeps = row.bedType === 'double' ? 2 : 1;
    return sum + sleeps * row.quantity;
  }, 0);
}

function getSuiteTotal(bedrooms: SuiteBedroomConfig[]): number {
  return bedrooms.reduce((sum, br) => sum + getCapacityNumber(br.capacity), 0);
}

function buildCanonicalLabel(room: WizardRoomData, kitchenetteType: string): string {
  const parts: string[] = [];

  if (room.size) {
    parts.push(room.size.charAt(0).toUpperCase() + room.size.slice(1));
  }

  if (room.capacityType === 'suite') {
    const bedroomCount = room.suite_bedrooms?.length || 0;
    parts.push(`${bedroomCount}-Bedroom Suite`);
  } else {
    if (room.capacityType) {
      parts.push(room.capacityType.charAt(0).toUpperCase() + room.capacityType.slice(1));
    }
    // Base type
    const effectiveBase = room.baseType || (kitchenetteType === 'studio' ? 'studio' : 'room');
    parts.push(effectiveBase === 'studio' ? 'Studio' : 'Room');
  }

  if (room.has_balcony) parts.push('+ Balcony');
  if (room.is_furnished === false) parts.push('+ Unfurnished');

  return parts.join(' ');
}

function getDefaultBedConfig(capacity: string): BedConfigRow[] {
  switch (capacity) {
    case 'single': return [{ bedType: 'single', quantity: 1 }];
    case 'double': return [{ bedType: 'double', quantity: 1 }];
    case 'twin': return [{ bedType: 'twin', quantity: 2 }];
    case 'triple': return [{ bedType: 'single', quantity: 3 }];
    case 'quadruple': return [{ bedType: 'single', quantity: 4 }];
    default: return [];
  }
}

// ============================================================
// BED BUILDER SUB-COMPONENT
// ============================================================
function BedBuilder({
  config,
  onChange,
  targetCapacity,
  capacityLabel,
}: {
  config: BedConfigRow[];
  onChange: (c: BedConfigRow[]) => void;
  targetCapacity: number;
  capacityLabel: string;
}) {
  const total = getBedConfigTotal(config);
  const mismatch = total !== targetCapacity;

  const addRow = () => onChange([...config, { bedType: 'single', quantity: 1 }]);
  const removeRow = (i: number) => onChange(config.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: string, val: any) => {
    const updated = [...config];
    updated[i] = { ...updated[i], [field]: val };
    onChange(updated);
  };

  return (
    <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Bed configuration</p>
      {config.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select value={row.bedType} onValueChange={(v) => updateRow(i, 'bedType', v)}>
            <SelectTrigger className="h-8 text-xs rounded-lg flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BED_TYPE_OPTIONS.map(bt => (
                <SelectItem key={bt.value} value={bt.value}>{bt.label} (sleeps {bt.sleeps})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">×</span>
          <Input
            type="number"
            min={1}
            max={6}
            value={row.quantity}
            onChange={(e) => updateRow(i, 'quantity', Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
            className="h-8 w-14 text-xs text-center rounded-lg"
          />
          {config.length > 1 && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeRow(i)}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" className="text-xs gap-1 rounded-lg" onClick={addRow}>
        <Plus className="w-3 h-3" /> Add bed type
      </Button>
      <div className={`text-xs mt-1 flex items-center gap-1 ${mismatch ? 'text-destructive' : 'text-muted-foreground'}`}>
        {mismatch && <AlertCircle className="w-3 h-3" />}
        Total occupancy: {total} {mismatch ? `— should be ${targetCapacity} for a ${capacityLabel} unit` : `✓`}
      </div>
    </div>
  );
}

// ============================================================
// SUITE CONFIGURATOR SUB-COMPONENT
// ============================================================
function SuiteConfigurator({
  room,
  onUpdate,
  kitchenetteType,
  balconyType,
}: {
  room: WizardRoomData;
  onUpdate: (partial: Partial<WizardRoomData>) => void;
  kitchenetteType: string;
  balconyType: string;
}) {
  const bedrooms = room.suite_bedrooms || [{ label: 'Bedroom 1', capacity: 'single' as const, bedConfig: [{ bedType: 'single' as const, quantity: 1 }] }];
  const bathroomCount = room.suite_bathroom_count || 1;

  const updateBedrooms = (updated: SuiteBedroomConfig[]) => {
    onUpdate({ suite_bedrooms: updated, capacity: getSuiteTotal(updated) });
  };

  const addBedroom = () => {
    updateBedrooms([...bedrooms, { label: `Bedroom ${bedrooms.length + 1}`, capacity: 'single', bedConfig: [{ bedType: 'single', quantity: 1 }] }]);
  };

  const removeBedroom = (i: number) => {
    if (bedrooms.length <= 1) return;
    const updated = bedrooms.filter((_, idx) => idx !== i).map((br, idx) => ({ ...br, label: `Bedroom ${idx + 1}` }));
    updateBedrooms(updated);
  };

  const updateBedroomCapacity = (i: number, cap: string) => {
    const updated = [...bedrooms];
    updated[i] = { ...updated[i], capacity: cap as any, bedConfig: getDefaultBedConfig(cap) };
    updateBedrooms(updated);
  };

  const updateBedroomBedConfig = (i: number, config: BedConfigRow[]) => {
    const updated = [...bedrooms];
    updated[i] = { ...updated[i], bedConfig: config };
    updateBedrooms(updated);
  };

  return (
    <div className="mt-3 p-3 bg-muted/20 rounded-lg border border-border space-y-4">
      <div>
        <p className="text-xs font-semibold text-foreground">Configure your suite's bedrooms</p>
        <p className="text-[10px] text-muted-foreground">Add each bedroom and define its bed setup. The suite's kitchenette (if any) is shared across all bedrooms.</p>
      </div>

      {/* Bathroom count */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">How many bathrooms?</Label>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg"
            onClick={() => onUpdate({ suite_bathroom_count: Math.max(1, bathroomCount - 1) })}>
            <Minus className="w-3 h-3" />
          </Button>
          <span className="text-sm font-medium w-6 text-center">{bathroomCount}</span>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg"
            onClick={() => onUpdate({ suite_bathroom_count: bathroomCount + 1 })}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Balcony toggle (mixed only) */}
      {balconyType === 'mixed' && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Does this suite have a private balcony?</Label>
          <Switch checked={!!room.has_balcony} onCheckedChange={(v) => onUpdate({ has_balcony: v })} />
        </div>
      )}
      {balconyType === 'all' && (
        <Badge variant="secondary" className="text-[10px]">✓ Private balcony included</Badge>
      )}

      {/* Kitchenette toggle (mixed only) */}
      {kitchenetteType === 'mixed' && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Does this suite have a shared kitchenette?</Label>
          <Switch checked={!!room.suite_has_kitchenette} onCheckedChange={(v) => onUpdate({ suite_has_kitchenette: v })} />
        </div>
      )}

      {/* Bedroom rows */}
      {bedrooms.map((br, i) => (
        <div key={i} className="p-2 bg-background rounded-lg border border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">{br.label}</span>
            <div className="flex items-center gap-2">
              <Select value={br.capacity} onValueChange={(v) => updateBedroomCapacity(i, v)}>
                <SelectTrigger className="h-7 text-xs rounded-lg w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUITE_BEDROOM_CAPACITY.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {bedrooms.length > 1 && (
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeBedroom(i)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              )}
            </div>
          </div>
          {(br.capacity === 'triple') && (
            <BedBuilder
              config={br.bedConfig}
              onChange={(c) => updateBedroomBedConfig(i, c)}
              targetCapacity={getCapacityNumber(br.capacity)}
              capacityLabel={br.capacity}
            />
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" className="text-xs gap-1 rounded-lg w-full" onClick={addBedroom}>
        <Plus className="w-3 h-3" /> Add bedroom
      </Button>

      <p className="text-xs text-muted-foreground">
        Total suite occupancy: <span className="font-medium text-foreground">{getSuiteTotal(bedrooms)} people</span>
      </p>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function RoomTypesStep({ rooms, onChange, propertyType = 'dorm', blockSettings = {}, currentBlockNumber = 1 }: RoomTypesStepProps) {
  const blockKey = String(currentBlockNumber);
  const bs = blockSettings[blockKey] || { kitchenette_type: 'room', balcony_type: 'none', furnished_type: 'furnished' };
  const kitchenetteType = bs.kitchenette_type;
  const balconyType = bs.balcony_type;
  const furnishedType = bs.furnished_type;
  const isMixed = kitchenetteType === 'mixed';

  const [mode, setMode] = useState<'all' | 'select'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [applied, setApplied] = useState(false);

  // Bulk state
  const [bulkCapacity, setBulkCapacity] = useState('');
  const [bulkBase, setBulkBase] = useState('');
  const [bulkSize, setBulkSize] = useState('');
  const [bulkBedConfig, setBulkBedConfig] = useState<BedConfigRow[]>([{ bedType: 'single', quantity: 1 }]);
  const [bulkSuiteBedrooms, setBulkSuiteBedrooms] = useState<SuiteBedroomConfig[]>([{ label: 'Bedroom 1', capacity: 'single', bedConfig: [{ bedType: 'single', quantity: 1 }] }]);
  const [bulkSuiteBathrooms, setBulkSuiteBathrooms] = useState(1);
  const [bulkSuiteKitchenette, setBulkSuiteKitchenette] = useState(false);
  const [bulkSuiteBalcony, setBulkSuiteBalcony] = useState(false);

  const isBulkSuite = bulkCapacity === 'suite';
  const needsBedBuilder = bulkCapacity === 'triple' || bulkCapacity === 'quadruple';

  const toggleRoom = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelectedIds(rooms.map(r => r.id));
  const deselectAll = () => setSelectedIds([]);

  const resolveRoomFields = useCallback((cap: string, base: string, size: string, bedConfig: BedConfigRow[], suiteBedrooms: SuiteBedroomConfig[], suiteBathrooms: number, suiteKitchenette: boolean, suiteBalcony: boolean): Partial<WizardRoomData> => {
    const isSuite = cap === 'suite';
    const effectiveBase = isSuite ? undefined : (isMixed ? base : (kitchenetteType === 'studio' ? 'studio' : 'room'));
    const capacity = isSuite ? getSuiteTotal(suiteBedrooms) : getCapacityNumber(cap);

    const has_balcony_val = balconyType === 'all' ? true : balconyType === 'none' ? false : (isSuite ? suiteBalcony : null);
    const is_furnished_val = furnishedType === 'furnished' ? true : furnishedType === 'unfurnished' ? false : null;

    const partial: Partial<WizardRoomData> = {
      capacityType: cap,
      baseType: effectiveBase,
      size,
      capacity,
      has_balcony: has_balcony_val,
      is_furnished: is_furnished_val,
    };

    if (isSuite) {
      partial.suite_bedrooms = suiteBedrooms;
      partial.suite_bathroom_count = suiteBathrooms;
      partial.suite_has_kitchenette = kitchenetteType === 'mixed' ? suiteKitchenette : (kitchenetteType === 'studio');
      partial.bed_configuration = undefined;
    } else if (cap === 'triple' || cap === 'quadruple') {
      partial.bed_configuration = bedConfig;
      partial.suite_bedrooms = undefined;
      partial.suite_bathroom_count = undefined;
      partial.suite_has_kitchenette = undefined;
    } else {
      partial.bed_configuration = getDefaultBedConfig(cap);
      partial.suite_bedrooms = undefined;
      partial.suite_bathroom_count = undefined;
      partial.suite_has_kitchenette = undefined;
    }

    return partial;
  }, [kitchenetteType, balconyType, furnishedType, isMixed]);

  const applyBulk = (targetIds: string[]) => {
    const fields = resolveRoomFields(bulkCapacity, bulkBase, bulkSize, bulkBedConfig, bulkSuiteBedrooms, bulkSuiteBathrooms, bulkSuiteKitchenette, bulkSuiteBalcony);
    const updated = rooms.map(room => {
      if (!targetIds.includes(room.id)) return room;
      const merged = { ...room, ...fields };
      merged.type = buildCanonicalLabel(merged as WizardRoomData, kitchenetteType);
      return merged;
    });
    onChange(updated as WizardRoomData[]);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const updateSingleRoom = (index: number, partial: Partial<WizardRoomData>) => {
    const updated = [...rooms];
    const merged = { ...updated[index], ...partial };
    merged.type = buildCanonicalLabel(merged as WizardRoomData, kitchenetteType);
    updated[index] = merged as WizardRoomData;
    onChange(updated);
  };

  // Bulk apply validation
  const canApplyBulk = useMemo(() => {
    if (!bulkCapacity) return false;
    if (isMixed && !isBulkSuite && !bulkBase) return false;
    if (needsBedBuilder) {
      const total = getBedConfigTotal(bulkBedConfig);
      if (total !== getCapacityNumber(bulkCapacity)) return false;
    }
    if (isBulkSuite && bulkSuiteBedrooms.length < 1) return false;
    return true;
  }, [bulkCapacity, bulkBase, isMixed, isBulkSuite, needsBedBuilder, bulkBedConfig, bulkSuiteBedrooms]);

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
            What type are your rental units?
          </h1>
          <p className="text-muted-foreground">Assign a type to each unit</p>
        </motion.div>

        {/* MODE SELECTOR */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3 mb-6">
          {[
            { value: 'all' as const, label: 'Apply to all', desc: 'Configure all units at once' },
            { value: 'select' as const, label: 'Select & apply', desc: 'Pick units to configure' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => { setMode(opt.value); setSelectedIds([]); }}
              className={`p-3 rounded-xl border text-left transition-all ${mode === opt.value ? 'border-foreground bg-background shadow-sm' : 'border-border hover:border-foreground/50'}`}
            >
              <span className="text-sm font-medium text-foreground">{opt.label}</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </motion.div>

        {/* BULK DROPDOWNS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4 space-y-3 p-4 bg-muted/20 rounded-xl border border-border">
          {/* Base type (mixed only, non-suite) */}
          {isMixed && !isBulkSuite && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Base type</Label>
              <Select value={bulkBase} onValueChange={setBulkBase}>
                <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue placeholder="Studio or Room" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="room">Room</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Capacity */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Unit capacity</Label>
            <Select value={bulkCapacity} onValueChange={(v) => {
              setBulkCapacity(v);
              if (v === 'triple') setBulkBedConfig([{ bedType: 'single', quantity: 3 }]);
              else if (v === 'quadruple') setBulkBedConfig([{ bedType: 'single', quantity: 4 }]);
              else if (v === 'suite') setBulkSuiteBedrooms([{ label: 'Bedroom 1', capacity: 'single', bedConfig: [{ bedType: 'single', quantity: 1 }] }]);
            }}>
              <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue placeholder="Select capacity" /></SelectTrigger>
              <SelectContent>
                {CAPACITY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      {opt.desc && <span className="text-[10px] text-muted-foreground">{opt.desc}</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size */}
          {!isBulkSuite && bulkCapacity && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Size (optional)</Label>
              <Select value={bulkSize} onValueChange={setBulkSize}>
                <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue placeholder="No size" /></SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value || 'none'} value={opt.value || 'none'}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Bed builder for triple/quadruple */}
          {needsBedBuilder && (
            <BedBuilder
              config={bulkBedConfig}
              onChange={setBulkBedConfig}
              targetCapacity={getCapacityNumber(bulkCapacity)}
              capacityLabel={bulkCapacity}
            />
          )}

          {/* Suite configurator in bulk */}
          {isBulkSuite && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-xs font-semibold">Suite configuration</p>
              
              {/* Bathroom count */}
              <div className="flex items-center justify-between">
                <Label className="text-xs">Bathrooms</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg"
                    onClick={() => setBulkSuiteBathrooms(Math.max(1, bulkSuiteBathrooms - 1))}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-medium w-6 text-center">{bulkSuiteBathrooms}</span>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg"
                    onClick={() => setBulkSuiteBathrooms(bulkSuiteBathrooms + 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {balconyType === 'mixed' && (
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Private balcony?</Label>
                  <Switch checked={bulkSuiteBalcony} onCheckedChange={setBulkSuiteBalcony} />
                </div>
              )}

              {kitchenetteType === 'mixed' && (
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Shared kitchenette?</Label>
                  <Switch checked={bulkSuiteKitchenette} onCheckedChange={setBulkSuiteKitchenette} />
                </div>
              )}

              {/* Bedrooms */}
              {bulkSuiteBedrooms.map((br, i) => (
                <div key={i} className="p-2 bg-background rounded-lg border border-border/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{br.label}</span>
                    <div className="flex items-center gap-2">
                      <Select value={br.capacity} onValueChange={(v) => {
                        const updated = [...bulkSuiteBedrooms];
                        updated[i] = { ...updated[i], capacity: v as any, bedConfig: getDefaultBedConfig(v) };
                        setBulkSuiteBedrooms(updated);
                      }}>
                        <SelectTrigger className="h-7 text-xs rounded-lg w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SUITE_BEDROOM_CAPACITY.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {bulkSuiteBedrooms.length > 1 && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                          const updated = bulkSuiteBedrooms.filter((_, idx) => idx !== i).map((br, idx) => ({ ...br, label: `Bedroom ${idx + 1}` }));
                          setBulkSuiteBedrooms(updated);
                        }}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {br.capacity === 'triple' && (
                    <BedBuilder config={br.bedConfig} onChange={(c) => {
                      const updated = [...bulkSuiteBedrooms];
                      updated[i] = { ...updated[i], bedConfig: c };
                      setBulkSuiteBedrooms(updated);
                    }} targetCapacity={getCapacityNumber(br.capacity)} capacityLabel={br.capacity} />
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" className="text-xs gap-1 rounded-lg w-full" onClick={() => {
                setBulkSuiteBedrooms([...bulkSuiteBedrooms, { label: `Bedroom ${bulkSuiteBedrooms.length + 1}`, capacity: 'single', bedConfig: [{ bedType: 'single', quantity: 1 }] }]);
              }}>
                <Plus className="w-3 h-3" /> Add bedroom
              </Button>
              <p className="text-xs text-muted-foreground">
                Total suite occupancy: <span className="font-medium text-foreground">{getSuiteTotal(bulkSuiteBedrooms)} people</span>
              </p>
            </div>
          )}

          {/* Apply button */}
          <Button
            onClick={() => {
              const targetIds = mode === 'all' ? rooms.map(r => r.id) : selectedIds;
              applyBulk(targetIds);
              if (mode === 'select') { setSelectedIds([]); }
            }}
            disabled={!canApplyBulk || (mode === 'select' && selectedIds.length === 0)}
            className="w-full rounded-xl gap-2"
          >
            {applied ? <><Check className="w-4 h-4" /> Applied</> : mode === 'all' ? 'Apply to all units' : `Apply to ${selectedIds.length} selected`}
          </Button>
        </motion.div>

        {/* SELECT ALL / DESELECT (select mode only) */}
        {mode === 'select' && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={selectAll} className="rounded-lg text-xs">Select All</Button>
            <Button variant="outline" size="sm" onClick={deselectAll} className="rounded-lg text-xs">Deselect All</Button>
            {selectedIds.length > 0 && <Badge variant="secondary" className="text-xs">{selectedIds.length} selected</Badge>}
          </div>
        )}

        {/* UNIT CARDS */}
        <ScrollArea className="h-[calc(100vh-520px)]">
          <div className="space-y-3 pr-4">
            {rooms.map((room, index) => {
              const effectiveBalcony = balconyType === 'all' ? true : balconyType === 'none' ? false : room.has_balcony;
              const effectiveFurnished = furnishedType === 'furnished' ? true : furnishedType === 'unfurnished' ? false : room.is_furnished;
              const effectiveBase = room.baseType || (kitchenetteType === 'studio' ? 'studio' : kitchenetteType === 'room' ? 'room' : '');
              const isSuite = room.capacityType === 'suite';
              const showPerCard = mode === 'select';

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.5) }}
                  className={`bg-card border rounded-xl p-4 transition-all ${
                    mode === 'select' && selectedIds.includes(room.id) ? 'border-foreground' : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {mode === 'select' && (
                      <Checkbox
                        checked={selectedIds.includes(room.id)}
                        onCheckedChange={() => toggleRoom(room.id)}
                        className="h-5 w-5 mt-1"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground text-sm truncate">
                          {room.name || `Room ${index + 1}`}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {/* Base type tag */}
                        {!isMixed && !isSuite && effectiveBase && (
                          <Badge variant="outline" className="text-[10px]">
                            {effectiveBase === 'studio' ? 'Studio' : 'Room'}
                          </Badge>
                        )}
                        {/* Balcony */}
                        {balconyType === 'all' && <Badge variant="secondary" className="text-[10px]">✓ Private balcony</Badge>}
                        {/* Furnished */}
                        {furnishedType === 'furnished' && <Badge variant="secondary" className="text-[10px]">✓ Furnished</Badge>}
                        {furnishedType === 'unfurnished' && <Badge variant="outline" className="text-[10px] text-muted-foreground">✗ Unfurnished</Badge>}
                      </div>

                      {/* Per-card dropdowns (select mode) */}
                      {showPerCard && (
                        <div className="space-y-2">
                          {/* Base type for mixed */}
                          {isMixed && !isSuite && (
                            <Select value={room.baseType || ''} onValueChange={(v) => updateSingleRoom(index, { baseType: v })}>
                              <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="Studio or Room" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="studio">Studio</SelectItem>
                                <SelectItem value="room">Room</SelectItem>
                              </SelectContent>
                            </Select>
                          )}

                          {/* Capacity */}
                          <Select value={room.capacityType || ''} onValueChange={(v) => {
                            const partial: Partial<WizardRoomData> = { capacityType: v };
                            if (v === 'suite') {
                              partial.suite_bedrooms = [{ label: 'Bedroom 1', capacity: 'single', bedConfig: [{ bedType: 'single', quantity: 1 }] }];
                              partial.suite_bathroom_count = 1;
                              partial.capacity = 1;
                              partial.baseType = undefined;
                            } else {
                              partial.capacity = getCapacityNumber(v);
                              if (v === 'triple' || v === 'quadruple') {
                                partial.bed_configuration = getDefaultBedConfig(v);
                              } else {
                                partial.bed_configuration = getDefaultBedConfig(v);
                              }
                              partial.suite_bedrooms = undefined;
                              partial.suite_bathroom_count = undefined;
                            }
                            updateSingleRoom(index, partial);
                          }}>
                            <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="Capacity" /></SelectTrigger>
                            <SelectContent>
                              {CAPACITY_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Size */}
                          {!isSuite && room.capacityType && (
                            <Select value={room.size || 'none'} onValueChange={(v) => updateSingleRoom(index, { size: v === 'none' ? '' : v })}>
                              <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="Size" /></SelectTrigger>
                              <SelectContent>
                                {SIZE_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value || 'none'} value={opt.value || 'none'}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {/* Balcony toggle (mixed, non-suite) */}
                          {balconyType === 'mixed' && !isSuite && (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">Private balcony?</span>
                              <Switch checked={!!room.has_balcony} onCheckedChange={(v) => updateSingleRoom(index, { has_balcony: v })} />
                            </div>
                          )}

                          {/* Furnished toggle (mixed) */}
                          {furnishedType === 'mixed' && (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">Furnished?</span>
                              <Switch checked={room.is_furnished !== false} onCheckedChange={(v) => updateSingleRoom(index, { is_furnished: v })} />
                            </div>
                          )}

                          {/* Bed builder for triple/quadruple */}
                          {(room.capacityType === 'triple' || room.capacityType === 'quadruple') && (
                            <BedBuilder
                              config={room.bed_configuration || getDefaultBedConfig(room.capacityType)}
                              onChange={(c) => updateSingleRoom(index, { bed_configuration: c })}
                              targetCapacity={getCapacityNumber(room.capacityType)}
                              capacityLabel={room.capacityType}
                            />
                          )}

                          {/* Suite configurator */}
                          {isSuite && (
                            <SuiteConfigurator
                              room={room}
                              onUpdate={(partial) => updateSingleRoom(index, partial)}
                              kitchenetteType={kitchenetteType}
                              balconyType={balconyType}
                            />
                          )}
                        </div>
                      )}

                      {/* Canonical label */}
                      {room.type && (
                        <p className="text-xs text-primary font-medium mt-2">{room.type}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
