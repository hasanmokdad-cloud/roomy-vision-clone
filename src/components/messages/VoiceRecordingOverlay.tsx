import { useRef, useEffect } from 'react';
import { Mic, Lock, Trash2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const touchStartRef = useRef({ x: 0, y: 0 });

  if (!isRecording) return null;

  useEffect(() => {
    if (!overlayRef.current) return;

    const overlay = overlayRef.current;

    const handleTouchMove = (e: TouchEvent) => {
      if (isLocked) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      onSlideChange({ x: deltaX, y: deltaY });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Check if slid up to lock
      if (slideOffset.y < -80 && !isLocked) {
        onLock();
        return;
      }

      // Check if slid left to cancel
      if (slideOffset.x < -100) {
        onCancel();
        return;
      }

      // Otherwise, send the message
      if (!isLocked) {
        onStop();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    overlay.addEventListener('touchstart', handleTouchStart, { passive: true });
    overlay.addEventListener('touchmove', handleTouchMove, { passive: true });
    overlay.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      overlay.removeEventListener('touchstart', handleTouchStart);
      overlay.removeEventListener('touchmove', handleTouchMove);
      overlay.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isLocked, slideOffset, onSlideChange, onLock, onCancel, onStop]);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const showCancelZone = slideOffset.x < -50;
  const showLockZone = slideOffset.y < -80;
  const cancelProgress = Math.min(100, Math.abs(slideOffset.x));
  const lockProgress = Math.min(100, Math.abs(slideOffset.y) / 0.8);

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center"
    >
      {/* Recording status */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-4 h-4 bg-destructive rounded-full animate-pulse" />
          <span className="text-2xl font-bold text-foreground">{timeString}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {isLocked ? 'Recording...' : 'Hold to record'}
        </p>
      </div>

      {/* Waveform visualization (simple animated bars) */}
      <div className="flex items-center justify-center gap-1 h-16 mb-12">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-primary rounded-full transition-all duration-100"
            style={{
              height: `${20 + Math.random() * 60}%`,
              animation: 'pulse 0.5s ease-in-out infinite',
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>

      {/* Cancel zone (slide left) */}
      {!isLocked && (
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-opacity ${showCancelZone ? 'opacity-100' : 'opacity-30'}`}>
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center transition-transform"
              style={{ transform: `scale(${1 + cancelProgress / 200})` }}
            >
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <div className="text-xs text-destructive font-medium whitespace-nowrap">
              {showCancelZone ? 'Release to cancel' : '← Slide to cancel'}
            </div>
          </div>
        </div>
      )}

      {/* Lock zone (slide up) */}
      {!isLocked && (
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 transition-opacity ${showLockZone ? 'opacity-100' : 'opacity-30'}`}>
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center transition-transform"
              style={{ transform: `scale(${1 + lockProgress / 200})` }}
            >
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div className="text-xs text-primary font-medium whitespace-nowrap">
              {showLockZone ? 'Release to lock' : 'Slide up to lock'}
            </div>
          </div>
        </div>
      )}

      {/* Microphone or stop button */}
      <div className="absolute bottom-32">
        {isLocked ? (
          <Button
            size="lg"
            variant="destructive"
            className="rounded-full w-16 h-16"
            onClick={onStop}
          >
            <Square className="w-6 h-6" />
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-20 h-20 rounded-full bg-primary flex items-center justify-center"
              style={{
                transform: `translate(${slideOffset.x}px, ${slideOffset.y}px)`,
                transition: 'none',
              }}
            >
              <Mic className="w-8 h-8 text-primary-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Release to send</p>
          </div>
        )}
      </div>

      {/* Cancel button when locked */}
      {isLocked && (
        <div className="absolute bottom-16">
          <Button variant="ghost" onClick={onCancel} className="text-destructive">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
