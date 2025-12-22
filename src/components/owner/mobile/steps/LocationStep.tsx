import { motion } from 'framer-motion';
import { MapPin, Bus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cities, areasByCity } from '@/data/dormLocations';

interface LocationStepProps {
  city: string;
  area: string;
  address: string;
  shuttle?: boolean;
  onCityChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onShuttleChange?: (value: boolean) => void;
}

export function LocationStep({
  city,
  area,
  address,
  shuttle = false,
  onCityChange,
  onAreaChange,
  onAddressChange,
  onShuttleChange,
}: LocationStepProps) {
  const availableAreas = city ? areasByCity[city] || [] : [];
  const showShuttleToggle = city === 'byblos';

  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Where is your dorm located?
        </h1>
        <p className="text-muted-foreground">
          Help students find you easily
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        {/* City Selection */}
        <div>
          <Label className="text-base font-medium mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            City
          </Label>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {cities.map((cityOption) => (
              <button
                key={cityOption.value}
                onClick={() => onCityChange(cityOption.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  city === cityOption.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className={`font-medium text-lg ${
                  city === cityOption.value ? 'text-primary' : 'text-foreground'
                }`}>
                  {cityOption.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Area Selection - only show after city is selected */}
        {city && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Label className="text-base font-medium mb-3 block">
              Area / Region
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-3 max-h-64 overflow-y-auto">
              {availableAreas.map((areaOption) => (
                <button
                  key={areaOption}
                  onClick={() => onAreaChange(areaOption)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    area === areaOption
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className={`font-medium ${
                    area === areaOption ? 'text-primary' : 'text-foreground'
                  }`}>
                    {areaOption}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Shuttle Service Toggle - only show for Byblos */}
        {showShuttleToggle && onShuttleChange && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between p-4 border-2 rounded-xl bg-card">
              <div className="flex items-center gap-3">
                <Bus className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="shuttle-mobile" className="font-medium">
                    Shuttle Service Available
                  </Label>
                  <p className="text-sm text-muted-foreground">
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
          <Label htmlFor="address" className="text-base font-medium">
            Street Address (Optional)
          </Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="e.g., Main Street, Building 5"
            className="mt-2 h-12 text-base"
          />
        </div>
      </motion.div>
    </div>
  );
}
