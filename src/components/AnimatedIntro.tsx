import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FluidBackground } from './FluidBackground';

interface AnimatedIntroProps {
  destination: string;
}

export const AnimatedIntro = ({ destination }: AnimatedIntroProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(destination, { replace: true });
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate, destination]);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <FluidBackground />
      
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        {/* Logo Text */}
        <motion.h1
          className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-[#6366f1] to-[#22d3ee] bg-clip-text text-transparent"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1]
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
          className="text-xl md:text-2xl font-medium text-white/90"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.5,
            ease: "easeOut"
          }}
          style={{
            willChange: 'transform, opacity'
          }}
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
            delay: 1.5,
            ease: "easeInOut"
          }}
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.6) 0%, transparent 70%)'
          }}
        />
      </div>
    </div>
  );
};
