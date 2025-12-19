import { motion } from 'framer-motion';
import { User, Heart, Home } from 'lucide-react';

interface StudentStepOverviewProps {
  phase: 1 | 2 | 3;
}

const StudentStepOverview = ({ phase }: StudentStepOverviewProps) => {
  const phases = {
    1: {
      icon: User,
      title: 'About You',
      subtitle: 'Let\'s start with the basics',
      color: 'from-blue-500 to-cyan-500'
    },
    2: {
      icon: Home,
      title: 'Accommodation',
      subtitle: 'What are you looking for?',
      color: 'from-purple-500 to-violet-500'
    },
    3: {
      icon: Heart,
      title: 'Lifestyle & Habits',
      subtitle: 'Help us find your perfect match',
      color: 'from-pink-500 to-rose-500'
    }
  };

  const { icon: Icon, title, subtitle, color } = phases[phase];

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className={`w-24 h-24 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-6`}
      >
        <Icon className="w-12 h-12 text-white" />
      </motion.div>
      
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-foreground text-center mb-2"
      >
        {title}
      </motion.h2>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center"
      >
        {subtitle}
      </motion.p>

      {/* Animated elements */}
      <motion.div
        className="mt-8 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={`w-3 h-3 rounded-full bg-gradient-to-br ${color}`}
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 1,
              delay: i * 0.15,
              repeat: Infinity,
              repeatDelay: 0.5
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default StudentStepOverview;
