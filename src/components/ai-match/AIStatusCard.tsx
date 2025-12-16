import { Brain, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIStatusCardProps {
  isLoading: boolean;
  matchCount?: number;
  matchMode?: 'apartments' | 'rooms' | 'roommates';
}

export function AIStatusCard({ isLoading, matchCount = 0, matchMode = 'apartments' }: AIStatusCardProps) {
  const getModeText = () => {
    switch (matchMode) {
      case 'apartments':
        return 'apartments';
      case 'rooms':
        return 'rooms';
      case 'roommates':
        return 'roommates';
      default:
        return 'matches';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 p-4"
    >
      {/* Shimmer effect when loading */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear',
          }}
        />
      )}

      <div className="relative flex items-center gap-4">
        {/* AI Icon */}
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          {isLoading && (
            <motion.div
              className="absolute -inset-1 rounded-xl border-2 border-primary/50"
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">
              {isLoading ? 'Roomy AI is analyzing...' : `Found ${matchCount} ${getModeText()}`}
            </h3>
            {!isLoading && matchCount > 0 && (
              <Sparkles className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Brain className="w-3 h-3" />
            Powered by Gemini AI
          </p>
        </div>

        {/* Pulsing indicator when loading */}
        {isLoading && (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
