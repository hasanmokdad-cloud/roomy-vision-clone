import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TypingIndicatorProps {
  userName?: string;
  avatarUrl?: string | null;
}

export function TypingIndicator({ userName, avatarUrl }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex items-end gap-2"
    >
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={avatarUrl || undefined} alt={userName || 'User'} />
        <AvatarFallback className="bg-primary/20 text-primary text-xs">
          {userName?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      {/* WhatsApp-style typing bubble */}
      <div className="bg-white dark:bg-[#202c33] rounded-lg rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-[#8696a0]"
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.12,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
