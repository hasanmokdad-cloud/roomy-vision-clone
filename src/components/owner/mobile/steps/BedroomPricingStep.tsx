import { useTranslation } from 'react-i18next';
import { DollarSign, BedDouble, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WizardApartmentData, WizardBedroomData } from '@/types/apartment';

interface BedroomPricingStepProps {
  apartments: WizardApartmentData[];
  selectedIds: string[];
  onChange: (apartments: WizardApartmentData[]) => void;
}

export function BedroomPricingStep({
  apartments,
  selectedIds,
  onChange,
}: BedroomPricingStepProps) {
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

  const applyPricingToAll = (sourceBedroom: WizardBedroomData) => {
    onChange(
      apartments.map(apt => {
        if (!selectedIds.includes(apt.id)) return apt;
        return {
          ...apt,
          bedrooms: apt.bedrooms.map(br => ({
            ...br,
            bedroomPrice: sourceBedroom.bedroomPrice,
            bedroomDeposit: sourceBedroom.bedroomDeposit,
            bedPrice: sourceBedroom.bedPrice,
            bedDeposit: sourceBedroom.bedDeposit,
          })),
        };
      })
    );
  };

  const getPricingModeLabel = (mode: string) => {
    switch (mode) {
      case 'per_bed':
        return 'Per Bed';
      case 'per_bedroom':
        return 'Per Bedroom';
      case 'both':
        return 'Both Options';
      default:
        return mode;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Bedroom Pricing
            </h2>
            <p className="text-sm text-muted-foreground">
              Set prices based on pricing mode
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
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BedDouble className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{bedroom.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {getPricingModeLabel(bedroom.pricingMode)}
                      </span>
                    </div>
                    {brIndex === 0 && (
                      <button
                        onClick={() => applyPricingToAll(bedroom)}
                        className="text-xs text-primary hover:underline"
                      >
                        Apply to all
                      </button>
                    )}
                  </div>

                  {/* Per Bedroom Pricing */}
                  {(bedroom.pricingMode === 'per_bedroom' || bedroom.pricingMode === 'both') && (
                    <div className="p-3 rounded-lg bg-muted/50 mb-3">
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                        Whole Bedroom Price
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Monthly ($)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={bedroom.bedroomPrice || ''}
                            onChange={e =>
                              updateBedroom(apt.id, bedroom.id, {
                                bedroomPrice: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0"
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Deposit ($)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={bedroom.bedroomDeposit || ''}
                            onChange={e =>
                              updateBedroom(apt.id, bedroom.id, {
                                bedroomDeposit: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0"
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Per Bed Pricing */}
                  {(bedroom.pricingMode === 'per_bed' || bedroom.pricingMode === 'both') && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                        Per Bed Price
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Monthly ($)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={bedroom.bedPrice || ''}
                            onChange={e =>
                              updateBedroom(apt.id, bedroom.id, {
                                bedPrice: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0"
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Deposit ($)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={bedroom.bedDeposit || ''}
                            onChange={e =>
                              updateBedroom(apt.id, bedroom.id, {
                                bedDeposit: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0"
                            className="h-9"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Max capacity: {bedroom.maxCapacity} bed{bedroom.maxCapacity !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
