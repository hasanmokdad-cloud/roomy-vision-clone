import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Bed, Users, Home, Building2, Sparkles, MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const budgetPresets = [200, 300, 400, 500];
  
  const roomTypeOptions = [
    { value: 'private', label: 'Private Room', icon: Bed, description: 'Your own space' },
    { value: 'shared', label: 'Shared Room', icon: Users, description: 'Share with roommate' },
    { value: 'studio', label: 'Studio', icon: Home, description: 'All-in-one space' },
    { value: 'apartment', label: 'Apartment', icon: Building2, description: 'Full apartment' }
  ];

  const cities = [
    { value: 'byblos', label: 'Byblos' },
    { value: 'beirut', label: 'Beirut' }
  ];

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

  // Check if room type is single (no roommate toggle)
  const isSingleRoomType = data.room_type?.toLowerCase().includes('single') ||
                           data.room_type?.toLowerCase().includes('private') ||
                           data.room_type === 'studio';

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
            max={800}
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
              onClick={() => onChange({ budget: 600 })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                data.budget >= 500
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              $500+
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

        {/* Room Type */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">Preferred room type</Label>
          <div className="grid grid-cols-2 gap-3">
            {roomTypeOptions.map((option) => (
              <motion.button
                key={option.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange({ room_type: option.value })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  data.room_type === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  data.room_type === option.value ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <option.icon className={`w-5 h-5 ${
                    data.room_type === option.value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <span className="font-medium text-foreground block">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </motion.button>
            ))}
          </div>
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
