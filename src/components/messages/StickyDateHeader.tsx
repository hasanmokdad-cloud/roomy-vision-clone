import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';

interface StickyDateHeaderProps {
  date: Date | null;
  visible: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export function StickyDateHeader({ date, visible, containerRef }: StickyDateHeaderProps) {
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
          className="absolute left-0 right-0 z-30 pointer-events-none flex justify-center"
          style={{ top: '16px' }}
        >
          <div className="bg-white/90 dark:bg-[#182229]/90 backdrop-blur-sm text-[#54656f] dark:text-[#8696a0] text-[12px] font-medium px-3 py-1 rounded-lg shadow-sm">
            {formatDate(date)}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
