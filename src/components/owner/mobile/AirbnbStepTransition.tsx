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
    description: "In this step, we'll ask you which type of property you have and where it is located. Then let us know how many rooms you have.",
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
    <div className="min-h-screen pt-20 pb-32 px-6 lg:px-16 bg-white">
      {/* Mobile: Stack vertically */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-16 min-h-[calc(100vh-12rem)]">
        {/* Text content - left side on desktop, vertically centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:w-2/5 mb-8 lg:mb-0 flex flex-col justify-center"
        >
          <p className="text-base font-semibold text-[#222222] mb-4">
            {content.title}
          </p>
          <h1 className="text-[32px] lg:text-[42px] xl:text-[48px] font-bold text-[#222222] mb-6 leading-[1.2]">
            {content.heading}
          </h1>
          <p className="text-[18px] lg:text-[20px] text-[#484848] leading-relaxed font-normal">
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
              muted
              playsInline
              className="w-[400px] h-[360px] lg:w-[500px] lg:h-[450px] object-contain"
            />
          ) : (
            <DormRoomAnimation phase={phase} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
