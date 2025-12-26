import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import RoomyLogo from '@/assets/roomy-logo.png';
import Step1Graphic from '@/assets/wizard/step-1-graphic.avif';
import Step2Graphic from '@/assets/wizard/step-2-graphic.avif';
import Step3Graphic from '@/assets/wizard/step-3-graphic.avif';

interface AirbnbIntroStepProps {
  onGetStarted: () => void;
  onClearProgress?: () => void;
}

// Loading dots animation component
function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-white rounded-full"
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

const stepGraphics = {
  1: Step1Graphic,
  2: Step2Graphic,
  3: Step3Graphic,
};

export function AirbnbIntroStep({ onGetStarted, onClearProgress }: AirbnbIntroStepProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    {
      number: 1,
      title: 'Tell us about your dorm',
      description: 'Share some basic info, like where it is and how many students can stay.',
    },
    {
      number: 2,
      title: 'Make it stand out',
      description: "Add photos plus the dorm's name and description — we'll help you out.",
    },
    {
      number: 3,
      title: 'Finish up and publish',
      description: 'Review your info and submit for verification.',
    },
  ];

  const handleGetStarted = () => {
    setIsLoading(true);
    // Clear any saved progress first to start fresh
    if (onClearProgress) {
      onClearProgress();
    }
    // Simulate loading and then proceed
    setTimeout(() => {
      onGetStarted();
    }, 800);
  };

  const handleExit = () => {
    navigate('/listings');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top bar with Roomy logo and Exit button */}
      <div className="flex items-center justify-between px-6 py-4 lg:px-12">
        <button onClick={handleExit} className="focus:outline-none">
          <img 
            src={RoomyLogo} 
            alt="Roomy" 
            className="w-8 h-8 rounded-lg object-contain"
          />
        </button>
        <button
          onClick={handleExit}
          className="px-4 py-2 text-sm font-medium text-[#222222] border border-[#222222] rounded-full hover:bg-[#F7F7F7] transition-colors"
        >
          Exit
        </button>
      </div>

      {/* Main content - split layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - heading */}
        <div className="lg:w-1/2 flex items-start lg:items-center justify-start lg:justify-center px-6 py-8 lg:p-12 lg:pr-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[32px] lg:text-[48px] font-medium text-[#222222] leading-tight tracking-tight max-w-md"
          >
            It's easy to get started on Roomy
          </motion.h1>
        </div>

        {/* Right side - steps list */}
        <div className="lg:w-1/2 flex flex-col justify-center px-6 lg:px-12 lg:pl-8">
          <div className="divide-y divide-[#EBEBEB]">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.15, duration: 0.4 }}
                className="flex items-center gap-4 py-8 first:pt-0 lg:first:pt-8"
              >
                <span className="text-[22px] font-medium text-[#222222] shrink-0 self-start mt-1">
                  {step.number}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[18px] lg:text-[19px] font-semibold text-[#222222] mb-1">
                    {step.title}
                  </h3>
                  <p className="text-[15px] lg:text-[16px] text-[#717171] leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <img 
                  src={stepGraphics[step.number as 1 | 2 | 3]} 
                  alt={step.title}
                  className="w-[100px] h-[80px] lg:w-[140px] lg:h-[110px] object-contain shrink-0"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer with thick separator and Get started button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="border-t border-[#DDDDDD]"
      >
        <div className="px-6 lg:px-12 py-6 flex justify-end">
          <button
            onClick={handleGetStarted}
            disabled={isLoading}
            className="px-6 py-3 bg-[#222222] text-white font-semibold text-[16px] rounded-lg hover:bg-[#000000] transition-colors disabled:opacity-70 min-w-[140px]"
          >
            {isLoading ? <LoadingDots /> : 'Get started'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
