import { motion } from 'framer-motion';
import { IsometricRoomAnimation } from '../IsometricRoomAnimation';

interface StepOverviewProps {
  phase: 1 | 2 | 3;
}

const phaseContent = {
  1: {
    title: 'Step 1',
    heading: 'Tell us about your property',
    description: 'Property type, name, gender preference, highlights & description.',
  },
  2: {
    title: 'Step 2',
    heading: 'Make it stand out',
    description: 'Location, essential services, amenities & photos.',
  },
  3: {
    title: 'Step 3',
    heading: 'Finish up and publish',
    description: 'Room details, pricing, occupancy & media.',
  },
};

export function StepOverview({ phase }: StepOverviewProps) {
  const content = phaseContent[phase];

  return (
    <div className="px-6 pt-24 pb-32 flex flex-col items-center justify-center min-h-screen">
      {/* Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <IsometricRoomAnimation phase={phase} />
      </motion.div>

      {/* Text content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <p className="text-sm font-medium text-primary mb-2">{content.title}</p>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          {content.heading}
        </h1>
        <p className="text-muted-foreground max-w-sm">
          {content.description}
        </p>
      </motion.div>
    </div>
  );
}
