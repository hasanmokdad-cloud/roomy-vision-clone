import { useEffect, useRef, useState } from 'react';
import { Pause, Mic } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Custom rounded play icon matching WhatsApp style
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path 
        d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86a1 1 0 00-1.5.86z"
      />
    </svg>
  );
}

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

  // Generate stable waveform bars (seeded by audioUrl hash) - WhatsApp has ~35 bars
  const waveformBars = Array.from({ length: 35 }).map((_, i) => {
    const seed = (i * 7 + audioUrl.length) % 100;
    return 20 + Math.sin(i * 0.4 + seed * 0.1) * 15 + (seed % 20);
  });

  // Calculate blue dot position
  const dotPosition = progress;

  return (
    <div className="flex items-center gap-3 min-w-[280px] max-w-[340px]">
      {/* Sender's profile picture with mic icon - WhatsApp style */}
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={senderAvatar} />
          <AvatarFallback className="text-sm bg-[#dfe5e7] dark:bg-[#3b4a54] text-[#8696a0]">
            {senderName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {/* Green mic icon - WhatsApp style */}
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#25d366] flex items-center justify-center border-2 border-white dark:border-[#005c4b]">
          <Mic className="w-2.5 h-2.5 text-white" />
        </div>
      </div>

      {/* WhatsApp-style play button - vertically centered with waveform */}
      <button
        onClick={togglePlayPause}
        className="shrink-0 text-[#8696a0] hover:text-[#667781] dark:hover:text-[#aebac1] transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="h-8 w-8" fill="currentColor" strokeWidth={0} />
        ) : (
          <PlayIcon className="h-8 w-8" />
        )}
      </button>

      {/* Waveform container with duration positioned absolutely */}
      <div className="flex-1 relative min-w-[100px]">
        {/* Waveform with blue progress dot - truly centered */}
        <div className="relative flex items-center justify-center gap-[2px] h-8">
          {waveformBars.map((height, i) => {
            const barProgress = (i / waveformBars.length) * 100;
            const isPast = barProgress <= progress;
            return (
              <div
                key={i}
                className={`w-[3px] rounded-full transition-colors duration-100 ${
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
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#53bdeb] shadow-sm transition-all duration-100"
            style={{ 
              left: `calc(${Math.min(Math.max(dotPosition, 0), 100)}% - 7px)`,
            }}
          />
        </div>

        {/* Duration - positioned below waveform without affecting centering */}
        <span className="absolute left-0 top-full mt-0.5 text-[11px] text-[#667781] dark:text-[#8696a0] tabular-nums">
          {formatTime(isPlaying ? currentTime : audioDuration)}
        </span>
      </div>
    </div>
  );
}
