import { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { CommunityCommitmentDrawer } from './CommunityCommitmentDrawer';
import { DeclineConfirmDrawer } from './DeclineConfirmDrawer';
import { NotificationPermissionDrawer } from './NotificationPermissionDrawer';
import { MicrophonePermissionDrawer } from './MicrophonePermissionDrawer';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export function OnboardingFlow() {
  const { currentStep, setCurrentStep, completeOnboarding } = useOnboarding();
  const { userId } = useAuth();
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

  const handleCommitmentAccept = () => {
    setCurrentStep('notifications');
  };

  const handleCommitmentDecline = () => {
    setShowDeclineConfirm(true);
  };

  const handleGoBack = () => {
    setShowDeclineConfirm(false);
  };

  const handleCancelSignup = async () => {
    // Sign out the user since they declined the commitment
    await supabase.auth.signOut();
    setShowDeclineConfirm(false);
    setCurrentStep('none');
    // Redirect will happen via auth state change
    window.location.href = '/listings';
  };

  const handleNotificationAllow = () => {
    setCurrentStep('microphone');
  };

  const handleNotificationSkip = () => {
    setCurrentStep('microphone');
  };

  const handleMicrophoneAllow = () => {
    completeOnboarding();
  };

  const handleMicrophoneSkip = () => {
    completeOnboarding();
  };

  return (
    <>
      {/* Community Commitment Drawer */}
      <CommunityCommitmentDrawer
        open={currentStep === 'commitment' && !showDeclineConfirm}
        onAccept={handleCommitmentAccept}
        onDecline={handleCommitmentDecline}
      />

      {/* Decline Confirmation Drawer */}
      <DeclineConfirmDrawer
        open={showDeclineConfirm}
        onGoBack={handleGoBack}
        onCancelSignup={handleCancelSignup}
      />

      {/* Notification Permission Drawer */}
      <NotificationPermissionDrawer
        open={currentStep === 'notifications'}
        onAllow={handleNotificationAllow}
        onSkip={handleNotificationSkip}
      />

      {/* Microphone Permission Drawer */}
      <MicrophonePermissionDrawer
        open={currentStep === 'microphone'}
        onAllow={handleMicrophoneAllow}
        onSkip={handleMicrophoneSkip}
      />
    </>
  );
}
