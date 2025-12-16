import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HometownStepProps {
  data: {
    governorate: string;
    district: string;
    town_village: string;
  };
  onChange: (data: Partial<HometownStepProps['data']>) => void;
}

const HometownStep = ({ data, onChange }: HometownStepProps) => {
  // Lebanon governorates and districts
  const governorates = [
    'Beirut',
    'Mount Lebanon',
    'North Lebanon',
    'South Lebanon',
    'Beqaa',
    'Nabatieh',
    'Akkar',
    'Baalbek-Hermel'
  ];

  const districtsByGovernorate: Record<string, string[]> = {
    'Beirut': ['Beirut'],
    'Mount Lebanon': ['Baabda', 'Aley', 'Chouf', 'Keserwan', 'Metn', 'Jbeil'],
    'North Lebanon': ['Tripoli', 'Zgharta', 'Bsharri', 'Koura', 'Minieh-Danniyeh', 'Batroun'],
    'South Lebanon': ['Sidon', 'Tyre', 'Jezzine'],
    'Beqaa': ['Zahle', 'Western Beqaa', 'Rashaya'],
    'Nabatieh': ['Nabatieh', 'Bint Jbeil', 'Hasbaya', 'Marjeyoun'],
    'Akkar': ['Akkar'],
    'Baalbek-Hermel': ['Baalbek', 'Hermel']
  };

  const districts = data.governorate ? districtsByGovernorate[data.governorate] || [] : [];

  return (
    <div className="px-6 pt-20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Where are you from?
        </h2>
        <p className="text-muted-foreground mb-8">
          This helps us understand your commute needs
        </p>

        {/* Governorate */}
        <div className="mb-6">
          <Label className="text-base font-medium">Governorate</Label>
          <Select
            value={data.governorate}
            onValueChange={(value) => onChange({ governorate: value, district: '', town_village: '' })}
          >
            <SelectTrigger className="mt-2 h-12 text-base">
              <SelectValue placeholder="Select governorate" />
            </SelectTrigger>
            <SelectContent>
              {governorates.map((gov) => (
                <SelectItem key={gov} value={gov}>
                  {gov}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* District */}
        <div className="mb-6">
          <Label className="text-base font-medium">District</Label>
          <Select
            value={data.district}
            onValueChange={(value) => onChange({ district: value, town_village: '' })}
            disabled={!data.governorate}
          >
            <SelectTrigger className="mt-2 h-12 text-base">
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {districts.map((dist) => (
                <SelectItem key={dist} value={dist}>
                  {dist}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Town/Village - Optional */}
        <div>
          <Label className="text-base font-medium">Town/Village (optional)</Label>
          <Select
            value={data.town_village}
            onValueChange={(value) => onChange({ town_village: value })}
            disabled={!data.district}
          >
            <SelectTrigger className="mt-2 h-12 text-base">
              <SelectValue placeholder="Select or skip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>
    </div>
  );
};

export default HometownStep;
