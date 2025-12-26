import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DormRoomAnimation } from './DormRoomAnimation';

interface AirbnbIntroStepProps {
  onGetStarted: () => void;
}

// Mini isometric illustration component for the step list
function MiniIllustration({ phase }: { phase: 1 | 2 | 3 }) {
  const illustrations = {
    1: (
      <div className="w-12 h-12 relative">
        {/* Basic room shape */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-6 bg-muted border border-border rounded-sm transform -skew-x-6" />
          <div className="absolute w-3 h-4 bg-primary/30 rounded-sm right-2 bottom-1" />
        </div>
      </div>
    ),
    2: (
      <div className="w-12 h-12 relative">
        {/* Room with decorations */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-6 bg-muted border border-border rounded-sm transform -skew-x-6" />
          <div className="absolute w-2 h-2 bg-green-500 rounded-full right-1 top-2" />
          <div className="absolute w-3 h-3 bg-orange-400 rounded-sm left-2 bottom-1" />
        </div>
      </div>
    ),
    3: (
      <div className="w-12 h-12 relative">
        {/* Complete house */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-9 h-7 bg-muted border border-border rounded-sm transform -skew-x-6" />
          <div className="absolute w-10 h-3 bg-foreground/80 rounded-t-lg -top-1 transform -skew-x-6" />
          <div className="absolute w-2 h-2 bg-green-600 rounded-full right-0 bottom-0" />
        </div>
      </div>
    ),
  };

  return illustrations[phase];
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

export function AirbnbIntroStep({ onGetStarted }: AirbnbIntroStepProps) {
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
    // Simulate loading and then proceed
    setTimeout(() => {
      onGetStarted();
    }, 800);
  };

  const handleExit = () => {
    navigate('/listings');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar with R logo and Exit button */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={handleExit} className="focus:outline-none">
          <span className="text-2xl font-bold text-primary">R</span>
        </button>
        <button
          onClick={handleExit}
          className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-full hover:bg-muted transition-colors"
        >
          Exit
        </button>
      </div>

      {/* Main content - split layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - heading */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl lg:text-5xl xl:text-6xl font-semibold text-foreground leading-tight"
          >
            It's easy to get started on Roomy
          </motion.h1>
        </div>

        {/* Right side - steps list */}
        <div className="lg:w-1/2 flex flex-col justify-center p-6 lg:p-12">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.15, duration: 0.4 }}
                className="flex items-start gap-4"
              >
                <span className="text-2xl font-semibold text-foreground shrink-0">
                  {step.number}
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                <div className="shrink-0 hidden lg:block">
                  <MiniIllustration phase={step.number as 1 | 2 | 3} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer with Get started button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-6 flex justify-end"
      >
        <button
          onClick={handleGetStarted}
          disabled={isLoading}
          className="px-6 py-3 bg-foreground text-background font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-70 min-w-[140px]"
        >
          {isLoading ? <LoadingDots /> : 'Get started'}
        </button>
      </motion.div>
    </div>
  );
}
