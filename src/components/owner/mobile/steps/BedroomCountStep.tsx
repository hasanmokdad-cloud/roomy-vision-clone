import { useTranslation } from 'react-i18next';
import { BedDouble, Building2, Minus, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { WizardApartmentData, createEmptyBedroom } from '@/types/apartment';

interface BedroomCountStepProps {
  apartments: WizardApartmentData[];
  selectedIds: string[];
  onChange: (apartments: WizardApartmentData[]) => void;
}

export function BedroomCountStep({
  apartments,
  selectedIds,
  onChange,
}: BedroomCountStepProps) {
  const { t } = useTranslation();

  const selectedApartments = apartments.filter(a => selectedIds.includes(a.id));

  const updateBedroomCount = (apartmentId: string, count: number) => {
    onChange(
      apartments.map(apt => {
        if (apt.id !== apartmentId) return apt;

        const currentBedrooms = apt.bedrooms || [];
        let updatedBedrooms = [...currentBedrooms];

        if (count > currentBedrooms.length) {
          // Add new bedrooms
          for (let i = currentBedrooms.length; i < count; i++) {
            updatedBedrooms.push(createEmptyBedroom(apt.id, i));
          }
        } else if (count < currentBedrooms.length) {
          // Remove excess bedrooms
          updatedBedrooms = updatedBedrooms.slice(0, count);
        }

        return {
          ...apt,
          bedroomCount: count,
          bedrooms: updatedBedrooms,
        };
      })
    );
  };

  const applyToAll = (count: number) => {
    onChange(
      apartments.map(apt => {
        if (!selectedIds.includes(apt.id)) return apt;

        const updatedBedrooms = Array.from({ length: count }, (_, i) =>
          apt.bedrooms?.[i] || createEmptyBedroom(apt.id, i)
        );

        return {
          ...apt,
          bedroomCount: count,
          bedrooms: updatedBedrooms,
        };
      })
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BedDouble className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Bedroom Count
            </h2>
            <p className="text-sm text-muted-foreground">
              How many bedrooms in each apartment?
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 pb-24">
          {/* Quick apply buttons */}
          {selectedApartments.length > 1 && (
            <div className="p-4 rounded-xl border border-border bg-muted/30">
              <p className="text-sm font-medium mb-3">Quick apply to all selected:</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map(count => (
                  <Button
                    key={count}
                    variant="outline"
                    size="sm"
                    onClick={() => applyToAll(count)}
                    className="h-9"
                  >
                    {count} bedroom{count !== 1 ? 's' : ''}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {selectedApartments.map(apt => (
            <div
              key={apt.id}
              className="p-4 rounded-xl border border-border bg-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">{apt.name}</span>
                  {apt.type && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {apt.type}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() =>
                      updateBedroomCount(apt.id, Math.max(1, (apt.bedroomCount || 1) - 1))
                    }
                    disabled={(apt.bedroomCount || 1) <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>

                  <div className="w-12 text-center">
                    <span className="text-xl font-semibold">
                      {apt.bedroomCount || 1}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() =>
                      updateBedroomCount(apt.id, Math.min(10, (apt.bedroomCount || 1) + 1))
                    }
                    disabled={(apt.bedroomCount || 1) >= 10}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {apt.bedroomCount > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: apt.bedroomCount || 1 }, (_, i) => (
                      <div
                        key={i}
                        className="px-3 py-1.5 rounded-lg bg-muted text-sm flex items-center gap-1.5"
                      >
                        <BedDouble className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Bedroom {i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
