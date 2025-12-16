import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AcademicStepProps {
  data: {
    university: string;
    major: string;
    year_of_study: number;
  };
  onChange: (data: Partial<AcademicStepProps['data']>) => void;
}

const AcademicStep = ({ data, onChange }: AcademicStepProps) => {
  const universities = [
    'LAU Byblos',
    'LAU Beirut',
    'AUB',
    'USJ',
    'USEK',
    'NDU',
    'BAU',
    'LU',
    'Haigazian',
    'Other'
  ];

  const years = [
    { value: 1, label: 'Year 1 (Freshman)' },
    { value: 2, label: 'Year 2 (Sophomore)' },
    { value: 3, label: 'Year 3 (Junior)' },
    { value: 4, label: 'Year 4 (Senior)' },
    { value: 5, label: 'Year 5+' },
    { value: 6, label: 'Graduate Student' }
  ];

  return (
    <div className="px-6 pt-20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Academic information
        </h2>
        <p className="text-muted-foreground mb-8">
          Connect with students from your university
        </p>

        {/* University */}
        <div className="mb-6">
          <Label className="text-base font-medium">University</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {universities.slice(0, 6).map((uni) => (
              <motion.button
                key={uni}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange({ university: uni })}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  data.university === uni
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <span className="font-medium text-foreground text-sm">{uni}</span>
              </motion.button>
            ))}
          </div>
          <Select
            value={universities.slice(6).includes(data.university) ? data.university : ''}
            onValueChange={(value) => onChange({ university: value })}
          >
            <SelectTrigger className="mt-2 h-12">
              <SelectValue placeholder="Other university..." />
            </SelectTrigger>
            <SelectContent>
              {universities.slice(6).map((uni) => (
                <SelectItem key={uni} value={uni}>
                  {uni}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Major */}
        <div className="mb-6">
          <Label htmlFor="major" className="text-base font-medium">
            Major / Field of Study
          </Label>
          <Input
            id="major"
            value={data.major}
            onChange={(e) => onChange({ major: e.target.value })}
            placeholder="e.g. Computer Science"
            className="mt-2 h-12 text-base"
          />
        </div>

        {/* Year of Study */}
        <div>
          <Label className="text-base font-medium">Year of Study</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {years.map((year) => (
              <motion.button
                key={year.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange({ year_of_study: year.value })}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  data.year_of_study === year.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <span className="font-medium text-foreground text-sm">{year.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AcademicStep;
