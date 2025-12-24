import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Mic, Lock, Trash2, Pause, Play, Send, ChevronLeft, ChevronUp } from 'lucide-react';
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

  // Handle drag for swipe gestures
  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    onSlideChange({ x: info.offset.x, y: info.offset.y });
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      // Swiped left - cancel
      haptics.error();
      onCancel();
    } else if (info.offset.y < -80) {
      // Swiped up - lock
      haptics.success();
      onLock();
    } else {
      // Reset position
      onSlideChange({ x: 0, y: 0 });
    }
  };

  // State A: Active Recording (Not Locked) - User holding mic button
  // WhatsApp style: Red mic + timer on LEFT, "slide to cancel" in CENTER, mic icon on RIGHT
  // Lock icon floats ABOVE the bar
  if (recordingState === 'active') {
    return (
      <div className="relative touch-none">
        {/* Floating Lock indicator ABOVE the bar - WhatsApp style */}
        <motion.div 
          className="absolute -top-20 right-2 flex flex-col items-center pointer-events-none"
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: showLockZone ? 1 : 0.6,
            y: showLockZone ? -5 : 0,
            scale: showLockZone ? 1.15 : 1
          }}
          transition={springTransition}
        >
          <motion.div 
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${
              showLockZone ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <Lock className={`w-5 h-5 ${showLockZone ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
          </motion.div>
          <motion.div
            animate={prefersReducedMotion ? {} : { y: [0, -3, 0] }}
            transition={prefersReducedMotion ? {} : { repeat: Infinity, duration: 0.8 }}
          >
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </motion.div>

        {/* Draggable recording bar - WhatsApp layout */}
        <motion.div
          drag
          dragConstraints={{ left: -150, right: 0, top: -120, bottom: 0 }}
          dragElastic={0.15}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          className="flex items-center h-12 px-3 gap-3 cursor-grab active:cursor-grabbing"
        >
          {/* Left: Red mic icon + timer */}
          <div className="flex items-center gap-2 shrink-0">
            <motion.div 
              animate={prefersReducedMotion ? {} : { scale: [1, 1.15, 1] }}
              transition={prefersReducedMotion ? { duration: 0 } : { repeat: Infinity, duration: 1 }}
            >
              <Mic className="w-5 h-5 text-destructive" />
            </motion.div>
            <span className="text-sm font-medium tabular-nums text-destructive">{timeString}</span>
          </div>

          {/* Center: "slide to cancel <" */}
          <motion.div 
            className="flex-1 flex items-center justify-center gap-1"
            animate={{ opacity: showCancelZone ? 0.3 : 1 }}
          >
            <motion.div
              animate={prefersReducedMotion ? {} : { x: [0, -4, 0] }}
              transition={prefersReducedMotion ? {} : { repeat: Infinity, duration: 1.2 }}
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </motion.div>
            <span className="text-sm text-muted-foreground">Slide to cancel</span>
          </motion.div>

          {/* Right: Mic icon (finger position indicator) - WhatsApp green circle */}
          <motion.div 
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'hsl(142, 70%, 45%)' }}
            animate={prefersReducedMotion ? {} : { scale: [1, 1.05, 1] }}
            transition={prefersReducedMotion ? { duration: 0 } : { repeat: Infinity, duration: 1.5 }}
          >
            <Mic className="w-5 h-5 text-white" />
          </motion.div>
        </motion.div>
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
        className="touch-none"
      >
        <div className="flex items-center h-12 px-2 gap-1.5">
          {/* Trash button (red circle) - smaller */}
          <motion.button
            whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
            onClick={handleCancel}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-destructive shrink-0"
          >
            <Trash2 className="w-4 h-4 text-destructive-foreground" />
          </motion.button>

          {/* Pause/Resume button - smaller */}
          {recordingState === 'locked' ? (
            <motion.button
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
              onClick={handlePause}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-muted shrink-0"
            >
              <Pause className="w-4 h-4 text-foreground" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
              onClick={handleResume}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-muted shrink-0"
            >
              <Mic className="w-4 h-4 text-foreground" />
            </motion.button>
          )}

          {/* Preview Play/Pause button (only in paused/preview states) - smaller */}
          {(recordingState === 'paused' || recordingState === 'preview') && (
            <motion.button
              initial={prefersReducedMotion ? {} : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0.1 } : { type: 'spring', stiffness: 400, damping: 20 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
              onClick={isPreviewPlaying ? handlePreviewPause : handlePreviewPlay}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/20 shrink-0"
            >
              {isPreviewPlaying ? (
                <Pause className="w-4 h-4 text-primary" />
              ) : (
                <Play className="w-4 h-4 text-primary ml-0.5" />
              )}
            </motion.button>
          )}

          {/* Waveform + timer - wider bar */}
          <div className="flex-1 flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1.5 min-w-0 overflow-hidden">
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
                barCount={20}
                className="flex-1"
              />
            ) : (
              <div className="flex-1 flex items-center gap-0.5 h-5 relative">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={prefersReducedMotion ? {} : { scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { delay: i * 0.015, duration: 0.15 }}
                    className={`flex-1 rounded-full transition-colors duration-150 ${
                      (recordingState === 'preview' || recordingState === 'paused') && (i / 20) < previewProgress
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
            <span className="text-xs font-medium tabular-nums shrink-0 text-foreground">
              {getPreviewTimeDisplay()}
              {(recordingState === 'paused' || recordingState === 'preview') && (
                <span className="text-muted-foreground">/{timeString}</span>
              )}
            </span>
          </div>

          {/* Send button (green circle) - slightly smaller */}
          <motion.button
            whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
            whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
            onClick={handleSend}
            className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
            style={{ backgroundColor: 'hsl(142, 70%, 45%)' }}
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}