import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WizardApartmentData, WizardBedData, BED_TYPES, createEmptyBed } from '@/types/apartment';
import { Plus, Trash2 } from 'lucide-react';

interface BedSetupStepProps {
  apartments: WizardApartmentData[];
  selectedIds: string[];
  onChange: (apartments: WizardApartmentData[]) => void;
}

export function BedSetupStep({ apartments, selectedIds, onChange }: BedSetupStepProps) {
  const selectedApartments = apartments.filter(a => selectedIds.includes(a.id));

  // Filter to apartments that have bed reservation enabled or per_bed pricing mode
  const apartmentsNeedingBeds = selectedApartments.filter(apt =>
    apt.enableBedReservation ||
    apt.bedrooms.some(br => br.pricingMode === 'per_bed' || br.pricingMode === 'both')
  );

  const updateBed = (apartmentId: string, bedroomId: string, bedId: string, updates: Partial<WizardBedData>) => {
    onChange(apartments.map(apt => {
      if (apt.id !== apartmentId) return apt;
      return {
        ...apt,
        bedrooms: apt.bedrooms.map(br => {
          if (br.id !== bedroomId) return br;
          return {
            ...br,
            beds: br.beds.map(bed =>
              bed.id === bedId ? { ...bed, ...updates } : bed
            ),
          };
        }),
      };
    }));
  };

  const addBed = (apartmentId: string, bedroomId: string) => {
    onChange(apartments.map(apt => {
      if (apt.id !== apartmentId) return apt;
      return {
        ...apt,
        bedrooms: apt.bedrooms.map(br => {
          if (br.id !== bedroomId) return br;
          const newBed = createEmptyBed(bedroomId, br.beds.length);
          return {
            ...br,
            beds: [...br.beds, newBed],
          };
        }),
      };
    }));
  };

  const removeBed = (apartmentId: string, bedroomId: string, bedId: string) => {
    onChange(apartments.map(apt => {
      if (apt.id !== apartmentId) return apt;
      return {
        ...apt,
        bedrooms: apt.bedrooms.map(br => {
          if (br.id !== bedroomId) return br;
          return {
            ...br,
            beds: br.beds.filter(bed => bed.id !== bedId),
          };
        }),
      };
    }));
  };

  if (apartmentsNeedingBeds.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <p className="text-muted-foreground text-center">
          No apartments require individual bed setup.
          <br />
          Enable per-bed pricing or bed reservation to configure beds.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Setup Individual Beds</h2>
        <p className="text-sm text-muted-foreground">Configure beds for per-bed pricing</p>
        <p className="text-xs text-amber-600 mt-1">
          ⚠️ Bed type is descriptive only. Capacity is set by you.
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {apartmentsNeedingBeds.map(apt => (
            <div key={apt.id} className="border rounded-lg p-4">
              <h3 className="font-medium text-base mb-4">{apt.name}</h3>

              {apt.bedrooms
                .filter(br => br.pricingMode === 'per_bed' || br.pricingMode === 'both' || apt.enableBedReservation)
                .map(bedroom => (
                  <div key={bedroom.id} className="mb-6 last:mb-0 pb-4 border-b last:border-b-0">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-sm">{bedroom.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addBed(apt.id, bedroom.id)}
                        className="h-7 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Bed
                      </Button>
                    </div>

                    {bedroom.beds.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">
                        No beds configured. Add beds to set individual pricing.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {bedroom.beds.map((bed, bedIndex) => (
                          <div key={bed.id} className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-3">
                              <Input
                                value={bed.label}
                                onChange={(e) => updateBed(apt.id, bedroom.id, bed.id, {
                                  label: e.target.value,
                                })}
                                className="h-8 w-28 text-sm font-medium"
                                placeholder="Bed label"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBed(apt.id, bedroom.id, bed.id)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Bed Type - DESCRIPTIVE ONLY */}
                            <div className="mb-3">
                              <Label className="text-xs text-muted-foreground mb-1.5 block">
                                Type <span className="text-amber-600">(descriptive)</span>
                              </Label>
                              <div className="flex flex-wrap gap-1.5">
                                {BED_TYPES.map(type => (
                                  <button
                                    key={type.value}
                                    onClick={() => updateBed(apt.id, bedroom.id, bed.id, {
                                      bedType: type.value,
                                      // CRITICAL: Do NOT auto-set capacity
                                    })}
                                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                                      bed.bedType === type.value
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background hover:bg-muted border-border'
                                    }`}
                                  >
                                    {type.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Capacity Contribution - OWNER DEFINED */}
                            <div className="mb-3">
                              <Label className="text-xs text-muted-foreground">
                                Capacity Contribution
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                max={4}
                                value={bed.capacityContribution}
                                onChange={(e) => updateBed(apt.id, bedroom.id, bed.id, {
                                  capacityContribution: parseInt(e.target.value) || 1,
                                })}
                                className="h-8 w-20 mt-1"
                              />
                            </div>

                            {/* Price & Deposit */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Monthly Price</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  value={bed.monthlyPrice || ''}
                                  onChange={(e) => updateBed(apt.id, bedroom.id, bed.id, {
                                    monthlyPrice: parseFloat(e.target.value) || undefined,
                                  })}
                                  placeholder="$0"
                                  className="h-8 mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Deposit</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  value={bed.deposit || ''}
                                  onChange={(e) => updateBed(apt.id, bedroom.id, bed.id, {
                                    deposit: parseFloat(e.target.value) || undefined,
                                  })}
                                  placeholder="$0"
                                  className="h-8 mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
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

export default BedSetupStep;
