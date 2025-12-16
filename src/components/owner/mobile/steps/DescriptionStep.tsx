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
    } else if (highlights.length < 2) {
      onHighlightsChange([...highlights, id]);
    }
  };

  if (mode === 'highlights') {
    return (
      <div className="px-6 pt-24 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Let's describe your dorm
          </h1>
          <p className="text-muted-foreground">
            Choose up to 2 highlights. We'll use these to get your description started.
          </p>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          {highlightOptions.map((option, index) => {
            const isSelected = highlights.includes(option.id);
            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => toggleHighlight(option.id)}
                disabled={!isSelected && highlights.length >= 2}
                className={`px-5 py-3 rounded-full border-2 font-medium transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground hover:border-primary/50'
                } ${!isSelected && highlights.length >= 2 ? 'opacity-40' : ''}`}
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
          {highlights.length}/2 selected
        </motion.p>
      </div>
    );
  }

  if (mode === 'title') {
    return (
      <div className="px-6 pt-24 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Give your dorm a title
          </h1>
          <p className="text-muted-foreground">
            Short titles work best. Have fun with it—you can always change it later.
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
    );
  }

  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Create your description
        </h1>
        <p className="text-muted-foreground">
          Share what makes your place special.
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
  );
}
