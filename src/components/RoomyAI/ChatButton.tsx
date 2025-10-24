import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatButtonProps {
  onClick: () => void;
}

export const ChatButton = ({ onClick }: ChatButtonProps) => {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-24 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-shadow duration-300 flex items-center justify-center group"
      aria-label="Open Roomy AI Chat"
    >
      <Bot className="w-8 h-8 text-white group-hover:animate-pulse" />
      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent animate-pulse" />
    </motion.button>
  );
};