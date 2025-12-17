import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Home, Search, Users, Sparkles } from 'lucide-react';

interface AccommodationStatusStepProps {
  data: {
    accommodation_status: string;
    needs_roommate: boolean;
    enable_personality_matching: boolean;
  };
  onChange: (data: Partial<AccommodationStatusStepProps['data']>) => void;
}

const AccommodationStatusStep = ({ data, onChange }: AccommodationStatusStepProps) => {
  const statusOptions = [
    { 
      value: 'need_dorm', 
      label: 'Looking for a dorm', 
      icon: Search, 
      description: 'I need to find housing' 
    },
    { 
      value: 'have_dorm', 
      label: 'Already have a dorm', 
      icon: Home, 
      description: 'I\'m already housed' 
    }
  ];

  return (
    <div className="px-6 pt-20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Your accommodation status
        </h2>
        <p className="text-muted-foreground mb-8">
          Help us tailor your experience
        </p>

        {/* Accommodation Status */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">Current status</Label>
          <div className="grid grid-cols-1 gap-3">
            {statusOptions.map((option) => (
              <motion.button
                key={option.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange({ accommodation_status: option.value })}
                className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                  data.accommodation_status === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  data.accommodation_status === option.value ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <option.icon className={`w-6 h-6 ${
                    data.accommodation_status === option.value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="text-left">
                  <span className="font-medium text-foreground block">{option.label}</span>
                  <span className="text-sm text-muted-foreground">{option.description}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Roommate Search Toggle */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 rounded-xl bg-muted/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <span className="font-medium text-foreground block">Looking for a roommate?</span>
                <span className="text-sm text-muted-foreground">Find compatible roommates</span>
              </div>
            </div>
            <Switch
              checked={data.needs_roommate}
              onCheckedChange={(checked) => onChange({ needs_roommate: checked })}
            />
          </div>
        </motion.div>

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
            <p className="text-xs text-muted-foreground mt-2 ml-8">
              Uses your lifestyle preferences to find the best roommate matches
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AccommodationStatusStep;
