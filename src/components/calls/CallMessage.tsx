import React from 'react';
import { Phone, Video, PhoneIncoming, PhoneMissed, PhoneOutgoing } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallMessageProps {
  callType: 'voice' | 'video';
  status: 'ended' | 'missed' | 'declined';
  duration?: number;
  isOutgoing: boolean;
  timestamp: string;
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const CallMessage: React.FC<CallMessageProps> = ({
  callType,
  status,
  duration,
  isOutgoing,
  timestamp,
}) => {
  const isMissed = status === 'missed' || status === 'declined';
  const isVideo = callType === 'video';

  const getIcon = () => {
    if (isMissed) {
      return <PhoneMissed className="h-4 w-4" />;
    }
    if (isOutgoing) {
      return <PhoneOutgoing className="h-4 w-4" />;
    }
    return <PhoneIncoming className="h-4 w-4" />;
  };

  const getMessage = () => {
    const callTypeText = isVideo ? 'Video call' : 'Voice call';
    
    if (isMissed) {
      return `Missed ${callTypeText.toLowerCase()}`;
    }
    
    if (duration) {
      return `${callTypeText} · ${formatDuration(duration)}`;
    }
    
    return callTypeText;
  };

  return (
    <div className="flex items-center justify-center py-2">
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full text-sm',
          isMissed 
            ? 'bg-destructive/10 text-destructive' 
            : 'bg-muted text-muted-foreground'
        )}
      >
        <div className={cn(
          'flex items-center justify-center',
          isMissed ? 'text-destructive' : 'text-green-500'
        )}>
          {isVideo ? <Video className="h-4 w-4" /> : getIcon()}
        </div>
        <span>{getMessage()}</span>
        <span className="text-xs opacity-70">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
};
