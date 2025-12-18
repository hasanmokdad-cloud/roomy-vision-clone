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
import { useIsMobile } from '@/hooks/use-mobile';

interface AcademicStepProps {
  data: {
    university: string;
    major: string;
    year_of_study: number;
  };
  onChange: (data: Partial<AcademicStepProps['data']>) => void;
}

const AcademicStep = ({ data, onChange }: AcademicStepProps) => {
  const isMobile = useIsMobile();
  
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
    'Lebanese International University',
    'Antonine University',
    'Beirut Arab University'
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
          <Select
            value={data.university}
            onValueChange={(value) => onChange({ university: value })}
          >
            <SelectTrigger className="mt-2 h-12 text-base">
              <SelectValue placeholder="Select your university" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {universities.map((uni) => (
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
          <Select
            value={data.year_of_study?.toString()}
            onValueChange={(value) => onChange({ year_of_study: parseInt(value) })}
          >
            <SelectTrigger className="mt-2 h-12 text-base">
              <SelectValue placeholder="Select your year" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value.toString()}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>
    </div>
  );
};

export default AcademicStep;
