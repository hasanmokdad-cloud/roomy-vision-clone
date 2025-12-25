import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { Mic, Lock, LockOpen, Trash2, Pause, Play, Send, ChevronLeft, ChevronUp } from 'lucide-react';
import { VoiceWaveformLive } from './VoiceWaveformLive';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { haptics } from '@/utils/haptics';
import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [showCancelAnimation, setShowCancelAnimation] = useState(false);
  const [micPulseActive, setMicPulseActive] = useState(true);
  const cancelTextControls = useAnimation();
  const lockPanelRef = useRef<HTMLDivElement>(null);
  
  if (!isRecording) return null;

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

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

  // Handlers with haptics
  const handleCancel = useCallback(() => {
    haptics.error();
    setShowCancelAnimation(true);
  }, []);

  const handleSend = useCallback(() => {
    haptics.success();
    onSend();
  }, [onSend]);

  const handlePause = useCallback(() => {
    haptics.medium();
    onPause();
  }, [onPause]);

  const handleResume = useCallback(() => {
    haptics.medium();
    onResume();
  }, [onResume]);

  const handlePreviewPlay = useCallback(() => {
    haptics.light();
    onPreviewPlay();
  }, [onPreviewPlay]);

  const handlePreviewPause = useCallback(() => {
    haptics.light();
    onPreviewPause();
  }, [onPreviewPause]);

  // Handle horizontal pan for "slide to cancel" text only
  const handleCancelTextPan = useCallback((_: any, info: PanInfo) => {
    // Only track horizontal movement, clamp to reasonable range
    const x = Math.min(0, Math.max(-150, info.offset.x));
    onSlideChange({ x, y: slideOffset.y });
  }, [onSlideChange, slideOffset.y]);

  const handleCancelTextPanEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      // Threshold reached - trigger cancel animation
      haptics.error();
      setShowCancelAnimation(true);
    } else {
      // Reset position
      onSlideChange({ x: 0, y: slideOffset.y });
    }
  }, [onSlideChange, slideOffset.y]);

  // Handle vertical drag for lock
  const handleLockPan = useCallback((_: any, info: PanInfo) => {
    // Only track vertical movement upward
    const y = Math.min(0, Math.max(-120, info.offset.y));
    onSlideChange({ x: slideOffset.x, y });
  }, [onSlideChange, slideOffset.x]);

  const handleLockPanEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.y < -60) {
      // Threshold reached - lock recording
      haptics.success();
      onLock();
    }
    // Reset position (either locked or not)
    onSlideChange({ x: 0, y: 0 });
  }, [onSlideChange, onLock]);

  // Watch slideOffset.x from parent touch tracking to trigger cancel
  useEffect(() => {
    if (slideOffset.x < -100 && recordingState === 'active' && !showCancelAnimation) {
      haptics.error();
      setShowCancelAnimation(true);
    }
  }, [slideOffset.x, recordingState, showCancelAnimation]);

  // Cancel animation completion handler
  useEffect(() => {
    if (showCancelAnimation) {
      const timer = setTimeout(() => {
        onCancel();
        setShowCancelAnimation(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [showCancelAnimation, onCancel]);

  // Mic pulse animation
  useEffect(() => {
    if (recordingState === 'active' && !prefersReducedMotion) {
      const interval = setInterval(() => {
        setMicPulseActive(prev => !prev);
      }, 600);
      return () => clearInterval(interval);
    }
  }, [recordingState, prefersReducedMotion]);

  const showCancelZone = slideOffset.x < -80;
  const showLockZone = slideOffset.y < -40;
  const lockProgress = Math.min(1, Math.abs(slideOffset.y) / 60);

  // Animation variants
  const springTransition = prefersReducedMotion 
    ? { duration: 0.1 } 
    : { type: 'spring', stiffness: 400, damping: 30 };

  // Cancel Animation State
  if (showCancelAnimation) {
    return (
      <motion.div className="relative h-12 flex items-center justify-center overflow-hidden">
        {/* Trash bin animation */}
        <motion.div
          className="absolute left-4 flex flex-col items-center"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <motion.div
            initial={{ y: -40, rotate: 0, opacity: 1 }}
            animate={{ y: 0, rotate: -90, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeIn' }}
            className="absolute -top-8"
          >
            <Mic className="w-5 h-5 text-destructive" />
          </motion.div>
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 0.9], y: 60, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Trash2 className="w-6 h-6 text-destructive" />
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // Calculate visual feedback intensities
  const cancelIntensity = Math.min(1, Math.abs(slideOffset.x) / 100);
  const lockIntensity = Math.min(1, Math.abs(slideOffset.y) / 60);
  const isNearCancel = slideOffset.x < -50;
  const isNearLock = slideOffset.y < -40;

  // ============= ACTIVE RECORDING STATE =============
  if (recordingState === 'active') {
    return (
      <div className="relative touch-none overflow-hidden">
        {/* Trash icon - appears on left when swiping left */}
        <motion.div
          className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center z-20"
          initial={{ opacity: 0, scale: 0.5, x: -20 }}
          animate={{ 
            opacity: isNearCancel ? 1 : cancelIntensity * 0.6,
            scale: isNearCancel ? 1.2 : 0.8 + cancelIntensity * 0.2,
            x: 0,
          }}
          transition={springTransition}
        >
          <motion.div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: `hsl(0, ${60 + cancelIntensity * 20}%, ${50 + cancelIntensity * 10}%)`,
            }}
            animate={{
              scale: isNearCancel ? [1, 1.1, 1] : 1,
            }}
            transition={isNearCancel ? { repeat: Infinity, duration: 0.6 } : {}}
          >
            <Trash2 className="w-5 h-5 text-white" />
          </motion.div>
        </motion.div>

        {/* Floating Lock Panel - WhatsApp style */}
        <motion.div 
          ref={lockPanelRef}
          className="absolute -top-24 right-1 flex flex-col items-center pointer-events-none z-10"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1 + lockIntensity * 0.1, 
            y: 0,
          }}
          transition={{ ...springTransition, delay: 0.1 }}
        >
          {/* Lock container bar */}
          <motion.div
            className="bg-muted/90 backdrop-blur-sm rounded-full px-2 py-2 flex flex-col items-center gap-1"
            animate={{
              height: isNearLock ? 70 : 100 - lockIntensity * 30,
              backgroundColor: isNearLock ? 'hsl(142, 70%, 45%)' : undefined,
            }}
            transition={springTransition}
          >
            {/* Lock icon */}
            <motion.div
              animate={{
                y: prefersReducedMotion ? 0 : isNearLock ? 0 : [0, -3, 0],
                scale: isNearLock ? 1.2 : 1,
              }}
              transition={
                prefersReducedMotion 
                  ? {} 
                  : isNearLock 
                    ? springTransition 
                    : { repeat: Infinity, duration: 1.2, ease: 'easeInOut' }
              }
            >
              {isNearLock ? (
                <Lock className="w-5 h-5 text-white" />
              ) : (
                <LockOpen className="w-5 h-5 text-muted-foreground" />
              )}
            </motion.div>
            
            {/* Up arrow - hides when near lock */}
            <motion.div
              animate={{ 
                opacity: isNearLock ? 0 : 1,
                y: prefersReducedMotion ? 0 : [0, -2, 0] 
              }}
              transition={prefersReducedMotion ? {} : { repeat: Infinity, duration: 1, ease: 'easeInOut', delay: 0.2 }}
            >
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Recording bar - ENTIRE bar slides with finger */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            x: slideOffset.x, // Entire bar moves left with swipe
          }}
          transition={{ x: { type: 'tween', duration: 0 } }} // Instant x movement
          className="flex items-center h-12 gap-2"
        >
          {/* Left: Red mic icon (pulsing) + timer */}
          <motion.div 
            className="flex items-center gap-2 shrink-0"
            initial={{ x: 100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: isNearCancel ? 0.3 : 1, // Fade when near cancel
            }}
            transition={{ ...springTransition, delay: 0.05 }}
          >
            <motion.div 
              animate={{ 
                opacity: micPulseActive ? 1 : 0.4,
                scale: micPulseActive && !prefersReducedMotion ? 1.1 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center"
            >
              <Mic className="w-5 h-5 text-destructive" />
            </motion.div>
            <motion.span 
              className="text-sm font-medium tabular-nums text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {timeString}
            </motion.span>
          </motion.div>

          {/* Center: "slide to cancel" text */}
          <motion.div 
            className="flex-1 flex items-center justify-center overflow-hidden"
            initial={{ x: 100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: isNearCancel ? 0.3 : 1, // Fade when near cancel
            }}
            transition={{ ...springTransition, delay: 0.1 }}
          >
            <motion.div
              className="relative flex items-center gap-1 select-none overflow-hidden"
            >
              <motion.div
                animate={prefersReducedMotion ? {} : { x: [0, -4, 0] }}
                transition={prefersReducedMotion ? {} : { repeat: Infinity, duration: 1.5 }}
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </motion.div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Slide to cancel
              </span>
              
              {/* Shimmer effect */}
              {!prefersReducedMotion && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to left, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                    width: '100%',
                  }}
                  initial={{ x: '100%' }}
                  animate={{ x: '-100%' }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                />
              )}
            </motion.div>
          </motion.div>

          {/* Right: Green mic button - moves UP when swiping toward lock */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: isNearLock ? 1.15 : 1, 
              opacity: 1,
              y: slideOffset.y < 0 ? slideOffset.y * 0.7 : 0, // Moves up with swipe
            }}
            transition={{ 
              ...springTransition,
              y: { type: 'tween', duration: 0 }, // Instant y movement
            }}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'hsl(142, 70%, 45%)' }}
          >
            <Mic className="w-5 h-5 text-white" />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ============= LOCKED, PAUSED, or PREVIEW STATE =============
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        initial={{ opacity: 0, height: 48 }}
        animate={{ opacity: 1, height: recordingState === 'locked' ? 100 : 100 }}
        exit={{ opacity: 0, height: 48 }}
        transition={prefersReducedMotion ? { duration: 0.1 } : { type: 'spring', stiffness: 400, damping: 35 }}
        className="touch-none flex flex-col justify-between"
      >
        {/* Top Row: Waveform + Timer */}
        <motion.div 
          className="flex items-center gap-2 px-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Play/Pause for preview (only in paused/preview states) */}
          {(recordingState === 'paused' || recordingState === 'preview') && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={springTransition}
              onClick={isPreviewPlaying ? handlePreviewPause : handlePreviewPlay}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 shrink-0"
            >
              {isPreviewPlaying ? (
                <Pause className="w-4 h-4 text-primary" />
              ) : (
                <Play className="w-4 h-4 text-primary ml-0.5" />
              )}
            </motion.button>
          )}

          {/* Waveform bar container */}
          <div className="flex-1 flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-2 min-w-0 overflow-hidden">
            {/* Recording pulse indicator */}
            {recordingState === 'locked' && (
              <motion.div 
                animate={prefersReducedMotion ? {} : { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                transition={prefersReducedMotion ? {} : { repeat: Infinity, duration: 1 }}
                className="w-2 h-2 bg-destructive rounded-full shrink-0"
              />
            )}
            
            {/* Waveform */}
            {recordingState === 'locked' ? (
              <VoiceWaveformLive 
                stream={mediaStream} 
                isActive={true} 
                barCount={24}
                className="flex-1"
              />
            ) : (
              <div className="flex-1 flex items-center gap-0.5 h-6 relative">
                {Array.from({ length: 24 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={prefersReducedMotion ? {} : { scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={prefersReducedMotion ? {} : { delay: i * 0.012, duration: 0.15 }}
                    className={`flex-1 rounded-full transition-colors duration-150 ${
                      (recordingState === 'preview' || recordingState === 'paused') && (i / 24) < previewProgress
                        ? 'bg-primary'
                        : 'bg-muted-foreground/30'
                    }`}
                    style={{
                      height: `${30 + Math.sin(i * 0.7) * 50}%`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Timer */}
            <span className="text-xs font-medium tabular-nums shrink-0 text-foreground">
              {getPreviewTimeDisplay()}
              {(recordingState === 'paused' || recordingState === 'preview') && (
                <span className="text-muted-foreground"> / {timeString}</span>
              )}
            </span>
          </div>
        </motion.div>

        {/* Bottom Row: Action buttons */}
        <motion.div 
          className="flex items-center justify-between px-2 py-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {/* Trash button */}
          <motion.button
            whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
            onClick={handleCancel}
            className="flex items-center justify-center w-11 h-11 rounded-full border-2 border-destructive shrink-0"
          >
            <Trash2 className="w-5 h-5 text-destructive" />
          </motion.button>

          {/* Center: Pause/Resume button */}
          {recordingState === 'locked' ? (
            <motion.button
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
              onClick={handlePause}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive shrink-0"
            >
              <Pause className="w-5 h-5 text-destructive-foreground" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
              onClick={handleResume}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive shrink-0"
            >
              <Mic className="w-5 h-5 text-destructive-foreground" />
            </motion.button>
          )}

          {/* Send button */}
          <motion.button
            whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
            onClick={handleSend}
            className="flex items-center justify-center w-11 h-11 rounded-full shrink-0"
            style={{ backgroundColor: 'hsl(142, 70%, 45%)' }}
          >
            <Send className="w-5 h-5 text-white" />
          </motion.button>
        </motion.div>

        {/* Lock indicator animation on entry */}
        {recordingState === 'locked' && (
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none"
            initial={{ opacity: 1, scale: 1.5, y: 10 }}
            animate={{ opacity: 0, scale: 1, y: -20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Lock className="w-6 h-6 text-primary" />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
