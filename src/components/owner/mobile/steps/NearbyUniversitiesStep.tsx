import { motion } from 'framer-motion';
import { GraduationCap, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { 
  getSelectableUniversitiesForLocation,
  universities,
  type University 
} from '@/data/universitiesData';
import { usePropertyTerminology } from '@/hooks/use-property-terminology';
import { cn } from '@/lib/utils';

interface NearbyUniversitiesStepProps {
  selectedUniversities: string[];
  primaryLocation: string;
  onUniversitiesChange: (universities: string[]) => void;
  propertyType?: string;
}

export function NearbyUniversitiesStep({
  selectedUniversities,
  primaryLocation,
  onUniversitiesChange,
  propertyType = 'dorm',
}: NearbyUniversitiesStepProps) {
  const { dormLabel } = usePropertyTerminology(propertyType);
  
  // Get universities with sub-options for this location
  const universitiesWithSubOptions = universities.filter(
    u => u.hasSubOptions && u.primaryLocation === primaryLocation
  );
  
  // Get simple universities (no sub-options) for this location
  const simpleUniversities = universities.filter(
    u => !u.hasSubOptions && u.primaryLocation === primaryLocation
  );

  const toggleUniversity = (uniId: string) => {
    if (selectedUniversities.includes(uniId)) {
      onUniversitiesChange(selectedUniversities.filter(id => id !== uniId));
    } else {
      onUniversitiesChange([...selectedUniversities, uniId]);
    }
  };

  // Check if a parent university is selected (all sub-options selected)
  const isParentFullySelected = (uni: University): boolean => {
    if (!uni.subOptions) return false;
    return uni.subOptions.every(sub => selectedUniversities.includes(sub.id));
  };

  // Toggle all sub-options of a parent
  const toggleParent = (uni: University) => {
    if (!uni.subOptions) return;
    
    if (isParentFullySelected(uni)) {
      // Deselect all sub-options
      const subIds = uni.subOptions.map(s => s.id);
      onUniversitiesChange(selectedUniversities.filter(id => !subIds.includes(id)));
    } else {
      // Select all sub-options
      const subIds = uni.subOptions.map(s => s.id);
      const newSelection = [...new Set([...selectedUniversities, ...subIds])];
      onUniversitiesChange(newSelection);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
            Which universities are nearby?
          </h1>
          <p className="text-muted-foreground mt-2">
            Select all that apply (optional)
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Universities with sub-options (LAU, LU) */}
          {universitiesWithSubOptions.map((uni) => (
            <div key={uni.id} className="space-y-3">
              {/* Parent university button - selects all sub-options */}
              <button
                onClick={() => toggleParent(uni)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                  isParentFullySelected(uni)
                    ? 'border-foreground bg-background shadow-sm'
                    : 'border-border hover:border-foreground/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <span className="font-medium text-base">{uni.shortName}</span>
                    <span className="text-xs text-muted-foreground ml-2">(All campuses)</span>
                  </div>
                </div>
                {isParentFullySelected(uni) && (
                  <Check className="w-5 h-5 text-foreground" />
                )}
              </button>
              
              {/* Sub-options */}
              <div className="grid grid-cols-1 gap-2 pl-4">
                {uni.subOptions?.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => toggleUniversity(sub.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                      selectedUniversities.includes(sub.id)
                        ? 'border-foreground bg-background shadow-sm'
                        : 'border-border hover:border-foreground/50'
                    )}
                  >
                    <span className="font-medium text-sm">{sub.name}</span>
                    {selectedUniversities.includes(sub.id) && (
                      <Check className="w-4 h-4 text-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Simple universities (no sub-options) */}
          <div className="grid grid-cols-1 gap-2">
            {simpleUniversities.map((uni) => (
              <button
                key={uni.id}
                onClick={() => toggleUniversity(uni.id)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                  selectedUniversities.includes(uni.id)
                    ? 'border-foreground bg-background shadow-sm'
                    : 'border-border hover:border-foreground/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-base">{uni.name}</span>
                </div>
                {selectedUniversities.includes(uni.id) && (
                  <Check className="w-5 h-5 text-foreground" />
                )}
              </button>
            ))}
          </div>

          {/* No universities message */}
          {simpleUniversities.length === 0 && universitiesWithSubOptions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No universities configured for this location yet.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
