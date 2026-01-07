import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Building2, Home, Maximize, Minimize, Castle, Layers } from 'lucide-react';
import { WizardApartmentData, APARTMENT_TYPES } from '@/types/apartment';
import { cn } from '@/lib/utils';

interface ApartmentTypesStepProps {
  apartments: WizardApartmentData[];
  onChange: (apartments: WizardApartmentData[]) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  small: <Minimize className="w-4 h-4" />,
  medium: <Home className="w-4 h-4" />,
  large: <Maximize className="w-4 h-4" />,
  studio: <Layers className="w-4 h-4" />,
  penthouse: <Castle className="w-4 h-4" />,
};

export function ApartmentTypesStep({ apartments, onChange }: ApartmentTypesStepProps) {
  const updateApartmentType = (apartmentId: string, type: string) => {
    onChange(
      apartments.map(apt =>
        apt.id === apartmentId ? { ...apt, type } : apt
      )
    );
  };

  const applyTypeToAll = (type: string) => {
    onChange(apartments.map(apt => ({ ...apt, type })));
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
                Apartment types
              </h1>
              <p className="text-muted-foreground">
                Categorize your apartments (optional)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick apply to all */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border border-border bg-muted/30 mb-6"
        >
          <p className="text-sm font-medium mb-3">Quick apply to all:</p>
          <div className="flex flex-wrap gap-2">
            {APARTMENT_TYPES.map(type => (
              <Button
                key={type.value}
                variant="outline"
                size="sm"
                onClick={() => applyTypeToAll(type.value)}
                className="gap-1.5"
              >
                {typeIcons[type.value]}
                {type.label}
              </Button>
            ))}
          </div>
        </motion.div>

        <ScrollArea className="h-[calc(100vh-420px)]">
          <div className="space-y-4 pr-4">
            {apartments.map((apt, index) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="p-4 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="font-medium">{apt.name || `Apartment ${index + 1}`}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {APARTMENT_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => updateApartmentType(apt.id, type.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                        apt.type === type.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      )}
                    >
                      {typeIcons[type.value]}
                      {type.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
