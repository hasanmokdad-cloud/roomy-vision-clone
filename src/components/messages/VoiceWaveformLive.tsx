import { useRef, useEffect, useState, useCallback } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface VoiceWaveformLiveProps {
  stream: MediaStream | null;
  isActive: boolean;
  barCount?: number;
  className?: string;
}

export function VoiceWaveformLive({ 
  stream, 
  isActive, 
  barCount = 20,
  className = ''
}: VoiceWaveformLiveProps) {
  const [bars, setBars] = useState<number[]>(Array(barCount).fill(20));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const prefersReducedMotion = useReducedMotion();

  // Throttle updates for performance (target ~30fps instead of 60fps)
  const updateInterval = prefersReducedMotion ? 100 : 33;

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // Ignore close errors
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    if (!stream || !isActive) {
      // Reset bars when inactive
      setBars(Array(barCount).fill(20));
      cleanup();
      return;
    }

    // Create audio context and analyser
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128; // Increased for more frequency detail (64 bins)
      analyser.smoothingTimeConstant = 0.3; // Lower for more responsive bars
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateWaveform = (timestamp: number) => {
        if (!analyserRef.current || !isActive) return;

        // Throttle updates
        if (timestamp - lastUpdateRef.current < updateInterval) {
          animationFrameRef.current = requestAnimationFrame(updateWaveform);
          return;
        }
        lastUpdateRef.current = timestamp;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Map frequency data to bar heights
        const step = Math.floor(dataArray.length / barCount);
        const newBars: number[] = [];
        
        for (let i = 0; i < barCount; i++) {
          // Get average of a range of frequencies for each bar
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j] || 0;
          }
          const avg = sum / step;
          // More dynamic height mapping with slight jitter for organic feel
          const baseHeight = Math.max(8, Math.min(100, (avg / 255) * 120));
          const jitter = Math.random() * 3 - 1.5;
          const height = Math.max(8, Math.min(100, baseHeight + jitter));
          newBars.push(height);
        }

        setBars(newBars);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      setBars(Array(barCount).fill(20));
    }

    return cleanup;
  }, [stream, isActive, barCount, cleanup, updateInterval]);

  return (
    <div className={`flex items-center gap-0.5 h-6 ${className}`}>
      {bars.map((height, i) => (
        <div
          key={i}
          className="flex-1 bg-primary rounded-full min-w-[2px] max-w-[3px]"
          style={{ 
            height: `${height}%`,
            opacity: 0.7 + (height / 100) * 0.3, // Brighter when higher
            transition: prefersReducedMotion ? 'none' : 'height 50ms ease-out' // Faster transitions
          }}
        />
      ))}
    </div>
  );
}