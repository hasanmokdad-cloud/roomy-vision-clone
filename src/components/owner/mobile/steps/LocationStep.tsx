import { motion } from 'framer-motion';
import { MapPin, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { housingAreas } from '@/data/housingAreas';

interface LocationStepProps {
  area: string;
  address: string;
  nearUniversity: boolean;
  onAreaChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onNearUniversityChange: (value: boolean) => void;
}

export function LocationStep({
  area,
  address,
  nearUniversity,
  onAreaChange,
  onAddressChange,
  onNearUniversityChange,
}: LocationStepProps) {
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
        {/* Area Selection */}
        <div>
          <Label className="text-base font-medium mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Area / Region
          </Label>
          <div className="grid grid-cols-2 gap-2 mt-3 max-h-64 overflow-y-auto">
            {housingAreas.map((areaOption) => (
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
        </div>

        {/* Address Input */}
        <div>
          <Label htmlFor="address" className="text-base font-medium">
            Street Address
          </Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="e.g., Main Street, Building 5"
            className="mt-2 h-12 text-base"
          />
        </div>

        {/* Near University Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Near a university</p>
              <p className="text-sm text-muted-foreground">Within walking distance</p>
            </div>
          </div>
          <Switch
            checked={nearUniversity}
            onCheckedChange={onNearUniversityChange}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
