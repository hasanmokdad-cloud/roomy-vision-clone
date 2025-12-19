import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LocationStepProps {
  city: string;
  area: string;
  address: string;
  onCityChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onAddressChange: (value: string) => void;
}

const cities = [
  { value: 'beirut', label: 'Beirut' },
  { value: 'byblos', label: 'Byblos' },
];

const areasByCity: Record<string, string[]> = {
  beirut: [
    'Hamra',
    'Manara',
    'Ain El Mraisseh',
    'Raoucheh',
    'Ras Beirut',
    'UNESCO',
    'Geitawi',
    'Dora',
    'Badaro',
    'Ashrafieh',
    'Verdun',
    'Sin El Fil',
    'Dekwaneh',
    'Jdeideh',
    'Mar Elias',
    'Borj Hammoud',
    'Hazmieh',
    'Furn El Chebbak',
    'Tayouneh',
    'Jnah',
    "Ras Al Naba'a",
    'Gemmayze',
    'Clemenceau',
    'Khalde',
  ],
  byblos: [
    'Blat',
    'Nahr Ibrahim',
    'Halat',
    'Jeddayel',
    'Mastita',
    'Fidar',
    'Habboub',
  ],
};

export function LocationStep({
  city,
  area,
  address,
  onCityChange,
  onAreaChange,
  onAddressChange,
}: LocationStepProps) {
  const availableAreas = city ? areasByCity[city] || [] : [];

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
