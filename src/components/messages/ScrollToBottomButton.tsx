import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ScrollToBottomButtonProps {
  onClick: () => void;
  unreadCount?: number;
}

export function ScrollToBottomButton({ onClick, unreadCount = 0 }: ScrollToBottomButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="w-10 h-10 rounded-full bg-white dark:bg-[#2a3942] shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#3b4a54] transition-colors"
      aria-label="Scroll to bottom"
    >
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#25d366] text-white text-[11px] font-medium flex items-center justify-center px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      <ChevronDown className="w-6 h-6 text-[#54656f] dark:text-[#aebac1]" />
    </motion.button>
  );
}
