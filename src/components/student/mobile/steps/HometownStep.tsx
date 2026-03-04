import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { residentialAreas, Governorate } from '@/data/residentialAreas';

interface HometownStepProps {
  data: {
    governorate: string;
    district: string;
    town_village: string;
  };
  onChange: (data: Partial<HometownStepProps['data']>) => void;
}

const HometownStep = ({ data, onChange }: HometownStepProps) => {
  const governorates = Object.keys(residentialAreas) as Governorate[];

  const getDistricts = () => {
    if (!data.governorate) return [];
    const govData = residentialAreas[data.governorate as Governorate];
    return govData ? Object.keys(govData) : [];
  };

  const getTowns = () => {
    if (!data.governorate || !data.district) return [];
    const govData = residentialAreas[data.governorate as Governorate];
    if (!govData) return [];
    const districtData = govData[data.district as keyof typeof govData];
    return Array.isArray(districtData) ? districtData : [];
  };

  const districts = getDistricts();
  const towns = getTowns();

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-10">
            <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
              Where are you from?
            </h1>
            <p className="text-muted-foreground mt-2">
              This helps us understand your background
            </p>
          </div>

          {/* Governorate */}
          <div className="mb-8">
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
          <div className="mb-8">
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

          {/* Town/Village */}
          <div>
            <Label className="text-base font-medium">Town/Village (optional)</Label>
            <Select
              value={data.town_village}
              onValueChange={(value) => onChange({ town_village: value })}
              disabled={!data.district || towns.length === 0}
            >
              <SelectTrigger className="mt-2 h-12 text-base">
                <SelectValue placeholder={towns.length > 0 ? "Select town/village" : "No towns available"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {towns.map((town) => (
                  <SelectItem key={town} value={town}>
                    {town}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HometownStep;
