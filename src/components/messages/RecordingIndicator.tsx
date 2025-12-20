import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mic } from 'lucide-react';

interface RecordingIndicatorProps {
  userName?: string;
  avatarUrl?: string | null;
}

export function RecordingIndicator({ userName, avatarUrl }: RecordingIndicatorProps) {
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
      
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
        {/* Pulsing microphone icon */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Mic className="w-4 h-4 text-destructive" />
        </motion.div>
        
        {/* Audio wave bars */}
        <div className="flex items-center gap-0.5 h-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-0.5 bg-destructive/60 rounded-full"
              animate={{
                height: ['4px', '12px', '6px', '14px', '4px'],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        
        <span className="text-sm text-muted-foreground ml-1">
          Recording audio...
        </span>
      </div>
    </motion.div>
  );
}
