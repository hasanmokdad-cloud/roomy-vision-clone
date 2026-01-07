import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Building2, Home, BedDouble, Bed, AlertCircle, Copy } from 'lucide-react';
import { WizardApartmentData } from '@/types/apartment';
import { cn } from '@/lib/utils';

interface ApartmentReservationModesStepProps {
  apartments: WizardApartmentData[];
  selectedIds: string[];
  onChange: (apartments: WizardApartmentData[]) => void;
}

export function ApartmentReservationModesStep({
  apartments,
  selectedIds,
  onChange,
}: ApartmentReservationModesStepProps) {
  const selectedApartments = apartments.filter(a => selectedIds.includes(a.id));

  const updateApartment = (apartmentId: string, updates: Partial<WizardApartmentData>) => {
    onChange(
      apartments.map(apt =>
        apt.id === apartmentId ? { ...apt, ...updates } : apt
      )
    );
  };

  const applyToAll = (source: WizardApartmentData) => {
    onChange(
      apartments.map(apt => {
        if (!selectedIds.includes(apt.id)) return apt;
        return {
          ...apt,
          enableFullApartmentReservation: source.enableFullApartmentReservation,
          enableBedroomReservation: source.enableBedroomReservation,
          enableBedReservation: source.enableBedReservation,
        };
      })
    );
  };

  const hasAnyModeEnabled = (apt: WizardApartmentData) => {
    return apt.enableFullApartmentReservation || apt.enableBedroomReservation || apt.enableBedReservation;
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
                Reservation modes
              </h1>
              <p className="text-muted-foreground">
                How can students reserve your apartments?
              </p>
            </div>
          </div>
        </motion.div>

        {/* FLEX MODE info banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 mb-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                Availability Rules
              </p>
              <ul className="text-amber-700 dark:text-amber-300 space-y-1">
                <li>• Full apartment reservation auto-hides when any bed is reserved</li>
                <li>• Bedroom reservation hides when bedroom is booked as a whole</li>
              </ul>
            </div>
          </div>
        </motion.div>

        <ScrollArea className="h-[calc(100vh-450px)]">
          <div className="space-y-4 pr-4">
            {selectedApartments.map((apt, index) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "p-4 rounded-xl border bg-card",
                  !hasAnyModeEnabled(apt) ? "border-destructive/50" : "border-border"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="font-medium">{apt.name}</span>
                  </div>
                  {selectedApartments.length > 1 && index === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applyToAll(apt)}
                      className="h-7 text-xs gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Apply to all
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Full Apartment */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Home className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Full Apartment</p>
                        <p className="text-xs text-muted-foreground">Reserve the entire apartment</p>
                      </div>
                    </div>
                    <Switch
                      checked={apt.enableFullApartmentReservation}
                      onCheckedChange={(checked) => 
                        updateApartment(apt.id, { enableFullApartmentReservation: checked })
                      }
                    />
                  </div>

                  {/* Bedroom */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BedDouble className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Bedroom</p>
                        <p className="text-xs text-muted-foreground">Reserve individual bedrooms</p>
                      </div>
                    </div>
                    <Switch
                      checked={apt.enableBedroomReservation}
                      onCheckedChange={(checked) => 
                        updateApartment(apt.id, { enableBedroomReservation: checked })
                      }
                    />
                  </div>

                  {/* Bed */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bed className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Bed</p>
                        <p className="text-xs text-muted-foreground">Reserve individual beds</p>
                      </div>
                    </div>
                    <Switch
                      checked={apt.enableBedReservation}
                      onCheckedChange={(checked) => 
                        updateApartment(apt.id, { enableBedReservation: checked })
                      }
                    />
                  </div>
                </div>

                {!hasAnyModeEnabled(apt) && (
                  <div className="mt-3 pt-3 border-t border-destructive/30">
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      At least one reservation mode must be enabled
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
