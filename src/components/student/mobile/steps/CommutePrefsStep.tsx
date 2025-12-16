import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { MapPin, Footprints, Bus, Car } from 'lucide-react';

interface CommutePrefsStepProps {
  data: {
    preferred_housing_area: string;
    distance_preference: string;
  };
  onChange: (data: Partial<CommutePrefsStepProps['data']>) => void;
}

const CommutePrefsStep = ({ data, onChange }: CommutePrefsStepProps) => {
  const areaOptions = [
    { value: 'blat', label: 'Blat', description: 'Near LAU Byblos' },
    { value: 'byblos', label: 'Byblos Area', description: 'Jbeil region' },
    { value: 'beirut', label: 'Beirut', description: 'Capital city' },
    { value: 'hamra', label: 'Hamra', description: 'Near AUB' },
    { value: 'achrafieh', label: 'Achrafieh', description: 'East Beirut' },
    { value: 'anywhere', label: 'Anywhere', description: 'Flexible location' }
  ];

  const distanceOptions = [
    { value: 'walking', label: 'Walking distance', icon: Footprints, description: '< 15 min walk' },
    { value: 'shuttle', label: 'Shuttle OK', icon: Bus, description: 'Don\'t mind commuting' },
    { value: 'anywhere', label: 'Anywhere', icon: Car, description: 'Distance doesn\'t matter' }
  ];

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

        {/* Preferred Area */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">Preferred housing area</Label>
          <div className="grid grid-cols-2 gap-2">
            {areaOptions.map((option) => (
              <motion.button
                key={option.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange({ preferred_housing_area: option.value })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  data.preferred_housing_area === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className={`w-4 h-4 ${
                    data.preferred_housing_area === option.value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <span className="font-medium text-foreground">{option.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Distance Preference */}
        <div>
          <Label className="text-base font-medium mb-3 block">Distance from university</Label>
          <div className="grid grid-cols-1 gap-2">
            {distanceOptions.map((option) => (
              <motion.button
                key={option.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange({ distance_preference: option.value })}
                className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                  data.distance_preference === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  data.distance_preference === option.value ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <option.icon className={`w-6 h-6 ${
                    data.distance_preference === option.value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="text-left">
                  <span className="font-medium text-foreground block">{option.label}</span>
                  <span className="text-sm text-muted-foreground">{option.description}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CommutePrefsStep;
