import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function AITypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-2.5 justify-start"
    >
      {/* AI Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-2 ring-primary/20 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>

      {/* Typing Bubble */}
      <div className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Roomy AI is thinking</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{
                  y: [0, -4, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>

        {/* Skeleton content */}
        <div className="mt-2 space-y-2">
          <motion.div
            className="h-3 bg-muted rounded-full"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: "180px" }}
          />
          <motion.div
            className="h-3 bg-muted rounded-full"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            style={{ width: "140px" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
