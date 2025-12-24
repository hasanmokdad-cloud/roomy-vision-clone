import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Lock, Trash2, Pause, Play, Send, ChevronLeft, LockOpen } from 'lucide-react';
import { VoiceWaveformLive } from './VoiceWaveformLive';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { haptics } from '@/utils/haptics';

type RecordingState = 'active' | 'locked' | 'paused' | 'preview';

type VoiceRecordingOverlayProps = {
  isRecording: boolean;
  isPaused: boolean;
  isLocked: boolean;
  isPreviewPlaying: boolean;
  duration: number;
  previewProgress: number;
  slideOffset: { x: number; y: number };
  mediaStream: MediaStream | null;
  onCancel: () => void;
  onSend: () => void;
  onPause: () => void;
  onResume: () => void;
  onPreviewPlay: () => void;
  onPreviewPause: () => void;
  onSlideChange: (offset: { x: number; y: number }) => void;
  onLock: () => void;
};

export function VoiceRecordingOverlay({
  isRecording,
  isPaused,
  isLocked,
  isPreviewPlaying,
  duration,
  previewProgress,
  slideOffset,
  mediaStream,
  onCancel,
  onSend,
  onPause,
  onResume,
  onPreviewPlay,
  onPreviewPause,
  onSlideChange,
  onLock,
}: VoiceRecordingOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  
  if (!isRecording) return null;

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const showCancelZone = slideOffset.x < -80;
  const showLockZone = slideOffset.y < -60;

  // Determine recording state
  const getRecordingState = (): RecordingState => {
    if (isPreviewPlaying) return 'preview';
    if (isPaused) return 'paused';
    if (isLocked) return 'locked';
    return 'active';
  };

  const recordingState = getRecordingState();

  // Calculate preview time display
  const getPreviewTimeDisplay = () => {
    if (recordingState === 'preview' || recordingState === 'paused') {
      const currentSeconds = Math.floor(previewProgress * duration);
      const currentMins = Math.floor(currentSeconds / 60);
      const currentSecs = currentSeconds % 60;
      return `${currentMins}:${currentSecs.toString().padStart(2, '0')}`;
    }
    return timeString;
  };

  // Animation settings based on reduced motion preference
  const springTransition = prefersReducedMotion 
    ? { duration: 0.1 } 
    : { type: 'spring', stiffness: 300, damping: 20 };

  // Handlers with haptics
  const handleCancel = () => {
    haptics.error();
    onCancel();
  };

  const handleSend = () => {
    haptics.success();
    onSend();
  };

  const handlePause = () => {
    haptics.medium();
    onPause();
  };

  const handleResume = () => {
    haptics.medium();
    onResume();
  };

  const handlePreviewPlay = () => {
    haptics.light();
    onPreviewPlay();
  };

  const handlePreviewPause = () => {
    haptics.light();
    onPreviewPause();
  };

  // State A: Active Recording (Not Locked) - User holding mic button
  // WhatsApp style: [Trash] [< Slide to cancel] [Timer] [Waveform] [Lock icon ↑]
  // Position accounts for Safari bottom URL bar using safe-area-inset-bottom
  if (recordingState === 'active') {
    return (
      <div 
        className="fixed left-0 right-0 z-[60] bg-card border-t border-border touch-none"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 56px)' }}
      >
        <div className="flex items-center h-14 px-3 gap-2">
          {/* Cancel zone indicator (left) */}
          <motion.div 
            animate={{
              scale: showCancelZone ? 1.2 : 1,
              backgroundColor: showCancelZone ? 'hsl(var(--destructive))' : 'transparent'
            }}
            transition={springTransition}
            className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
          >
            <Trash2 className={`w-5 h-5 transition-colors duration-200 ${showCancelZone ? 'text-destructive-foreground' : 'text-muted-foreground'}`} />
          </motion.div>

          {/* Slide to cancel text + Timer + Waveform */}
          <motion.div 
            className="flex-1 flex items-center gap-3 overflow-hidden"
            animate={{ x: Math.max(slideOffset.x * 0.3, -50) }}
            transition={{ duration: 0.05 }}
          >
            {/* Slide to cancel indicator */}
            <motion.div 
              className="flex items-center gap-1 text-muted-foreground shrink-0"
              animate={{ opacity: showCancelZone ? 0 : 1 }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs whitespace-nowrap">Slide to cancel</span>
            </motion.div>

            {/* Recording dot + Timer */}
            <div className="flex items-center gap-2 shrink-0">
              <motion.div 
                animate={prefersReducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={prefersReducedMotion ? { duration: 0 } : { repeat: Infinity, duration: 1 }}
                className="w-2 h-2 bg-destructive rounded-full"
              />
              <span className="text-sm font-medium tabular-nums text-foreground">{timeString}</span>
            </div>

            {/* Live waveform */}
            <div className="flex-1 min-w-0">
              <VoiceWaveformLive 
                stream={mediaStream} 
                isActive={!isPaused} 
                barCount={20}
                className="h-6"
              />
            </div>
          </motion.div>

          {/* Lock zone (right) */}
          <motion.div 
            animate={{
              y: prefersReducedMotion ? 0 : (showLockZone ? -5 : 0),
              scale: showLockZone ? 1.15 : 1
            }}
            transition={springTransition}
            className="flex flex-col items-center justify-center w-10 shrink-0"
          >
            {showLockZone ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center"
              >
                <Lock className="w-5 h-5 text-primary-foreground" />
              </motion.div>
            ) : (
              <div className="flex flex-col items-center">
                <motion.div
                  animate={prefersReducedMotion ? {} : { y: [0, -3, 0] }}
                  transition={prefersReducedMotion ? {} : { repeat: Infinity, duration: 1.5 }}
                >
                  <LockOpen className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // States B, C, D: Locked, Paused, or Preview
  // WhatsApp style: [Trash(red)] [Pause/Resume] [Play(if paused)] [Waveform+Timer] [Send(green)]
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={prefersReducedMotion ? { duration: 0.1 } : { type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed left-0 right-0 z-[60] bg-card border-t border-border touch-none"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 56px)' }}
      >
        <div className="flex items-center h-14 px-3 gap-2">
          {/* Trash button (red circle) */}
          <motion.button
            whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
            onClick={handleCancel}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive shrink-0"
          >
            <Trash2 className="w-5 h-5 text-destructive-foreground" />
          </motion.button>

          {/* Pause/Resume button */}
          {recordingState === 'locked' ? (
            <motion.button
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
              onClick={handlePause}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-muted shrink-0"
            >
              <Pause className="w-5 h-5 text-foreground" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
              onClick={handleResume}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-muted shrink-0"
            >
              <Mic className="w-5 h-5 text-foreground" />
            </motion.button>
          )}

          {/* Preview Play/Pause button (only in paused/preview states) */}
          {(recordingState === 'paused' || recordingState === 'preview') && (
            <motion.button
              initial={prefersReducedMotion ? {} : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0.1 } : { type: 'spring', stiffness: 400, damping: 20 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
              onClick={isPreviewPlaying ? handlePreviewPause : handlePreviewPlay}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0"
            >
              {isPreviewPlaying ? (
                <Pause className="w-5 h-5 text-primary" />
              ) : (
                <Play className="w-5 h-5 text-primary ml-0.5" />
              )}
            </motion.button>
          )}

          {/* Waveform + timer */}
          <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5 min-w-0 overflow-hidden">
            {/* Recording indicator or static dot */}
            {recordingState === 'locked' ? (
              <motion.div 
                animate={prefersReducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={prefersReducedMotion ? { duration: 0 } : { repeat: Infinity, duration: 1 }}
                className="w-2 h-2 bg-destructive rounded-full shrink-0"
              />
            ) : (
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full shrink-0" />
            )}
            
            {/* Waveform - live when locked, static/progress otherwise */}
            {recordingState === 'locked' ? (
              <VoiceWaveformLive 
                stream={mediaStream} 
                isActive={true} 
                barCount={16}
                className="flex-1"
              />
            ) : (
              <div className="flex-1 flex items-center gap-0.5 h-6 relative">
                {Array.from({ length: 16 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={prefersReducedMotion ? {} : { scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { delay: i * 0.02, duration: 0.2 }}
                    className={`flex-1 rounded-full transition-colors duration-150 ${
                      (recordingState === 'preview' || recordingState === 'paused') && (i / 16) < previewProgress
                        ? 'bg-primary'
                        : 'bg-muted-foreground/30'
                    }`}
                    style={{
                      height: `${30 + Math.sin(i * 0.8) * 50}%`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Timer */}
            <span className="text-sm font-medium tabular-nums shrink-0 text-foreground">
              {getPreviewTimeDisplay()}
              {(recordingState === 'paused' || recordingState === 'preview') && (
                <span className="text-muted-foreground">/{timeString}</span>
              )}
            </span>
          </div>

          {/* Send button (green circle) */}
          <motion.button
            whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
            whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
            onClick={handleSend}
            className="flex items-center justify-center w-12 h-12 rounded-full shrink-0"
            style={{ backgroundColor: 'hsl(142, 70%, 45%)' }}
          >
            <Send className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}