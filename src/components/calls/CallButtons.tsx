import React from 'react';
import { Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCall } from '@/contexts/CallContext';
import { cn } from '@/lib/utils';

interface CallButtonsProps {
  conversationId: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  disabled?: boolean;
  className?: string;
}

export const CallButtons: React.FC<CallButtonsProps> = ({
  conversationId,
  receiverId,
  receiverName,
  receiverAvatar,
  disabled,
  className,
}) => {
  const { callState, initiateCall } = useCall();
  
  const isInCall = callState.status !== 'idle';

  const handleVoiceCall = () => {
    if (isInCall || disabled) return;
    initiateCall({
      conversationId,
      receiverId,
      receiverName,
      receiverAvatar,
      callType: 'voice',
    });
  };

  const handleVideoCall = () => {
    if (isInCall || disabled) return;
    initiateCall({
      conversationId,
      receiverId,
      receiverName,
      receiverAvatar,
      callType: 'video',
    });
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleVoiceCall}
        disabled={isInCall || disabled}
        className="h-9 w-9"
      >
        <Phone className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleVideoCall}
        disabled={isInCall || disabled}
        className="h-9 w-9"
      >
        <Video className="h-5 w-5" />
      </Button>
    </div>
  );
};
