import { motion } from 'framer-motion';
import { MapPin, Bus, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { primaryLocations, areasByLocation, hasSubAreas, getSubAreas } from '@/data/listingLocations';
import { usePropertyTerminology } from '@/hooks/use-property-terminology';

interface LocationStepProps {
  city: string;
  area: string;
  subArea?: string;
  address: string;
  shuttle?: boolean;
  onCityChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onSubAreaChange?: (value: string) => void;
  onAddressChange: (value: string) => void;
  onShuttleChange?: (value: boolean) => void;
  propertyType?: string;
}

export function LocationStep({
  city,
  area,
  subArea = '',
  address,
  shuttle = false,
  onCityChange,
  onAreaChange,
  onSubAreaChange,
  onAddressChange,
  onShuttleChange,
  propertyType = 'dorm',
}: LocationStepProps) {
  const { dormLabel } = usePropertyTerminology(propertyType);
  const availableAreas = city ? areasByLocation[city] || [] : [];
  const showShuttleToggle = city === 'byblos';
  const showSubAreas = area && hasSubAreas(area);
  const availableSubAreas = area ? getSubAreas(area) : [];

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
            Where is your {dormLabel} located?
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Primary Location Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Primary Location
            </Label>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {primaryLocations.map((cityOption) => (
                <button
                  key={cityOption.value}
                  onClick={() => onCityChange(cityOption.value)}
                  className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[80px] text-left ${
                    city === cityOption.value
                      ? 'border-foreground bg-background shadow-sm'
                      : 'border-border hover:border-foreground/50'
                  }`}
                >
                  <span className={`font-medium text-base ${
                    city === cityOption.value ? 'text-foreground' : 'text-foreground'
                  }`}>
                    {cityOption.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Area Selection */}
          {city && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label className="text-sm font-medium mb-3 block">
                Area / Region
              </Label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-3 max-h-64 overflow-y-auto">
                {availableAreas.map((areaOption) => (
                  <button
                    key={areaOption}
                    onClick={() => onAreaChange(areaOption)}
                    className={`p-3 rounded-xl border transition-all text-left ${
                      area === areaOption
                        ? 'border-foreground bg-background shadow-sm'
                        : 'border-border hover:border-foreground/50'
                    }`}
                  >
                    <span className={`font-medium text-sm ${
                      area === areaOption ? 'text-foreground' : 'text-foreground'
                    }`}>
                      {areaOption}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Sub-Area Selection */}
          {showSubAreas && onSubAreaChange && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label className="text-sm font-medium mb-3 block">
                Sub-Area / Street
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {availableSubAreas.map((subAreaOption) => (
                  <button
                    key={subAreaOption}
                    onClick={() => onSubAreaChange(subAreaOption)}
                    className={`p-3 rounded-xl border transition-all text-left ${
                      subArea === subAreaOption
                        ? 'border-foreground bg-background shadow-sm'
                        : 'border-border hover:border-foreground/50'
                    }`}
                  >
                    <span className={`font-medium text-sm ${
                      subArea === subAreaOption ? 'text-foreground' : 'text-foreground'
                    }`}>
                      {subAreaOption}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Shuttle Service Toggle */}
          {showShuttleToggle && onShuttleChange && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between p-4 border rounded-xl bg-card">
                <div className="flex items-center gap-3">
                  <Bus className="w-5 h-5 text-foreground" />
                  <div>
                    <Label htmlFor="shuttle-mobile" className="font-medium text-sm">
                      Shuttle Service Available
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Transportation to nearby universities
                    </p>
                  </div>
                </div>
                <Switch
                  id="shuttle-mobile"
                  checked={shuttle}
                  onCheckedChange={onShuttleChange}
                />
              </div>
            </motion.div>
          )}

          {/* Address Input */}
          <div>
            <Label htmlFor="address" className="text-sm font-medium">
              Street Address (Optional)
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              placeholder="e.g., Main Street, Building 5"
              className="mt-2 h-12 text-base"
            />
            {/* Tip Box */}
            <div className="mt-3 p-3 rounded-xl bg-muted/50 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> Mention nearby landmarks.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
