import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Intro = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'gradient' | 'text' | 'blur' | 'complete'>('gradient');

  useEffect(() => {
    const gradientTimer = setTimeout(() => setStage('text'), 1500);
    const textTimer = setTimeout(() => setStage('blur'), 2800);
    const blurTimer = setTimeout(() => setStage('complete'), 4000);
    const completeTimer = setTimeout(() => navigate('/home', { replace: true }), 4500);

    return () => {
      clearTimeout(gradientTimer);
      clearTimeout(textTimer);
      clearTimeout(blurTimer);
      clearTimeout(completeTimer);
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <AnimatePresence>
        {/* Gradient sweep animation */}
        {stage === 'gradient' && (
          <motion.div
            className="absolute inset-0"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              ease: [0.42, 0, 0.58, 1],
            }}
            style={{
              transformOrigin: 'left',
              background: 'linear-gradient(90deg, #6A00F4 0%, #00E0DC 100%)',
            }}
          />
        )}

        {/* Text animation */}
        {(stage === 'text' || stage === 'blur') && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <motion.h1
              className="text-7xl md:text-8xl font-bold mb-6"
              style={{
                background: 'linear-gradient(90deg, #6A00F4 0%, #00E0DC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.42, 0, 0.58, 1],
              }}
            >
              Roomy
            </motion.h1>

            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.6,
                ease: 'easeInOut',
              }}
            >
              <p className="text-2xl md:text-3xl font-medium text-white">
                AI-Powered Dorm Finder
              </p>
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#6A00F4] to-[#00E0DC]"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{
                  duration: 0.8,
                  delay: 0.8,
                  ease: [0.42, 0, 0.58, 1],
                }}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Blur expansion */}
        {stage === 'blur' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.5 }}
            transition={{
              duration: 1.2,
              ease: [0.42, 0, 0.58, 1],
            }}
          >
            <div
              className="w-[600px] h-[600px] rounded-full blur-[100px]"
              style={{
                background: 'radial-gradient(circle, rgba(106, 0, 244, 0.6) 0%, rgba(0, 224, 220, 0.4) 50%, transparent 70%)',
              }}
            />
          </motion.div>
        )}

        {/* Fade to FluidBackground-like gradient */}
        {stage === 'blur' && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 1,
              delay: 0.5,
              ease: 'easeInOut',
            }}
            style={{
              background: 'linear-gradient(135deg, rgba(106, 0, 244, 0.3) 0%, rgba(0, 224, 220, 0.3) 100%)',
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Intro;
