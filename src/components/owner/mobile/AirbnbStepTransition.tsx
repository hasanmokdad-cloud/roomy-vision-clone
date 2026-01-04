import { motion } from 'framer-motion';
import Step1Video from '@/assets/wizard/step1-animation.mp4';
import Step2Video from '@/assets/wizard/step2-animation.mp4';
import Step3Image from '@/assets/wizard/step3-image.png';

interface AirbnbStepTransitionProps {
  phase: 1 | 2 | 3;
}

const phaseContent = {
  1: {
    title: 'Step 1',
    heading: 'Tell us about your dorm',
    description: "In this step, we'll ask which type of property you have, give it a name, set preferences, and add a description.",
  },
  2: {
    title: 'Step 2',
    heading: 'Make it stand out',
    description: "Add your location, select amenities, and upload photos to showcase your property.",
  },
  3: {
    title: 'Step 3',
    heading: 'Finish up and publish',
    description: "Let us know your capacity and submit for verification.",
  },
};

export function AirbnbStepTransition({ phase }: AirbnbStepTransitionProps) {
  const content = phaseContent[phase];

  return (
    <div className="h-screen overflow-hidden pt-16 pb-28 px-6 lg:px-12 xl:px-20 2xl:px-28 bg-white">
      {/* Mobile: Stack vertically, Desktop: Side by side centered */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center lg:gap-8 xl:gap-12 h-full">
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
          <h1 className="text-[32px] lg:text-[42px] xl:text-[48px] font-bold text-[#222222] mb-6 leading-[1.2]">
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
              onLoadedData={(e) => {
                const video = e.currentTarget;
                video.play().catch(() => {});
              }}
              onTimeUpdate={(e) => {
                const video = e.currentTarget;
                if (video.duration - video.currentTime < 0.1) {
                  video.pause();
                }
              }}
              className="w-[320px] h-[320px] md:w-[420px] md:h-[420px] lg:w-[550px] lg:h-[550px] xl:w-[600px] xl:h-[600px] object-contain"
            />
          ) : phase === 2 ? (
            <video
              key="step2-video"
              src={Step2Video}
              autoPlay
              muted
              playsInline
              preload="auto"
              onLoadedData={(e) => {
                const video = e.currentTarget;
                video.play().catch(() => {});
              }}
              onTimeUpdate={(e) => {
                const video = e.currentTarget;
                if (video.duration - video.currentTime < 0.1) {
                  video.pause();
                }
              }}
              className="w-[320px] h-[320px] md:w-[420px] md:h-[420px] lg:w-[550px] lg:h-[550px] xl:w-[600px] xl:h-[600px] object-contain"
            />
          ) : (
            <img
              key="step3-image"
              src={Step3Image}
              alt="Step 3 Illustration"
              className="w-[320px] h-[320px] md:w-[420px] md:h-[420px] lg:w-[550px] lg:h-[550px] xl:w-[600px] xl:h-[600px] object-contain"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
