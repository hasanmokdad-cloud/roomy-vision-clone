import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

interface ProfileProgressProps {
  percentage: number;
}

export const ProfileProgress: React.FC<ProfileProgressProps> = ({ percentage }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-black gradient-text">Profile Completion</h3>
        <span className="text-2xl font-black text-primary">{percentage}%</span>
      </div>
      
      <Progress value={percentage} className="h-3 mb-4 shadow-[0_0_8px_rgba(181,123,255,0.3)]" />
      
      {percentage < 100 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-foreground/70"
        >
          Complete your profile to unlock better AI matches! 🎯
        </motion.p>
      )}

      {percentage === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 text-sm text-primary"
        >
          <Sparkles className="w-4 h-4" />
          <span className="font-semibold">Profile complete! AI is ready to find your perfect match.</span>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/20"
      >
        <p className="text-xs text-foreground/60 flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-primary" />
          Roomy AI uses your profile data to personalize dorm matches
        </p>
      </motion.div>
    </motion.div>
  );
};
