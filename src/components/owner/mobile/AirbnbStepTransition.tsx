import { motion } from 'framer-motion';
import { DormRoomAnimation } from './DormRoomAnimation';
import Step1Video from '@/assets/wizard/step1-animation.mp4';
import Step2Video from '@/assets/wizard/step2-animation.mp4';

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
    <div className="min-h-screen pt-20 pb-32 px-6 lg:px-12 xl:px-20 2xl:px-28 bg-[#F8E8DD]">
      {/* Mobile: Stack vertically, Desktop: Side by side centered */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center lg:gap-8 xl:gap-12 min-h-[calc(100vh-12rem)]">
        {/* Text content - left side on desktop, pushed more to the right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:w-[45%] xl:w-[40%] mb-8 lg:mb-0 flex flex-col justify-center lg:pl-16 xl:pl-20 2xl:pl-28 relative z-10"
        >
          <p className="text-base font-semibold text-[#222222] mb-4">
            {content.title}
          </p>
          <h1 className="text-[32px] lg:text-[42px] xl:text-[48px] font-bold text-[#222222] mb-6 leading-[1.2] whitespace-nowrap">
            {content.heading}
          </h1>
          <p className="text-[18px] lg:text-[20px] text-[#484848] leading-relaxed font-normal max-w-[520px]">
            {content.description}
          </p>
        </motion.div>

        {/* Animation - right side on desktop, larger and centered */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:w-[55%] xl:w-[60%] flex items-center justify-center"
        >
          {phase === 1 ? (
            <video
              key="step1-video"
              src={Step1Video}
              autoPlay
              muted
              playsInline
              preload="auto"
              onTimeUpdate={(e) => {
                const video = e.currentTarget;
                if (video.duration - video.currentTime < 0.1) {
                  video.pause();
                }
              }}
              className="w-[380px] h-[380px] md:w-[500px] md:h-[500px] lg:w-[650px] lg:h-[650px] xl:w-[700px] xl:h-[700px] object-contain"
            />
          ) : phase === 2 ? (
            <video
              key="step2-video"
              src={Step2Video}
              autoPlay
              muted
              playsInline
              preload="auto"
              onTimeUpdate={(e) => {
                const video = e.currentTarget;
                if (video.duration - video.currentTime < 0.1) {
                  video.pause();
                }
              }}
              className="w-[380px] h-[380px] md:w-[500px] md:h-[500px] lg:w-[650px] lg:h-[650px] xl:w-[700px] xl:h-[700px] object-contain"
            />
          ) : (
            <DormRoomAnimation phase={phase} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
