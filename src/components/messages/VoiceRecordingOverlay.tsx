import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Lock, Trash2 } from 'lucide-react';

type VoiceRecordingOverlayProps = {
  isRecording: boolean;
  duration: number;
  isLocked: boolean;
  slideOffset: { x: number; y: number };
  onCancel: () => void;
  onStop: () => void;
  onSlideChange: (offset: { x: number; y: number }) => void;
  onLock: () => void;
};

export function VoiceRecordingOverlay({
  isRecording,
  duration,
  isLocked,
  slideOffset,
  onCancel,
  onStop,
  onSlideChange,
  onLock,
}: VoiceRecordingOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Early return - inline recording bar for mobile (WhatsApp style)
  if (!isRecording) return null;

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const showCancelZone = slideOffset.x < -50;
  const showLockZone = slideOffset.y < -50;

  return (
    <>
      {/* Inline recording bar - replaces message input */}
      {!isLocked ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-4 pb-safe">
          <div className="flex items-center gap-3">
            {/* Trash icon zone (left) with animation */}
            <motion.div 
              animate={{
                scale: showCancelZone ? 1.2 : 1,
                backgroundColor: showCancelZone ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 0, 0, 0.1)'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center justify-center w-10 h-10 rounded-full"
            >
              <motion.div
                animate={{ 
                  scale: showCancelZone ? [1, 1.2, 1] : 1,
                  rotate: showCancelZone ? [0, -10, 10, -10, 0] : 0
                }}
                transition={{ 
                  repeat: showCancelZone ? Infinity : 0, 
                  duration: 0.5 
                }}
              >
                <Trash2 className={`w-5 h-5 transition-colors ${showCancelZone ? 'text-destructive' : 'text-muted-foreground'}`} />
              </motion.div>
            </motion.div>

            {/* Recording status - mic icon + timer + waveform */}
            <div className="flex-1 flex items-center gap-3 bg-muted/50 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
              <Mic className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium tabular-nums">{timeString}</span>
              
              {/* Simple waveform */}
              <div className="flex-1 flex items-center gap-0.5 h-6">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-primary rounded-full"
                    style={{
                      height: `${30 + Math.sin(i * 0.5 + duration) * 40}%`,
                      transition: 'height 0.1s',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Lock icon zone (right) with slide-up animation */}
            <motion.div 
              animate={{
                y: showLockZone ? -10 : 0,
                scale: showLockZone ? 1.2 : 1
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center justify-center w-10"
            >
              <Lock className={`w-5 h-5 transition-colors ${showLockZone ? 'text-primary' : 'text-muted-foreground'}`} />
              {showLockZone && (
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-primary font-medium mt-1"
                >
                  Lock
                </motion.span>
              )}
            </motion.div>
          </div>

          {/* Slide to cancel hint */}
          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground">
              {showCancelZone ? '← Release to cancel' : showLockZone ? '↑ Release to lock' : 'Slide left to cancel or up to lock'}
            </span>
          </div>
        </div>
      ) : (
        // Locked recording mode - control bar
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-4 pb-safe">
          <div className="flex items-center justify-between gap-4">
            {/* Trash button */}
            <button
              onClick={onCancel}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/20 hover:bg-destructive/30 transition-colors"
            >
              <Trash2 className="w-5 h-5 text-destructive" />
            </button>

            {/* Waveform + timer */}
            <div className="flex-1 flex items-center gap-3 bg-muted/50 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-medium tabular-nums">{timeString}</span>
              
              {/* Waveform */}
              <div className="flex-1 flex items-center gap-0.5 h-6">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-primary rounded-full"
                    style={{
                      height: `${30 + Math.sin(i * 0.5 + duration) * 40}%`,
                      transition: 'height 0.1s',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Send button */}
            <button
              onClick={onStop}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-primary hover:bg-primary/90 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-primary-foreground"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
