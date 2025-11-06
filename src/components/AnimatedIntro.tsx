import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FluidBackground } from './FluidBackground';

interface AnimatedIntroProps {
  destination: string;
}

export const AnimatedIntro = ({ destination }: AnimatedIntroProps) => {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Detect system color scheme
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeIn(false), 800);
    const redirectTimer = setTimeout(() => {
      navigate(destination, { replace: true });
    }, 3300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate, destination]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center overflow-hidden ${
        theme === 'dark' ? 'bg-black' : 'bg-white'
      }`}
    >
      <FluidBackground />

      {/* Fade-to-black cinematic overlay */}
      <AnimatePresence>
        {fadeIn && (
          <motion.div
            className="absolute inset-0 bg-black z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* Animated content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        {/* Logo Text */}
        <motion.h1
          className={`text-6xl md:text-7xl font-bold bg-gradient-to-r ${
            theme === 'dark'
              ? 'from-[#6366f1] to-[#22d3ee]'
              : 'from-[#3b82f6] to-[#06b6d4]'
          } bg-clip-text text-transparent`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.9
          }}
          style={{
            willChange: 'transform, opacity',
            filter: 'drop-shadow(0 4px 24px rgba(34, 211, 238, 0.4))'
          }}
        >
          Roomy
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className={`text-xl md:text-2xl font-medium ${
            theme === 'dark' ? 'text-white/90' : 'text-gray-800'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 1.8,
            ease: 'easeOut'
          }}
          style={{ willChange: 'transform, opacity' }}
        >
          AI-Powered Dorm Finder
        </motion.p>

        {/* Glow Pulse Effect */}
        <motion.div
          className="absolute inset-0 -z-10 blur-3xl"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.6, 0.4],
            scale: [0.8, 1.1, 1.05]
          }}
          transition={{
            duration: 1,
            delay: 2.3,
            ease: 'easeInOut'
          }}
          style={{
            background:
              theme === 'dark'
                ? 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)'
          }}
        />
      </div>
    </div>
  );
};
