import { motion } from 'framer-motion';
import { DormRoomAnimation } from './DormRoomAnimation';
import Step1Video from '@/assets/wizard/step1-animation.mp4';

interface AirbnbStepTransitionProps {
  phase: 1 | 2 | 3;
}

const phaseContent = {
  1: {
    title: 'Step 1',
    heading: 'Tell us about your dorm',
    description: 'Share some basic info, like where it is and how many students can stay.',
  },
  2: {
    title: 'Step 2',
    heading: 'Make it stand out',
    description: "Add photos plus the dorm's name and description — we'll help you out.",
  },
  3: {
    title: 'Step 3',
    heading: 'Finish up and publish',
    description: 'Review your info and submit for verification.',
  },
};

export function AirbnbStepTransition({ phase }: AirbnbStepTransitionProps) {
  const content = phaseContent[phase];

  return (
    <div className="min-h-screen pt-20 pb-32 px-6 bg-white">
      {/* Mobile: Stack vertically */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center lg:gap-16 lg:min-h-[calc(100vh-12rem)]">
        {/* Text content - left side on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:w-2/5 mb-8 lg:mb-0"
        >
          <p className="text-sm font-medium text-muted-foreground mb-3">
            {content.title}
          </p>
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-semibold text-foreground mb-4 leading-tight">
            {content.heading}
          </h1>
          <p className="text-lg text-muted-foreground">
            {content.description}
          </p>
        </motion.div>

        {/* Animation - right side on desktop */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:w-3/5 flex items-center justify-center"
        >
          {phase === 1 ? (
            <video
              src={Step1Video}
              autoPlay
              loop
              muted
              playsInline
              className="w-80 h-72 lg:w-96 lg:h-80 object-contain"
            />
          ) : (
            <DormRoomAnimation phase={phase} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
