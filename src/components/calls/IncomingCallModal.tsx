import React from 'react';
import { Phone, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export const IncomingCallModal: React.FC = () => {
  const { callState, acceptCall, declineCall } = useCall();

  if (callState.status !== 'ringing' || !callState.isIncoming) {
    return null;
  }

  const isVideo = callState.callType === 'video';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md"
      >
        <div className="flex flex-col items-center gap-8 p-8">
          {/* Caller Avatar with Pulse Animation */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            <Avatar className="h-32 w-32 ring-4 ring-primary/50">
              <AvatarImage src={callState.remotePeerAvatar || undefined} />
              <AvatarFallback className="text-3xl bg-primary/20">
                {callState.remotePeerName?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          {/* Caller Info */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">
              {callState.remotePeerName}
            </h2>
            <p className="text-muted-foreground mt-1 flex items-center justify-center gap-2">
              {isVideo ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
              Incoming {isVideo ? 'video' : 'voice'} call...
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-8">
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="destructive"
                size="lg"
                className="h-16 w-16 rounded-full"
                onClick={declineCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-2">Decline</p>
            </motion.div>

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                size="lg"
                className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700"
                onClick={acceptCall}
              >
                {isVideo ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-2">Accept</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
