import React from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react';
import { useCall } from '@/contexts/CallContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const CallControls: React.FC = () => {
  const { 
    callState, 
    toggleMute, 
    toggleVideo, 
    toggleSpeaker, 
    endCall 
  } = useCall();

  const isVideo = callState.callType === 'video';

  const ControlButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    variant?: 'default' | 'danger';
    children: React.ReactNode;
    label: string;
  }> = ({ onClick, isActive, variant = 'default', children, label }) => (
    <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center gap-1">
      <Button
        variant={variant === 'danger' ? 'destructive' : 'outline'}
        size="lg"
        className={cn(
          'h-14 w-14 rounded-full',
          variant === 'default' && isActive && 'bg-muted/80'
        )}
        onClick={onClick}
      >
        {children}
      </Button>
      <span className="text-xs text-muted-foreground">{label}</span>
    </motion.div>
  );

  return (
    <div className="bg-background/80 backdrop-blur-sm border-t border-border px-4 py-6 safe-area-bottom">
      <div className="flex items-center justify-center gap-6">
        {/* Mute */}
        <ControlButton
          onClick={toggleMute}
          isActive={callState.isMuted}
          label={callState.isMuted ? 'Unmute' : 'Mute'}
        >
          {callState.isMuted ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </ControlButton>

        {/* Video toggle (only for video calls) */}
        {isVideo && (
          <ControlButton
            onClick={toggleVideo}
            isActive={callState.isVideoOff}
            label={callState.isVideoOff ? 'Camera On' : 'Camera Off'}
          >
            {callState.isVideoOff ? (
              <VideoOff className="h-5 w-5" />
            ) : (
              <Video className="h-5 w-5" />
            )}
          </ControlButton>
        )}

        {/* Speaker */}
        <ControlButton
          onClick={toggleSpeaker}
          isActive={!callState.isSpeakerOn}
          label={callState.isSpeakerOn ? 'Speaker' : 'Earpiece'}
        >
          {callState.isSpeakerOn ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </ControlButton>

        {/* End call */}
        <ControlButton
          onClick={endCall}
          variant="danger"
          label="End"
        >
          <PhoneOff className="h-5 w-5" />
        </ControlButton>
      </div>
    </div>
  );
};
