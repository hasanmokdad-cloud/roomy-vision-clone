import { useTranslation } from 'react-i18next';
import { BedDouble, Building2, Settings2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { WizardApartmentData, WizardBedroomData, BED_TYPES, PRICING_MODES } from '@/types/apartment';

interface BedroomConfigStepProps {
  apartments: WizardApartmentData[];
  selectedIds: string[];
  onChange: (apartments: WizardApartmentData[]) => void;
}

export function BedroomConfigStep({
  apartments,
  selectedIds,
  onChange,
}: BedroomConfigStepProps) {
  const { t } = useTranslation();

  const selectedApartments = apartments.filter(a => selectedIds.includes(a.id));

  const updateBedroom = (
    apartmentId: string,
    bedroomId: string,
    updates: Partial<WizardBedroomData>
  ) => {
    onChange(
      apartments.map(apt => {
        if (apt.id !== apartmentId) return apt;
        return {
          ...apt,
          bedrooms: apt.bedrooms.map(br =>
            br.id === bedroomId ? { ...br, ...updates } : br
          ),
        };
      })
    );
  };

  const applyConfigToAll = (sourceApt: WizardApartmentData, sourceBedroom: WizardBedroomData) => {
    onChange(
      apartments.map(apt => {
        if (!selectedIds.includes(apt.id)) return apt;
        return {
          ...apt,
          bedrooms: apt.bedrooms.map(br => ({
            ...br,
            bedType: sourceBedroom.bedType,
            baseCapacity: sourceBedroom.baseCapacity,
            maxCapacity: sourceBedroom.maxCapacity,
            allowExtraBeds: sourceBedroom.allowExtraBeds,
            pricingMode: sourceBedroom.pricingMode,
          })),
        };
      })
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Configure Bedrooms
            </h2>
            <p className="text-sm text-muted-foreground">
              Set bed type, capacity, and pricing mode
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 pb-24">
          {selectedApartments.map(apt => (
            <div key={apt.id} className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="font-semibold text-lg">{apt.name}</span>
              </div>

              {apt.bedrooms.map((bedroom, brIndex) => (
                <div
                  key={bedroom.id}
                  className="p-4 rounded-xl border border-border bg-card"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BedDouble className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{bedroom.name}</span>
                    </div>
                    {brIndex === 0 && (
                      <button
                        onClick={() => applyConfigToAll(apt, bedroom)}
                        className="text-xs text-primary hover:underline"
                      >
                        Apply to all bedrooms
                      </button>
                    )}
                  </div>

                  {/* Bed Type */}
                  <div className="mb-4">
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Bed Type
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {BED_TYPES.map(type => (
                        <button
                          key={type.value}
                          onClick={() =>
                            updateBedroom(apt.id, bedroom.id, {
                              bedType: type.value,
                              baseCapacity: type.defaultCapacity,
                              maxCapacity: type.defaultCapacity,
                            })
                          }
                          className={`
                            px-3 py-2 rounded-lg border text-sm transition-all
                            ${bedroom.bedType === type.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-background hover:border-primary/50'
                            }
                          `}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1 block">
                        Base Capacity
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={4}
                        value={bedroom.baseCapacity}
                        onChange={e =>
                          updateBedroom(apt.id, bedroom.id, {
                            baseCapacity: parseInt(e.target.value) || 1,
                          })
                        }
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1 block">
                        Max Capacity
                      </Label>
                      <Input
                        type="number"
                        min={bedroom.baseCapacity}
                        max={6}
                        value={bedroom.maxCapacity}
                        onChange={e =>
                          updateBedroom(apt.id, bedroom.id, {
                            maxCapacity: parseInt(e.target.value) || bedroom.baseCapacity,
                          })
                        }
                        className="h-9"
                      />
                    </div>
                  </div>

                  {/* Extra Beds Toggle */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                    <div>
                      <Label className="text-sm font-medium">Allow Extra Beds</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable if max capacity is greater than base
                      </p>
                    </div>
                    <Switch
                      checked={bedroom.allowExtraBeds}
                      onCheckedChange={checked =>
                        updateBedroom(apt.id, bedroom.id, { allowExtraBeds: checked })
                      }
                    />
                  </div>

                  {/* Pricing Mode */}
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Pricing Mode
                    </Label>
                    <div className="space-y-2">
                      {PRICING_MODES.map(mode => (
                        <button
                          key={mode.value}
                          onClick={() =>
                            updateBedroom(apt.id, bedroom.id, { pricingMode: mode.value })
                          }
                          className={`
                            w-full p-3 rounded-lg border text-left transition-all
                            ${bedroom.pricingMode === mode.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-background hover:border-primary/50'
                            }
                          `}
                        >
                          <div className="font-medium text-sm">{mode.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {mode.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
