import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Stage = "logo" | "text" | "wave" | "complete";

interface EntryAnimationProps {
  onComplete: () => void;
}

export default function EntryAnimation({ onComplete }: EntryAnimationProps) {
  const [stage, setStage] = useState<Stage>("logo");
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    const logoTimer = setTimeout(() => setStage("text"), 1500);
    const textTimer = setTimeout(() => setStage("wave"), 3000);
    const waveTimer = setTimeout(() => setStage("complete"), 4500);
    const completeTimer = setTimeout(() => onComplete(), 5000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(waveTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, prefersReducedMotion]);

  return (
    <AnimatePresence>
      {stage !== "complete" && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        >
          <div className="relative">
            <AnimatePresence mode="wait">
              {stage === "logo" && (
                <motion.div
                  key="logo"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                  className="text-center"
                >
                  <h1 className="text-6xl md:text-8xl font-bold text-gradient-hero relative">
                    Roomy
                    <div className="absolute inset-0 blur-3xl opacity-50 text-gradient-hero pointer-events-none select-none">
                      Roomy
                    </div>
                  </h1>
                </motion.div>
              )}

              {stage === "text" && (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 1 }}
                  className="text-center"
                >
                  <h2 className="text-3xl md:text-5xl font-bold text-gradient mb-4">
                    AI-Powered Dorm Finder
                  </h2>
                  <div className="w-64 h-1 mx-auto rounded-full overflow-hidden bg-muted">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      className="h-full w-full bg-gradient-to-r from-primary via-secondary to-accent"
                    />
                  </div>
                </motion.div>
              )}

              {stage === "wave" && (
                <motion.div
                  key="wave"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
                  className="w-screen h-screen"
                  style={{ originX: 0 }}
                >
                  <div className="w-full h-full bg-gradient-to-r from-primary via-secondary to-accent opacity-90" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
