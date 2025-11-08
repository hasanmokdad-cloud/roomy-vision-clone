import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EntryAnimationProps {
  onComplete: () => void;
}

export const EntryAnimation = ({ onComplete }: EntryAnimationProps) => {
  const [stage, setStage] = useState<'logo' | 'text' | 'wave' | 'complete'>('logo');

  useEffect(() => {
    const logoTimer = setTimeout(() => setStage('text'), 1500);
    const textTimer = setTimeout(() => setStage('wave'), 3000);
    const waveTimer = setTimeout(() => setStage('complete'), 4500);
    const completeTimer = setTimeout(() => onComplete(), 5000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(waveTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-[9999] overflow-hidden">
      <AnimatePresence mode="wait">
        {stage === 'logo' && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.8 }}
            className="text-6xl font-bold gradient-text"
          >
            Roomy
          </motion.div>
        )}

        {stage === 'text' && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-semibold gradient-text"
          >
            AI-Powered Dorm Finder
          </motion.div>
        )}

        {stage === 'wave' && (
          <motion.div
            key="wave"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-br from-[#6b21a8] via-[#2563eb] to-[#10b981] origin-bottom"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
