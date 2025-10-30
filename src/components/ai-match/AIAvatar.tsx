import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface AIAvatarProps {
  userName?: string;
}

export const AIAvatar: React.FC<AIAvatarProps> = ({ userName = 'there' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);

  const handleClick = () => {
    setHasClicked(true);
    setTimeout(() => setHasClicked(false), 2000);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isHovered && !hasClicked && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-full right-0 mb-4 w-64"
          >
            <div className="glass-hover neon-border rounded-2xl p-4 shadow-2xl">
              <p className="text-sm text-foreground/90">
                Hey <span className="font-bold text-primary">{userName}</span>, I've analyzed your profile and found your best matches. Scroll to explore 👇
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-16 h-16 rounded-full glass-hover neon-border flex items-center justify-center cursor-pointer"
        animate={{
          boxShadow: [
            '0 0 20px hsl(var(--primary) / 0.3)',
            '0 0 40px hsl(var(--primary) / 0.6)',
            '0 0 20px hsl(var(--primary) / 0.3)'
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.05, 0.95, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Sparkles className="w-8 h-8 text-primary" />
        </motion.div>

        {/* Particle burst on click */}
        <AnimatePresence>
          {hasClicked && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-primary"
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 1,
                    opacity: 1
                  }}
                  animate={{
                    x: Math.cos((i / 8) * Math.PI * 2) * 50,
                    y: Math.sin((i / 8) * Math.PI * 2) * 50,
                    scale: 0,
                    opacity: 0
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
