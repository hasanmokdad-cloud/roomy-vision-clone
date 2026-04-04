import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { usePropertyTerminology } from '@/hooks/use-property-terminology';
import { occupant } from '@/utils/occupantLabel';

interface DescriptionStepProps {
  mode: 'highlights' | 'title' | 'description';
  highlights: string[];
  title: string;
  description: string;
  onHighlightsChange: (highlights: string[]) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  propertyType?: string;
  rulesAndRegulations?: string;
  onRulesAndRegulationsChange?: (rules: string) => void;
  tenantSelection?: string;
}

const highlightOptions = [
  { id: 'peaceful', label: 'Peaceful' },
  { id: 'unique', label: 'Unique' },
  { id: 'student-friendly', label: 'Student-friendly' },
  { id: 'modern', label: 'Modern' },
  { id: 'central', label: 'Central location' },
  { id: 'spacious', label: 'Spacious' },
  { id: 'cozy', label: 'Cozy' },
  { id: 'affordable', label: 'Affordable' },
  { id: 'quiet-study', label: 'Quiet for studying' },
  { id: 'social-atmosphere', label: 'Social atmosphere' },
  { id: 'near-campus', label: 'Near campus' },
  { id: 'safe-secure', label: 'Safe & secure' },
  { id: 'well-maintained', label: 'Well-maintained' },
  { id: 'bright-airy', label: 'Bright & airy' },
  { id: 'recently-renovated', label: 'Recently renovated' },
  { id: 'great-views', label: 'Great views' },
  { id: 'close-to-shops', label: 'Close to shops' },
  { id: 'public-transport', label: 'Near public transport' },
  { id: 'flexible-lease', label: 'Flexible lease' },
  { id: 'sea-view', label: 'Sea view' },
  { id: 'mountain-view', label: 'Mountain view' },
  { id: 'city-view', label: 'City view' },
  { id: 'quiet-neighborhood', label: 'Quiet neighborhood' },
  { id: 'vibrant-area', label: 'Vibrant area' },
];

export function DescriptionStep({
  mode,
  highlights,
  title,
  description,
  onHighlightsChange,
  onTitleChange,
  onDescriptionChange,
  propertyType = 'dorm',
  rulesAndRegulations = '',
  onRulesAndRegulationsChange,
  tenantSelection = 'student_only',
}: DescriptionStepProps) {
  const { dormLabel } = usePropertyTerminology(propertyType);
  const occupantPlural = occupant(tenantSelection, { plural: true });
  
  const toggleHighlight = (id: string) => {
    if (highlights.includes(id)) {
      onHighlightsChange(highlights.filter((h) => h !== id));
    } else {
      onHighlightsChange([...highlights, id]);
    }
  };

  if (mode === 'highlights') {
    return (
      <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
        <div className="w-full max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
              Let's describe your {dormLabel}
            </h1>
          </motion.div>

          <div className="flex flex-wrap gap-2 justify-center">
            {highlightOptions.map((option, index) => {
              const isSelected = highlights.includes(option.id);
              return (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(index * 0.02, 0.3) }}
                  onClick={() => toggleHighlight(option.id)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-foreground hover:border-foreground/50'
                  }`}
                >
                  {option.id === 'student-friendly' && tenantSelection === 'mixed' ? 'Tenant-friendly' : option.label}
                </motion.button>
              );
            })}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            {highlights.length} selected
          </motion.p>
        </div>
      </div>
    );
  }

  if (mode === 'title') {
    return (
      <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
        <div className="w-full max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
              Give your {dormLabel} a title
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value.slice(0, 50))}
              placeholder="e.g., Cozy Student Haven near Campus"
              className="w-full h-14 text-lg px-4 rounded-lg border border-border bg-background text-foreground"
            />
            <p className="text-right text-sm text-muted-foreground mt-2">
              {title.length}/50
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Description mode
  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
            Create your description
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value.slice(0, 500))}
            placeholder={`Describe your ${dormLabel}... What do ${occupantPlural} love about it? What makes it unique?`}
            className="min-h-[200px] text-base"
          />
          <p className="text-right text-sm text-muted-foreground mt-2">
            {description.length}/500
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 p-4 rounded-xl bg-muted/50"
        >
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tips:</strong> Mention nearby universities, hospitals, landmarks, transportation,{tenantSelection === 'mixed' ? ' workplaces,' : ''} what's included, and any unique features that set your listing apart.
          </p>
        </motion.div>

        {/* Section 2 — Rules & Regulations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <h2 className="text-lg font-semibold text-foreground text-center mb-1">
            Building rules & regulations
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Let tenants know what's expected. This will be shown on your listing page.
          </p>
          <Textarea
            value={rulesAndRegulations}
            onChange={(e) => onRulesAndRegulationsChange?.(e.target.value.slice(0, 1000))}
            placeholder="e.g. No smoking inside the building. Quiet hours from 11PM to 7AM. No guests after midnight. Tenants are responsible for keeping shared spaces clean..."
            className="min-h-[150px] text-base"
          />
          <p className="text-right text-sm text-muted-foreground mt-2">
            {rulesAndRegulations.length}/1000
          </p>
        </motion.div>
      </div>
    </div>
  );
}
