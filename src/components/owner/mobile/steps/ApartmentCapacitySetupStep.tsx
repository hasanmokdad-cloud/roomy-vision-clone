import { useTranslation } from 'react-i18next';
import { Building2, Users, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WizardApartmentData } from '@/types/apartment';

interface ApartmentCapacitySetupStepProps {
  apartments: WizardApartmentData[];
  selectedIds: string[];
  onChange: (apartments: WizardApartmentData[]) => void;
}

export function ApartmentCapacitySetupStep({
  apartments,
  selectedIds,
  onChange,
}: ApartmentCapacitySetupStepProps) {
  const { t } = useTranslation();

  const selectedApartments = apartments.filter(a => selectedIds.includes(a.id));

  const updateApartment = (id: string, updates: Partial<WizardApartmentData>) => {
    onChange(
      apartments.map(apt =>
        apt.id === id ? { ...apt, ...updates } : apt
      )
    );
  };

  const toggleCapacity = (apartmentId: string, capacity: number) => {
    const apt = apartments.find(a => a.id === apartmentId);
    if (!apt) return;

    const current = apt.enabledCapacities || [];
    const updated = current.includes(capacity)
      ? current.filter(c => c !== capacity)
      : [...current, capacity].sort((a, b) => a - b);

    updateApartment(apartmentId, { enabledCapacities: updated });
  };

  const applyToAll = (sourceApt: WizardApartmentData) => {
    onChange(
      apartments.map(apt =>
        selectedIds.includes(apt.id)
          ? {
              ...apt,
              maxCapacity: sourceApt.maxCapacity,
              enabledCapacities: [...sourceApt.enabledCapacities],
              enableTieredPricing: sourceApt.enableTieredPricing,
            }
          : apt
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Set Apartment Capacity
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure capacity and pricing options for {selectedApartments.length} apartment{selectedApartments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 pb-24">
          {selectedApartments.map((apt, index) => (
            <div
              key={apt.id}
              className="p-4 rounded-xl border border-border bg-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">{apt.name}</span>
                  {apt.type && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {apt.type}
                    </span>
                  )}
                </div>
                {index === 0 && selectedApartments.length > 1 && (
                  <button
                    onClick={() => applyToAll(apt)}
                    className="text-xs text-primary hover:underline"
                  >
                    Apply to all selected
                  </button>
                )}
              </div>

              {/* Max Capacity Input */}
              <div className="mb-4">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Maximum Capacity (students)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={apt.maxCapacity}
                  onChange={e => {
                    const max = parseInt(e.target.value) || 1;
                    const enabledCapacities = Array.from({ length: max }, (_, i) => i + 1);
                    updateApartment(apt.id, {
                      maxCapacity: max,
                      enabledCapacities,
                    });
                  }}
                  className="w-24"
                />
              </div>

              {/* Enabled Capacities */}
              <div className="mb-4">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Allowed Occupancies
                </Label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: apt.maxCapacity }, (_, i) => i + 1).map(cap => {
                    const isEnabled = apt.enabledCapacities?.includes(cap);
                    return (
                      <button
                        key={cap}
                        onClick={() => toggleCapacity(apt.id, cap)}
                        className={`
                          w-10 h-10 rounded-lg border-2 flex items-center justify-center
                          transition-all text-sm font-medium
                          ${isEnabled
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                          }
                        `}
                      >
                        {isEnabled && <Check className="w-4 h-4 absolute" />}
                        <span className={isEnabled ? 'opacity-0' : ''}>{cap}</span>
                        {isEnabled && <span className="text-xs">{cap}</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Select which occupancy levels you want to offer
                </p>
              </div>

              {/* Tiered Pricing Toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <Label className="text-sm font-medium">Enable Tiered Pricing</Label>
                  <p className="text-xs text-muted-foreground">
                    Set different prices per occupancy level
                  </p>
                </div>
                <Switch
                  checked={apt.enableTieredPricing}
                  onCheckedChange={checked =>
                    updateApartment(apt.id, { enableTieredPricing: checked })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
