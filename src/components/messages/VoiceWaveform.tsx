import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceWaveformProps {
  audioUrl: string;
  duration?: number;
  isSender?: boolean;
  messageId?: string;
  onPlay?: (messageId: string) => void;
}

export function VoiceWaveform({ audioUrl, duration, isSender = false, messageId, onPlay }: VoiceWaveformProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasTriggeredPlayRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  // Validate initial duration - cap at 900 seconds (15 min), default to 0 if invalid
  const validDuration = duration && isFinite(duration) && duration > 0 && duration <= 900 ? duration : 0;
  const [audioDuration, setAudioDuration] = useState(validDuration);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      // Check for valid duration (not Infinity or NaN)
      if (isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(Math.floor(audio.duration));
      } else if (duration && isFinite(duration)) {
        // Fallback to prop duration if provided
        setAudioDuration(duration);
      }
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
  }, [audioUrl, duration]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
      
      // Trigger onPlay callback only once per message (for recipients)
      if (onPlay && messageId && !hasTriggeredPlayRef.current && !isSender) {
        hasTriggeredPlayRef.current = true;
        onPlay(messageId);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
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

  // Generate stable waveform bars (seeded by audioUrl hash)
  const waveformBars = Array.from({ length: 40 }).map((_, i) => {
    const seed = (i * 7 + audioUrl.length) % 100;
    return 20 + Math.sin(i * 0.4 + seed * 0.1) * 15 + (seed % 20);
  });

  return (
    <div className={`flex items-center gap-3 min-w-[200px] ${isSender ? 'text-[#111b21] dark:text-[#e9edef]' : 'text-[#111b21] dark:text-[#e9edef]'}`}>
      {/* WhatsApp-style circular play button */}
      <button
        onClick={togglePlayPause}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isSender 
            ? 'bg-[#25d366] hover:bg-[#1fbc5a] text-white' 
            : 'bg-[#00a884] hover:bg-[#008f72] text-white'
        }`}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" fill="currentColor" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Horizontal waveform visualization */}
      <div className="flex-1 flex items-center gap-[2px] h-6">
        {waveformBars.map((height, i) => {
          const isPast = (i / 40) * 100 <= progress;
          return (
            <div
              key={i}
              className={`w-[3px] rounded-full transition-colors duration-100 ${
                isPast 
                  ? 'bg-[#25d366] dark:bg-[#25d366]'
                  : isSender 
                    ? 'bg-[#8696a0]/50 dark:bg-[#8696a0]/40' 
                    : 'bg-[#8696a0]/50 dark:bg-[#8696a0]/40'
              }`}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>

      {/* Duration - WhatsApp style */}
      <span className="text-[11px] text-[#667781] dark:text-[#8696a0] tabular-nums shrink-0">
        {formatTime(isPlaying ? currentTime : audioDuration)}
      </span>
    </div>
  );
}