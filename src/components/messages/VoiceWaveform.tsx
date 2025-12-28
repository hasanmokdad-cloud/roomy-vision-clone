import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VoiceWaveformProps {
  audioUrl: string;
  duration?: number;
  isSender?: boolean;
  messageId?: string;
  onPlay?: (messageId: string) => void;
  senderAvatar?: string;
  senderName?: string;
}

export function VoiceWaveform({ 
  audioUrl, 
  duration, 
  isSender = false, 
  messageId, 
  onPlay,
  senderAvatar,
  senderName = 'User'
}: VoiceWaveformProps) {
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

  // Generate stable waveform bars (seeded by audioUrl hash) - reduced count for compact layout
  const waveformBars = Array.from({ length: 28 }).map((_, i) => {
    const seed = (i * 7 + audioUrl.length) % 100;
    return 20 + Math.sin(i * 0.4 + seed * 0.1) * 15 + (seed % 20);
  });

  // Calculate blue dot position
  const dotPosition = progress;

  return (
    <div className="flex items-center gap-2 min-w-[160px] max-w-[220px]">
      {/* Sender's profile picture - WhatsApp style */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={senderAvatar} />
        <AvatarFallback className="text-xs bg-[#dfe5e7] dark:bg-[#3b4a54] text-[#8696a0]">
          {senderName[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* WhatsApp-style play button - no circular background, just filled icon */}
      <button
        onClick={togglePlayPause}
        className="shrink-0 text-[#8696a0] hover:text-[#667781] dark:hover:text-[#aebac1] transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="h-7 w-7" fill="currentColor" strokeWidth={0} />
        ) : (
          <Play className="h-7 w-7 ml-0.5" fill="currentColor" strokeWidth={0} />
        )}
      </button>

      {/* Waveform container */}
      <div className="flex-1 flex flex-col gap-1">
        {/* Waveform with blue progress dot */}
        <div className="relative flex items-center gap-[1px] h-5">
          {waveformBars.map((height, i) => {
            const barProgress = (i / waveformBars.length) * 100;
            const isPast = barProgress <= progress;
            return (
              <div
                key={i}
                className={`w-[2px] rounded-full transition-colors duration-100 ${
                  isPast 
                    ? 'bg-[#53bdeb]'
                    : 'bg-[#8696a0]/40 dark:bg-[#8696a0]/30'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
          
          {/* Blue progress dot - WhatsApp style */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#53bdeb] shadow-sm transition-all duration-100"
            style={{ 
              left: `calc(${Math.min(Math.max(dotPosition, 0), 100)}% - 6px)`,
            }}
          />
        </div>

        {/* Duration - at start, WhatsApp style */}
        <span className="text-[11px] text-[#667781] dark:text-[#8696a0] tabular-nums">
          {formatTime(isPlaying ? currentTime : audioDuration)}
        </span>
      </div>
    </div>
  );
}
