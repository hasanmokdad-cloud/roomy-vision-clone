import { motion } from 'framer-motion';
import { Home, Camera, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IsometricRoomAnimation } from '../IsometricRoomAnimation';

interface IntroStepProps {
  onGetStarted: () => void;
}

export function IntroStep({ onGetStarted }: IntroStepProps) {
  const steps = [
    {
      icon: Home,
      title: 'Tell us about your property',
      description: 'Property type, name, gender preference, highlights & description.',
    },
    {
      icon: Camera,
      title: 'Make it stand out',
      description: 'Location, essential services, amenities & photos.',
    },
    {
      icon: CheckCircle,
      title: 'Finish up and publish',
      description: 'Room details, pricing, occupancy & media.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col px-6 pt-20 pb-8">
      {/* Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <IsometricRoomAnimation phase={1} />
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          List your property on Roomy
        </h1>
        <p className="text-muted-foreground">
          It takes about 5–7 minutes. You can save and finish later.
        </p>
      </motion.div>

      {/* Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4 flex-1"
      >
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="flex items-start gap-4 p-4 rounded-xl bg-muted/50"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
              <step.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-8"
      >
        <Button
          onClick={onGetStarted}
          className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90"
        >
          Get started
        </Button>
      </motion.div>
    </div>
  );
}
