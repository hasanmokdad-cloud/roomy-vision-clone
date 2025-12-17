import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LocationPreferencesStepProps {
  data: {
    city: string;
    preferred_housing_area: string;
  };
  onChange: (data: Partial<LocationPreferencesStepProps['data']>) => void;
}

const LocationPreferencesStep = ({ data, onChange }: LocationPreferencesStepProps) => {
  const cities = [
    { value: 'byblos', label: 'Byblos' },
    { value: 'beirut', label: 'Beirut' }
  ];

  // Areas by city
  const areasByCity: Record<string, Array<{ value: string; label: string }>> = {
    byblos: [
      { value: 'blat', label: 'Blat' },
      { value: 'byblos_area', label: 'Byblos Area' },
      { value: 'jbeil', label: 'Jbeil' },
      { value: 'fidar', label: 'Fidar' },
      { value: 'amchit', label: 'Amchit' },
      { value: 'anywhere_byblos', label: 'Anywhere in Byblos' }
    ],
    beirut: [
      { value: 'hamra', label: 'Hamra' },
      { value: 'achrafieh', label: 'Achrafieh' },
      { value: 'verdun', label: 'Verdun' },
      { value: 'manara', label: 'Manara' },
      { value: 'badaro', label: 'Badaro' },
      { value: 'gemmayzeh', label: 'Gemmayzeh' },
      { value: 'mar_mikhael', label: 'Mar Mikhael' },
      { value: 'anywhere_beirut', label: 'Anywhere in Beirut' }
    ]
  };

  const areas = data.city ? areasByCity[data.city] || [] : [];

  return (
    <div className="px-6 pt-20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Location preferences
        </h2>
        <p className="text-muted-foreground mb-8">
          We'll prioritize dorms in these areas for your matches
        </p>

        {/* City Selection */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">City</Label>
          <div className="grid grid-cols-2 gap-3">
            {cities.map((city) => (
              <motion.button
                key={city.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange({ city: city.value, preferred_housing_area: '' })}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  data.city === city.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <span className="font-medium text-foreground text-lg">{city.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Area Selection */}
        <div>
          <Label className="text-base font-medium">Preferred Area</Label>
          <Select
            value={data.preferred_housing_area}
            onValueChange={(value) => onChange({ preferred_housing_area: value })}
            disabled={!data.city}
          >
            <SelectTrigger className="mt-2 h-12 text-base">
              <SelectValue placeholder={data.city ? "Select your preferred area" : "Select a city first"} />
            </SelectTrigger>
            <SelectContent>
              {areas.map((area) => (
                <SelectItem key={area.value} value={area.value}>
                  {area.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>
    </div>
  );
};

export default LocationPreferencesStep;
