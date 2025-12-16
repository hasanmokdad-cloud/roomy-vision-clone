import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Users, User, UserCircle, UserMinus, UserPlus, Users2, BookOpen, Music, Headphones } from 'lucide-react';

interface SocialStyleStepProps {
  data: {
    personality_intro_extro: string;
    personality_guests_frequency: string;
    personality_study_environment: string;
  };
  onChange: (data: Partial<SocialStyleStepProps['data']>) => void;
}

const SocialStyleStep = ({ data, onChange }: SocialStyleStepProps) => {
  const socialOptions = [
    { value: 'introvert', label: 'Introvert', icon: User, description: 'I prefer quiet time alone' },
    { value: 'extrovert', label: 'Extrovert', icon: Users, description: 'I love socializing' },
    { value: 'ambivert', label: 'Ambivert', icon: UserCircle, description: 'A mix of both' }
  ];

  const guestOptions = [
    { value: 'rarely', label: 'Rarely', icon: UserMinus, description: 'Almost never have guests' },
    { value: 'sometimes', label: 'Sometimes', icon: UserPlus, description: 'Occasionally have friends over' },
    { value: 'often', label: 'Often', icon: Users2, description: 'Frequently have guests' }
  ];

  const studyOptions = [
    { value: 'silent', label: 'Silent', icon: BookOpen, description: 'Need complete silence' },
    { value: 'background_noise', label: 'Background noise', icon: Music, description: 'Music or ambient sounds help' },
    { value: 'anywhere', label: 'Anywhere', icon: Headphones, description: 'Can study in any environment' }
  ];

  const renderOptions = (
    options: typeof socialOptions,
    field: keyof SocialStyleStepProps['data'],
    value: string
  ) => (
    <div className="grid grid-cols-1 gap-2">
      {options.map((option) => (
        <motion.button
          key={option.value}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange({ [field]: option.value })}
          className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
            value === option.value
              ? 'border-primary bg-primary/5'
              : 'border-border bg-background hover:border-primary/50'
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            value === option.value ? 'bg-primary/10' : 'bg-muted'
          }`}>
            <option.icon className={`w-6 h-6 ${
              value === option.value ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          <div className="text-left">
            <span className="font-medium text-foreground block">{option.label}</span>
            <span className="text-sm text-muted-foreground">{option.description}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );

  return (
    <div className="px-6 pt-20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Your social style
        </h2>
        <p className="text-muted-foreground mb-8">
          Help us understand your personality
        </p>

        {/* Social Preference */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">Social preference</Label>
          {renderOptions(socialOptions, 'personality_intro_extro', data.personality_intro_extro)}
        </div>

        {/* Guest Frequency */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">How often do you have guests?</Label>
          {renderOptions(guestOptions, 'personality_guests_frequency', data.personality_guests_frequency)}
        </div>

        {/* Study Environment */}
        <div>
          <Label className="text-base font-medium mb-3 block">Preferred study environment</Label>
          {renderOptions(studyOptions, 'personality_study_environment', data.personality_study_environment)}
        </div>
      </motion.div>
    </div>
  );
};

export default SocialStyleStep;
