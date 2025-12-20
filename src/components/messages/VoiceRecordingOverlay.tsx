import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Lock, Trash2, Pause, Play, Send, ChevronUp } from 'lucide-react';
import { VoiceWaveformLive } from './VoiceWaveformLive';

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
  if (!isRecording) return null;

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const showCancelZone = slideOffset.x < -50;
  const showLockZone = slideOffset.y < -50;

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
    if (recordingState === 'preview') {
      const currentSeconds = Math.floor(previewProgress * duration);
      const currentMins = Math.floor(currentSeconds / 60);
      const currentSecs = currentSeconds % 60;
      return `${currentMins}:${currentSecs.toString().padStart(2, '0')} / ${timeString}`;
    }
    return timeString;
  };

  // State A: Active Recording (Not Locked) - User holding mic button
  if (recordingState === 'active') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-4 pb-safe">
        <div className="flex items-center gap-3">
          {/* Trash zone (left) */}
          <motion.div 
            animate={{
              scale: showCancelZone ? 1.3 : 1,
              backgroundColor: showCancelZone ? 'hsl(var(--destructive) / 0.3)' : 'hsl(var(--muted))'
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

          {/* Recording status - mic icon + timer + live waveform */}
          <div className="flex-1 flex items-center gap-3 bg-muted/50 rounded-full px-4 py-2">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-2 h-2 bg-destructive rounded-full"
            />
            <Mic className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium tabular-nums min-w-[40px]">{timeString}</span>
            
            {/* Live waveform */}
            <VoiceWaveformLive 
              stream={mediaStream} 
              isActive={!isPaused} 
              barCount={16}
              className="flex-1"
            />
          </div>

          {/* Lock zone (right) */}
          <motion.div 
            animate={{
              y: showLockZone ? -10 : 0,
              scale: showLockZone ? 1.2 : 1
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex flex-col items-center justify-center w-10"
          >
            {showLockZone ? (
              <Lock className="w-5 h-5 text-primary" />
            ) : (
              <>
                <ChevronUp className="w-4 h-4 text-muted-foreground animate-bounce" />
                <Lock className="w-4 h-4 text-muted-foreground" />
              </>
            )}
          </motion.div>
        </div>

        {/* Slide hint */}
        <motion.div 
          animate={{ x: Math.max(slideOffset.x, -100) }}
          className="text-center mt-2"
        >
          <span className="text-xs text-muted-foreground">
            {showCancelZone ? '← Release to cancel' : showLockZone ? '↑ Release to lock' : '← Slide to cancel • Slide up to lock ↑'}
          </span>
        </motion.div>
      </div>
    );
  }

  // States B, C, D: Locked, Paused, or Preview
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-4 pb-safe">
      <div className="flex items-center gap-3">
        {/* Trash button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onCancel}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/20 hover:bg-destructive/30 transition-colors"
        >
          <Trash2 className="w-5 h-5 text-destructive" />
        </motion.button>

        {/* Pause/Resume or Mic button */}
        {recordingState === 'locked' ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onPause}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <Pause className="w-5 h-5 text-foreground" />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onResume}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <Mic className="w-5 h-5 text-foreground" />
          </motion.button>
        )}

        {/* Preview Play/Pause button (only in paused/preview states) */}
        {(recordingState === 'paused' || recordingState === 'preview') && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={isPreviewPlaying ? onPreviewPause : onPreviewPlay}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
          >
            {isPreviewPlaying ? (
              <Pause className="w-5 h-5 text-primary" />
            ) : (
              <Play className="w-5 h-5 text-primary ml-0.5" />
            )}
          </motion.button>
        )}

        {/* Waveform + timer */}
        <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 overflow-hidden">
          {/* Recording indicator */}
          {recordingState === 'locked' ? (
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-2 h-2 bg-destructive rounded-full shrink-0"
            />
          ) : (
            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full shrink-0" />
          )}
          
          <span className="text-sm font-medium tabular-nums shrink-0 min-w-fit">
            {getPreviewTimeDisplay()}
          </span>
          
          {/* Waveform - live when locked, static/progress otherwise */}
          {recordingState === 'locked' ? (
            <VoiceWaveformLive 
              stream={mediaStream} 
              isActive={true} 
              barCount={12}
              className="flex-1"
            />
          ) : (
            <div className="flex-1 flex items-center gap-0.5 h-6 relative">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-colors ${
                    recordingState === 'preview' && (i / 12) < previewProgress
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                  }`}
                  style={{
                    height: `${30 + Math.sin(i * 0.8) * 40}%`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Send button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onSend}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-primary hover:bg-primary/90 transition-colors"
        >
          <Send className="w-5 h-5 text-primary-foreground" />
        </motion.button>
      </div>
    </div>
  );
}
