import { useTranslation } from 'react-i18next';
import { BedDouble, Building2, Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { WizardApartmentData, WizardBedroomData } from '@/types/apartment';

interface BedroomNamesStepProps {
  apartments: WizardApartmentData[];
  selectedIds: string[];
  onChange: (apartments: WizardApartmentData[]) => void;
}

export function BedroomNamesStep({
  apartments,
  selectedIds,
  onChange,
}: BedroomNamesStepProps) {
  const { t } = useTranslation();

  const selectedApartments = apartments.filter(a => selectedIds.includes(a.id));

  const updateBedroomName = (apartmentId: string, bedroomId: string, name: string) => {
    onChange(
      apartments.map(apt => {
        if (apt.id !== apartmentId) return apt;
        return {
          ...apt,
          bedrooms: apt.bedrooms.map(br =>
            br.id === bedroomId ? { ...br, name } : br
          ),
        };
      })
    );
  };

  const autoNameBedrooms = (apartmentId: string, style: 'numbered' | 'descriptive') => {
    onChange(
      apartments.map(apt => {
        if (apt.id !== apartmentId) return apt;

        const names =
          style === 'numbered'
            ? apt.bedrooms.map((_, i) => `Bedroom ${i + 1}`)
            : apt.bedrooms.length <= 3
            ? ['Master Bedroom', 'Second Bedroom', 'Third Bedroom'].slice(0, apt.bedrooms.length)
            : apt.bedrooms.map((_, i) => (i === 0 ? 'Master Bedroom' : `Bedroom ${i + 1}`));

        return {
          ...apt,
          bedrooms: apt.bedrooms.map((br, i) => ({ ...br, name: names[i] })),
        };
      })
    );
  };

  const autoNameAllDescriptive = () => {
    onChange(
      apartments.map(apt => {
        if (!selectedIds.includes(apt.id)) return apt;

        const names =
          apt.bedrooms.length <= 3
            ? ['Master Bedroom', 'Second Bedroom', 'Third Bedroom'].slice(0, apt.bedrooms.length)
            : apt.bedrooms.map((_, i) => (i === 0 ? 'Master Bedroom' : `Bedroom ${i + 1}`));

        return {
          ...apt,
          bedrooms: apt.bedrooms.map((br, i) => ({ ...br, name: names[i] })),
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
              Name Bedrooms
            </h2>
            <p className="text-sm text-muted-foreground">
              Give each bedroom a name
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 pb-24">
          {/* Quick apply all */}
          {selectedApartments.length > 1 && (
            <div className="p-4 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Quick apply to all:</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={autoNameAllDescriptive}
              >
                Auto-name (Master, Second, Third...)
              </Button>
            </div>
          )}

          {selectedApartments.map(apt => (
            <div
              key={apt.id}
              className="p-4 rounded-xl border border-border bg-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">{apt.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => autoNameBedrooms(apt.id, 'numbered')}
                    className="h-7 text-xs"
                  >
                    1, 2, 3...
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => autoNameBedrooms(apt.id, 'descriptive')}
                    className="h-7 text-xs"
                  >
                    Master, Second...
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {apt.bedrooms.map((bedroom, i) => (
                  <div key={bedroom.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                      {i + 1}
                    </div>
                    <Input
                      value={bedroom.name}
                      onChange={e => updateBedroomName(apt.id, bedroom.id, e.target.value)}
                      placeholder={`Bedroom ${i + 1}`}
                      className="flex-1"
                    />
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
