import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { User, Heart, Home } from 'lucide-react';

interface StudentIntroStepProps {
  onGetStarted: () => void;
}

const StudentIntroStep = ({ onGetStarted }: StudentIntroStepProps) => {
  const steps = [
    {
      icon: User,
      title: 'Tell us about yourself',
      description: 'Basic info, location, academics'
    },
    {
      icon: Heart,
      title: 'Your lifestyle & habits',
      description: 'Help find compatible roommates'
    },
    {
      icon: Home,
      title: 'Dorm preferences',
      description: 'What you\'re looking for'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-20 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Let's set up your profile
          </h1>
          <p className="text-muted-foreground text-lg">
            It takes about 3-5 minutes. You can save and finish later.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-xl bg-muted/50"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-auto">
          <Button
            onClick={onGetStarted}
            className="w-full h-14 text-lg rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            Get started
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentIntroStep;
