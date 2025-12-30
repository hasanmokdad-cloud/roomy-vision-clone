import React, { useEffect, useRef, useState } from 'react';
import { useCall } from '@/contexts/CallContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CallControls } from './CallControls';
import { motion, AnimatePresence } from 'framer-motion';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const ActiveCallScreen: React.FC = () => {
  const { callState } = useCall();
  const [duration, setDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const isConnected = callState.status === 'connected';
  const isVideo = callState.callType === 'video';

  // Update duration timer
  useEffect(() => {
    if (!callState.startTime || callState.status !== 'connected') return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callState.startTime!.getTime()) / 1000);
      setDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState.startTime, callState.status]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState.remoteStream]);

  if (callState.status !== 'calling' && callState.status !== 'connected') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-background"
      >
        {/* Main content area */}
        <div className="flex-1 relative overflow-hidden">
          {isVideo && callState.remoteStream ? (
            // Video call - show remote video full screen
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Local video preview */}
              {callState.localStream && !callState.isVideoOff && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-32 h-44 rounded-xl overflow-hidden shadow-lg border-2 border-border"
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                </motion.div>
              )}
            </>
          ) : (
            // Voice call or video off - show avatar
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <motion.div
                animate={isConnected ? {} : { scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Avatar className="h-40 w-40 ring-4 ring-primary/30">
                  <AvatarImage src={callState.remotePeerAvatar || undefined} />
                  <AvatarFallback className="text-5xl bg-primary/20">
                    {callState.remotePeerName?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">
                  {callState.remotePeerName}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {isConnected ? formatDuration(duration) : 'Calling...'}
                </p>
              </div>

              {/* Audio visualizer placeholder for voice calls */}
              {isConnected && !isVideo && (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-primary rounded-full"
                      animate={{
                        height: [16, 32, 16],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Overlay for video calls showing status */}
          {isVideo && callState.remoteStream && (
            <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-1">
              <p className="text-white text-sm">
                {isConnected ? formatDuration(duration) : 'Connecting...'}
              </p>
            </div>
          )}
        </div>

        {/* Call controls */}
        <CallControls />
      </motion.div>
    </AnimatePresence>
  );
};
