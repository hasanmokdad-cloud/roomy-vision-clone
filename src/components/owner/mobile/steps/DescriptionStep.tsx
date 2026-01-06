import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface DescriptionStepProps {
  mode: 'highlights' | 'title' | 'description';
  highlights: string[];
  title: string;
  description: string;
  onHighlightsChange: (highlights: string[]) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
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
  { id: 'pet-friendly', label: 'Pet-friendly' },
  { id: 'fast-wifi', label: 'Fast WiFi' },
  { id: 'fully-furnished', label: 'Fully furnished' },
  { id: 'recently-renovated', label: 'Recently renovated' },
  { id: 'great-views', label: 'Great views' },
  { id: 'close-to-shops', label: 'Close to shops' },
  { id: 'public-transport', label: 'Near public transport' },
  { id: 'utilities-included', label: 'Utilities included' },
  { id: 'flexible-lease', label: 'Flexible lease' },
  { id: 'communal-kitchen', label: 'Communal kitchen' },
  { id: 'laundry-onsite', label: 'Laundry on-site' },
  { id: 'rooftop-access', label: 'Rooftop access' },
  { id: 'outdoor-space', label: 'Outdoor space' },
  { id: 'parking-available', label: 'Parking available' },
  { id: 'generator-backup', label: 'Generator backup' },
  { id: 'sea-view', label: 'Sea view' },
  { id: 'mountain-view', label: 'Mountain view' },
  { id: 'city-view', label: 'City view' },
  { id: 'balcony', label: 'Balcony' },
  { id: 'private-bathroom', label: 'Private bathroom' },
  { id: 'quiet-neighborhood', label: 'Quiet neighborhood' },
  { id: 'vibrant-area', label: 'Vibrant area' },
  { id: 'study-room', label: 'Study room' },
  { id: 'gym-access', label: 'Gym access' },
];

export function DescriptionStep({
  mode,
  highlights,
  title,
  description,
  onHighlightsChange,
  onTitleChange,
  onDescriptionChange,
}: DescriptionStepProps) {
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
            <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
              Let's describe your dorm
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              You can add more amenities after you submit your listing.
            </p>
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
                  {option.label}
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
            <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
              Give your dorm a title
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              You can add more amenities after you submit your listing.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value.slice(0, 50))}
              placeholder="e.g., Cozy Student Haven near Campus"
              className="h-14 text-lg"
            />
            <p className="text-right text-sm text-muted-foreground mt-2">
              {title.length}/50
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
            Create your description
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            You can add more amenities after you submit your listing.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value.slice(0, 500))}
            placeholder="Describe your dorm... What do students love about it? Any house rules? What makes it unique?"
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
            💡 <strong>Tips:</strong> Mention nearby landmarks, transportation, what's included, and any unique features that set your dorm apart.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
