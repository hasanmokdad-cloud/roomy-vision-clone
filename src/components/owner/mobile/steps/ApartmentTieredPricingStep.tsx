import { useTranslation } from 'react-i18next';
import { DollarSign, Building2, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WizardApartmentData, ApartmentPricingTier } from '@/types/apartment';

interface ApartmentTieredPricingStepProps {
  apartments: WizardApartmentData[];
  selectedIds: string[];
  onChange: (apartments: WizardApartmentData[]) => void;
}

export function ApartmentTieredPricingStep({
  apartments,
  selectedIds,
  onChange,
}: ApartmentTieredPricingStepProps) {
  const { t } = useTranslation();

  // Only show apartments with tiered pricing enabled
  const tieredApartments = apartments.filter(
    a => selectedIds.includes(a.id) && a.enableTieredPricing
  );

  const updatePricingTier = (
    apartmentId: string,
    capacity: number,
    field: 'monthlyPrice' | 'deposit',
    value: number
  ) => {
    onChange(
      apartments.map(apt => {
        if (apt.id !== apartmentId) return apt;

        const existingTiers = apt.pricingTiers || [];
        const tierIndex = existingTiers.findIndex(t => t.capacity === capacity);

        let updatedTiers: ApartmentPricingTier[];
        if (tierIndex >= 0) {
          updatedTiers = existingTiers.map((tier, i) =>
            i === tierIndex ? { ...tier, [field]: value } : tier
          );
        } else {
          updatedTiers = [
            ...existingTiers,
            {
              capacity,
              monthlyPrice: field === 'monthlyPrice' ? value : 0,
              deposit: field === 'deposit' ? value : 0,
            },
          ].sort((a, b) => a.capacity - b.capacity);
        }

        return { ...apt, pricingTiers: updatedTiers };
      })
    );
  };

  const getTierValue = (
    apt: WizardApartmentData,
    capacity: number,
    field: 'monthlyPrice' | 'deposit'
  ): number => {
    const tier = apt.pricingTiers?.find(t => t.capacity === capacity);
    return tier?.[field] || 0;
  };

  const applyToAll = (sourceApt: WizardApartmentData) => {
    onChange(
      apartments.map(apt =>
        selectedIds.includes(apt.id) && apt.enableTieredPricing
          ? { ...apt, pricingTiers: [...(sourceApt.pricingTiers || [])] }
          : apt
      )
    );
  };

  if (tieredApartments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <DollarSign className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-center mb-2">No Tiered Pricing</h2>
        <p className="text-muted-foreground text-center">
          None of the selected apartments have tiered pricing enabled.
          Go back to enable tiered pricing first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Tiered Pricing
            </h2>
            <p className="text-sm text-muted-foreground">
              Set prices for each occupancy level
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 pb-24">
          {tieredApartments.map((apt, index) => (
            <div
              key={apt.id}
              className="p-4 rounded-xl border border-border bg-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">{apt.name}</span>
                </div>
                {index === 0 && tieredApartments.length > 1 && (
                  <button
                    onClick={() => applyToAll(apt)}
                    className="text-xs text-primary hover:underline"
                  >
                    Apply prices to all
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {apt.enabledCapacities?.map(capacity => (
                  <div
                    key={capacity}
                    className="p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {capacity} {capacity === 1 ? 'Student' : 'Students'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">
                          Monthly Price ($)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={getTierValue(apt, capacity, 'monthlyPrice') || ''}
                          onChange={e =>
                            updatePricingTier(
                              apt.id,
                              capacity,
                              'monthlyPrice',
                              parseFloat(e.target.value) || 0
                            )
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
                          value={getTierValue(apt, capacity, 'deposit') || ''}
                          onChange={e =>
                            updatePricingTier(
                              apt.id,
                              capacity,
                              'deposit',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
