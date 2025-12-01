import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceWaveformProps {
  audioUrl: string;
  duration?: number;
  isSender?: boolean;
}

export function VoiceWaveform({ audioUrl, duration, isSender = false }: VoiceWaveformProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(Math.floor(audio.duration));
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener('error', () => {
      setAudioError(true);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  if (audioError) {
    return (
      <div className="flex items-center gap-2 text-xs opacity-70">
        <span>Audio unavailable</span>
        <a href={audioUrl} download className="underline hover:text-primary">
          Download
        </a>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 min-w-[240px] ${isSender ? 'text-primary-foreground' : 'text-foreground'}`}>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 rounded-full shrink-0 ${isSender ? 'hover:bg-primary-foreground/20' : 'hover:bg-muted'}`}
        onClick={togglePlayPause}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" fill="currentColor" />
        ) : (
          <Play className="h-4 w-4" fill="currentColor" />
        )}
      </Button>

      {/* Waveform visualization */}
      <div className="flex-1 flex items-center gap-0.5 h-8">
        {Array.from({ length: 40 }).map((_, i) => {
          const height = 30 + Math.sin(i * 0.5) * 20 + Math.random() * 10;
          const isPast = (i / 40) * 100 <= progress;
          return (
            <div
              key={i}
              className={`w-0.5 rounded-full transition-all duration-100 ${
                isPast 
                  ? isSender ? 'bg-primary-foreground' : 'bg-primary'
                  : isSender ? 'bg-primary-foreground/30' : 'bg-muted-foreground/30'
              }`}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <span className={`text-xs tabular-nums shrink-0 ${isSender ? 'opacity-90' : 'opacity-70'}`}>
        {formatTime(isPlaying ? currentTime : audioDuration)}
      </span>
    </div>
  );
}
