import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type CallType = 'voice' | 'video';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface CallState {
  callId: string | null;
  conversationId: string | null;
  callType: CallType | null;
  status: CallStatus;
  isIncoming: boolean;
  remotePeerId: string | null;
  remotePeerName: string | null;
  remotePeerAvatar: string | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  startTime: Date | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-end' | 'call-decline';
  from: string;
  to: string;
  callId: string;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
}

interface CallContextType {
  callState: CallState;
  initiateCall: (params: {
    conversationId: string;
    receiverId: string;
    receiverName: string;
    receiverAvatar?: string;
    callType: CallType;
  }) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
}

const initialCallState: CallState = {
  callId: null,
  conversationId: null,
  callType: null,
  status: 'idle',
  isIncoming: false,
  remotePeerId: null,
  remotePeerName: null,
  remotePeerAvatar: null,
  isMuted: false,
  isVideoOff: false,
  isSpeakerOn: true,
  startTime: null,
  localStream: null,
  remoteStream: null,
};

const CallContext = createContext<CallContextType | undefined>(undefined);

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>(initialCallState);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current = null;
    }

    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (signalingChannelRef.current) {
      supabase.removeChannel(signalingChannelRef.current);
      signalingChannelRef.current = null;
    }

    iceCandidatesQueue.current = [];
    setCallState(initialCallState);
  }, [callState.localStream]);

  // Setup signaling channel
  const setupSignalingChannel = useCallback((conversationId: string) => {
    if (signalingChannelRef.current) {
      supabase.removeChannel(signalingChannelRef.current);
    }

    const channel = supabase.channel(`call-signaling-${conversationId}`);
    
    channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      const message = payload as SignalingMessage;
      
      if (!user || message.to !== user.id) return;

      console.log('Received signaling message:', message.type);

      switch (message.type) {
        case 'offer':
          // Incoming call
          setCallState(prev => ({
            ...prev,
            callId: message.callId,
            conversationId,
            status: 'ringing',
            isIncoming: true,
            remotePeerId: message.from,
          }));
          
          // Store the offer to use when accepting
          if (peerConnectionRef.current && message.payload) {
            try {
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(message.payload as RTCSessionDescriptionInit)
              );
              
              // Process queued ICE candidates
              for (const candidate of iceCandidatesQueue.current) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              }
              iceCandidatesQueue.current = [];
            } catch (err) {
              console.error('Error setting remote description:', err);
            }
          }
          break;

        case 'answer':
          if (peerConnectionRef.current && message.payload) {
            try {
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(message.payload as RTCSessionDescriptionInit)
              );
              
              setCallState(prev => ({
                ...prev,
                status: 'connected',
                startTime: new Date(),
              }));

              // Process queued ICE candidates
              for (const candidate of iceCandidatesQueue.current) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              }
              iceCandidatesQueue.current = [];
            } catch (err) {
              console.error('Error setting remote description:', err);
            }
          }
          break;

        case 'ice-candidate':
          if (message.payload) {
            if (peerConnectionRef.current?.remoteDescription) {
              try {
                await peerConnectionRef.current.addIceCandidate(
                  new RTCIceCandidate(message.payload as RTCIceCandidateInit)
                );
              } catch (err) {
                console.error('Error adding ICE candidate:', err);
              }
            } else {
              iceCandidatesQueue.current.push(message.payload as RTCIceCandidateInit);
            }
          }
          break;

        case 'call-end':
        case 'call-decline':
          toast.info(message.type === 'call-decline' ? 'Call declined' : 'Call ended');
          cleanup();
          break;
      }
    });

    channel.subscribe();
    signalingChannelRef.current = channel;
  }, [user, cleanup]);

  // Send signaling message
  const sendSignal = useCallback((message: Omit<SignalingMessage, 'from'>) => {
    if (!signalingChannelRef.current || !user) return;

    signalingChannelRef.current.send({
      type: 'broadcast',
      event: 'signal',
      payload: { ...message, from: user.id },
    });
  }, [user]);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && callState.remotePeerId && callState.callId) {
        sendSignal({
          type: 'ice-candidate',
          to: callState.remotePeerId,
          callId: callState.callId,
          payload: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track');
      setCallState(prev => ({
        ...prev,
        remoteStream: event.streams[0],
      }));
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected') {
        setCallState(prev => ({
          ...prev,
          status: 'connected',
          startTime: prev.startTime || new Date(),
        }));
      } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        cleanup();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [callState.remotePeerId, callState.callId, sendSignal, cleanup]);

  // Get user media
  const getLocalStream = useCallback(async (callType: CallType): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: callType === 'video' ? { facingMode: 'user' } : false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCallState(prev => ({ ...prev, localStream: stream }));
      return stream;
    } catch (err) {
      console.error('Error getting user media:', err);
      toast.error('Could not access microphone/camera');
      throw err;
    }
  }, []);

  // Initiate a call
  const initiateCall = useCallback(async ({
    conversationId,
    receiverId,
    receiverName,
    receiverAvatar,
    callType,
  }: {
    conversationId: string;
    receiverId: string;
    receiverName: string;
    receiverAvatar?: string;
    callType: CallType;
  }) => {
    if (!user) return;

    try {
      // Create call record
      const { data: callData, error: callError } = await supabase
        .from('calls')
        .insert({
          conversation_id: conversationId,
          caller_id: user.id,
          receiver_id: receiverId,
          call_type: callType,
          status: 'ringing',
        })
        .select()
        .single();

      if (callError) throw callError;

      // Setup signaling
      setupSignalingChannel(conversationId);

      // Get local media
      const localStream = await getLocalStream(callType);

      // Create peer connection
      const pc = createPeerConnection();
      
      // Add tracks to peer connection
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setCallState({
        callId: callData.id,
        conversationId,
        callType,
        status: 'calling',
        isIncoming: false,
        remotePeerId: receiverId,
        remotePeerName: receiverName,
        remotePeerAvatar: receiverAvatar || null,
        isMuted: false,
        isVideoOff: false,
        isSpeakerOn: true,
        startTime: null,
        localStream,
        remoteStream: null,
      });

      // Send offer after a short delay to ensure channel is ready
      setTimeout(() => {
        sendSignal({
          type: 'offer',
          to: receiverId,
          callId: callData.id,
          payload: offer,
        });
      }, 500);

      // Set timeout for no answer
      callTimeoutRef.current = setTimeout(() => {
        toast.info('No answer');
        endCall();
      }, 30000);

    } catch (err) {
      console.error('Error initiating call:', err);
      toast.error('Failed to start call');
      cleanup();
    }
  }, [user, setupSignalingChannel, getLocalStream, createPeerConnection, sendSignal, cleanup]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!callState.callId || !callState.conversationId || !callState.remotePeerId) return;

    try {
      // Update call status in database
      await supabase
        .from('calls')
        .update({ status: 'connected', started_at: new Date().toISOString() })
        .eq('id', callState.callId);

      // Get call details to determine type
      const { data: callData } = await supabase
        .from('calls')
        .select('call_type')
        .eq('id', callState.callId)
        .single();

      const callType = (callData?.call_type as CallType) || 'voice';

      // Setup signaling if not already done
      if (!signalingChannelRef.current) {
        setupSignalingChannel(callState.conversationId);
      }

      // Get local media
      const localStream = await getLocalStream(callType);

      // Create peer connection if not exists
      if (!peerConnectionRef.current) {
        createPeerConnection();
      }

      const pc = peerConnectionRef.current!;

      // Add tracks
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal({
        type: 'answer',
        to: callState.remotePeerId,
        callId: callState.callId,
        payload: answer,
      });

      setCallState(prev => ({
        ...prev,
        callType,
        status: 'connected',
        startTime: new Date(),
        localStream,
      }));

    } catch (err) {
      console.error('Error accepting call:', err);
      toast.error('Failed to accept call');
      cleanup();
    }
  }, [callState, setupSignalingChannel, getLocalStream, createPeerConnection, sendSignal, cleanup]);

  // Decline call
  const declineCall = useCallback(() => {
    if (callState.callId && callState.remotePeerId) {
      // Update call status
      supabase
        .from('calls')
        .update({ status: 'declined', ended_at: new Date().toISOString() })
        .eq('id', callState.callId);

      sendSignal({
        type: 'call-decline',
        to: callState.remotePeerId,
        callId: callState.callId,
        payload: null,
      });
    }
    cleanup();
  }, [callState.callId, callState.remotePeerId, sendSignal, cleanup]);

  // End call
  const endCall = useCallback(() => {
    if (callState.callId && callState.remotePeerId) {
      const duration = callState.startTime
        ? Math.floor((Date.now() - callState.startTime.getTime()) / 1000)
        : 0;

      // Update call record
      supabase
        .from('calls')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          duration_seconds: duration,
          ended_by: user?.id,
        })
        .eq('id', callState.callId);

      sendSignal({
        type: 'call-end',
        to: callState.remotePeerId,
        callId: callState.callId,
        payload: null,
      });
    }
    cleanup();
  }, [callState, user, sendSignal, cleanup]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  }, [callState.localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (callState.localStream) {
      const videoTrack = callState.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }));
      }
    }
  }, [callState.localStream]);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    setCallState(prev => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }));
    // Note: Actual speaker routing requires audio element sinkId API
  }, []);

  // Listen for incoming calls
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('incoming-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const call = payload.new as any;
          
          if (call.status === 'ringing' && callState.status === 'idle') {
            // Fetch caller info
            const { data: callerData } = await supabase
              .from('students')
              .select('full_name, profile_photo_url')
              .eq('user_id', call.caller_id)
              .single();

            setupSignalingChannel(call.conversation_id);
            createPeerConnection();

            setCallState({
              callId: call.id,
              conversationId: call.conversation_id,
              callType: call.call_type,
              status: 'ringing',
              isIncoming: true,
              remotePeerId: call.caller_id,
              remotePeerName: callerData?.full_name || 'Unknown',
              remotePeerAvatar: callerData?.profile_photo_url || null,
              isMuted: false,
              isVideoOff: false,
              isSpeakerOn: true,
              startTime: null,
              localStream: null,
              remoteStream: null,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, callState.status, setupSignalingChannel, createPeerConnection]);

  return (
    <CallContext.Provider
      value={{
        callState,
        initiateCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleSpeaker,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
