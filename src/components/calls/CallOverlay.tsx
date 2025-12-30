import React from 'react';
import { useCall } from '@/contexts/CallContext';
import { IncomingCallModal } from './IncomingCallModal';
import { ActiveCallScreen } from './ActiveCallScreen';

export const CallOverlay: React.FC = () => {
  const { callState } = useCall();

  // Show incoming call modal when receiving a call
  if (callState.status === 'ringing' && callState.isIncoming) {
    return <IncomingCallModal />;
  }

  // Show active call screen when calling or connected
  if (callState.status === 'calling' || callState.status === 'connected') {
    return <ActiveCallScreen />;
  }

  return null;
};
