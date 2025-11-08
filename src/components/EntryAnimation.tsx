import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Stage = "logo" | "text" | "wave" | "fade" | "complete";

interface EntryAnimationProps {
  onComplete: () => void;
}

export default function EntryAnimation({ onComplete }: EntryAnimationProps) {
  const [stage, setStage] = useState<Stage>("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("text"), 1500);   // Logo → 1.5s
    const t2 = setTimeout(() => setStage("wave"), 3000);   // Text → 1.5s
    const t3 = setTimeout(() => setStage("fade"), 4500);   // Progress + text total 2.5s
    const t4 = setTimeout(() => setStage("complete"), 5300); // Fade to bg 0.8s
    const t5 = setTimeout(() => onComplete(), 5500);       // Route after fade
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {stage === "logo" && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="text-center"
          >
            <h1 className="text-7xl font-extrabold bg-gradient-to-r from-[#6b21a8] via-[#2563eb] to-[#10b981] bg-clip-text text-transparent select-none">
              Roomy
            </h1>
          </motion.div>
        )}

        {stage === "text" && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#6b21a8] via-[#3b82f6] to-[#06b6d4] bg-clip-text text-transparent">
              AI-Powered Dorm Finder
            </h2>
            <div className="mx-auto mt-3 h-[3px] w-[260px] overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 2.5, ease: "easeInOut" }}
                className="h-full w-full bg-gradient-to-r from-[#6b21a8] via-[#3b82f6] to-[#06b6d4]"
              />
            </div>
          </motion.div>
        )}

        {stage === "wave" && (
          <motion.div
            key="wave"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#6b21a8] via-[#2563eb] to-[#10b981]" />
          </motion.div>
        )}

        {stage === "fade" && (
          <motion.div
            key="fade"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(16,185,129,0.25),transparent)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
