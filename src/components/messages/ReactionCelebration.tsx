import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface ReactionCelebrationProps {
  emoji: string | null;
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export function ReactionCelebration({ emoji, onComplete }: ReactionCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (emoji) {
      // Generate particles for burst effect
      const newParticles: Particle[] = Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 60 - 20,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        onComplete();
        setParticles([]);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [emoji, onComplete]);

  return (
    <AnimatePresence>
      {emoji && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {/* Main floating emoji */}
          <motion.div
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -80, scale: 1.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl"
          >
            {emoji}
          </motion.div>

          {/* Particle burst */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                opacity: 1, 
                x: 0, 
                y: 0, 
                scale: 0,
                rotate: 0
              }}
              animate={{ 
                opacity: 0, 
                x: particle.x, 
                y: particle.y,
                scale: particle.scale,
                rotate: particle.rotation
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute text-2xl"
            >
              {emoji}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Inline celebration that appears near the reaction
export function InlineReactionCelebration({ 
  emoji, 
  onComplete,
  position = "center"
}: { 
  emoji: string | null; 
  onComplete: () => void;
  position?: "left" | "center" | "right";
}) {
  useEffect(() => {
    if (emoji) {
      const timer = setTimeout(onComplete, 600);
      return () => clearTimeout(timer);
    }
  }, [emoji, onComplete]);

  const positionClass = {
    left: "left-0",
    center: "left-1/2 -translate-x-1/2",
    right: "right-0"
  }[position];

  return (
    <AnimatePresence>
      {emoji && (
        <motion.div
          initial={{ opacity: 1, y: 0, scale: 0.8 }}
          animate={{ opacity: 0, y: -40, scale: 1.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`absolute -top-2 ${positionClass} text-2xl pointer-events-none z-50`}
        >
          {emoji}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
