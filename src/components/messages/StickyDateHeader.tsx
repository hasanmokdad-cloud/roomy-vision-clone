import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';

interface StickyDateHeaderProps {
  date: Date | null;
  visible: boolean;
}

export function StickyDateHeader({ date, visible }: StickyDateHeaderProps) {
  const formatDate = (d: Date) => {
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
  };

  return (
    <AnimatePresence>
      {visible && date && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          style={{ top: 'calc(64px + 16px)' }}
        >
          <div className="bg-[#e1f2fb] dark:bg-[#182229] text-[#54656f] dark:text-[#8696a0] text-[12.5px] px-3 py-1 rounded-lg shadow-sm">
            {formatDate(date)}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
