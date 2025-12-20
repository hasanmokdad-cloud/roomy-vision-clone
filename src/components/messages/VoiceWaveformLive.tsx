import { useRef, useEffect, useState } from 'react';

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

  useEffect(() => {
    if (!stream || !isActive) {
      // Reset bars when inactive
      setBars(Array(barCount).fill(20));
      return;
    }

    // Create audio context and analyser
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.4;
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateWaveform = () => {
      if (!analyserRef.current || !isActive) return;

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
        // Map 0-255 to 15-100 (percentage height)
        const height = Math.max(15, Math.min(100, (avg / 255) * 100 + 15));
        newBars.push(height);
      }

      setBars(newBars);
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stream, isActive, barCount]);

  return (
    <div className={`flex items-center gap-0.5 h-6 ${className}`}>
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-0.5 bg-primary rounded-full transition-all duration-75"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}
