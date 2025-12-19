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
      { value: 'nahr_ibrahim', label: 'Nahr Ibrahim' },
      { value: 'halat', label: 'Halat' },
      { value: 'jeddayel', label: 'Jeddayel' },
      { value: 'mastita', label: 'Mastita' },
      { value: 'fidar', label: 'Fidar' },
      { value: 'habboub', label: 'Habboub' }
    ],
    beirut: [
      { value: 'hamra', label: 'Hamra' },
      { value: 'manara', label: 'Manara' },
      { value: 'ain_el_mraisseh', label: 'Ain El Mraisseh' },
      { value: 'raoucheh', label: 'Raoucheh' },
      { value: 'ras_beirut', label: 'Ras Beirut' },
      { value: 'unesco', label: 'UNESCO' },
      { value: 'geitawi', label: 'Geitawi' },
      { value: 'dora', label: 'Dora' },
      { value: 'badaro', label: 'Badaro' },
      { value: 'ashrafieh', label: 'Ashrafieh' },
      { value: 'verdun', label: 'Verdun' },
      { value: 'sin_el_fil', label: 'Sin El Fil' },
      { value: 'dekwaneh', label: 'Dekwaneh' },
      { value: 'jdeideh', label: 'Jdeideh' },
      { value: 'mar_elias', label: 'Mar Elias' },
      { value: 'borj_hammoud', label: 'Borj Hammoud' },
      { value: 'hazmieh', label: 'Hazmieh' },
      { value: 'furn_el_chebbak', label: 'Furn El Chebbak' },
      { value: 'tayouneh', label: 'Tayouneh' },
      { value: 'jnah', label: 'Jnah' },
      { value: 'ras_al_nabaa', label: "Ras Al Naba'a" },
      { value: 'gemmayze', label: 'Gemmayze' },
      { value: 'clemenceau', label: 'Clemenceau' },
      { value: 'khalde', label: 'Khalde' }
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
