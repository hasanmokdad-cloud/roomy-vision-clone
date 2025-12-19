import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Users, Sparkles, MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { roomTypes, isSingleRoom } from '@/data/roomTypes';

interface HousingPreferencesStepProps {
  data: {
    budget: number;
    room_type: string;
    city: string;
    preferred_housing_area: string;
    needs_roommate: boolean;
    enable_personality_matching: boolean;
  };
  onChange: (data: Partial<HousingPreferencesStepProps['data']>) => void;
}

const HousingPreferencesStep = ({ data, onChange }: HousingPreferencesStepProps) => {
  const budgetPresets = [300, 500, 800, 1000];

  const cities = [
    { value: 'byblos', label: 'Byblos' },
    { value: 'beirut', label: 'Beirut' }
  ];

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

  // Check if room type is single (no roommate toggle)
  const isSingleRoomType = isSingleRoom(data.room_type || '');

  return (
    <div className="px-6 pt-20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Housing preferences
        </h2>
        <p className="text-muted-foreground mb-8">
          Find dorms that fit your needs
        </p>

        {/* Budget */}
        <div className="mb-8">
          <Label className="text-base font-medium mb-3 block">Monthly budget</Label>
          
          {/* Current value display */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <DollarSign className="w-8 h-8 text-primary" />
            <span className="text-5xl font-bold text-foreground">{data.budget}</span>
            <span className="text-muted-foreground text-lg">/mo</span>
          </div>

          {/* Slider */}
          <Slider
            value={[data.budget]}
            onValueChange={(value) => onChange({ budget: value[0] })}
            min={100}
            max={2000}
            step={25}
            className="mb-4"
          />

          {/* Quick presets */}
          <div className="flex gap-2 justify-center flex-wrap">
            {budgetPresets.map((preset) => (
              <motion.button
                key={preset}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange({ budget: preset })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  data.budget === preset
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                ${preset}
              </motion.button>
            ))}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ budget: 1500 })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                data.budget >= 1200
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              $1200+
            </motion.button>
          </div>
        </div>

        {/* Location Preferences */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location preferences
          </Label>
          
          {/* City Selection */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {cities.map((city) => (
              <motion.button
                key={city.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange({ city: city.value, preferred_housing_area: '' })}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  data.city === city.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <span className="font-medium text-foreground">{city.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Area Selection */}
          <Select
            value={data.preferred_housing_area}
            onValueChange={(value) => onChange({ preferred_housing_area: value })}
            disabled={!data.city}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder={data.city ? "Select preferred area" : "Select a city first"} />
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

        {/* Room Type - Dropdown */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">Preferred room type</Label>
          <Select
            value={data.room_type}
            onValueChange={(value) => onChange({ room_type: value })}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select room type" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50 max-h-[300px]">
              {roomTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Roommate Search Toggle - Only for non-single room types */}
        {data.room_type && !isSingleRoomType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 rounded-xl bg-muted/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <span className="font-medium text-foreground block">Need a roommate?</span>
                  <span className="text-sm text-muted-foreground">Find compatible roommates</span>
                </div>
              </div>
              <Switch
                checked={data.needs_roommate}
                onCheckedChange={(checked) => onChange({ needs_roommate: checked })}
              />
            </div>
          </motion.div>
        )}

        {/* Personality Matching Toggle */}
        {data.needs_roommate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <div>
                  <span className="font-medium text-foreground block">AI Personality Matching</span>
                  <span className="text-sm text-muted-foreground">Match based on compatibility</span>
                </div>
              </div>
              <Switch
                checked={data.enable_personality_matching}
                onCheckedChange={(checked) => onChange({ enable_personality_matching: checked })}
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default HousingPreferencesStep;
