import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

type OnboardingStep = 'none' | 'commitment' | 'notifications' | 'microphone' | 'complete';

interface OnboardingContextType {
  currentStep: OnboardingStep;
  setCurrentStep: (step: OnboardingStep) => void;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  isOnboardingComplete: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_KEY = 'roomy_onboarding_complete';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('none');
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true);

  // Check localStorage on mount
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    setIsOnboardingComplete(completed === 'true');
  }, []);

  const startOnboarding = () => {
    // Only start if not already complete
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (completed !== 'true') {
      setCurrentStep('commitment');
      setIsOnboardingComplete(false);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setCurrentStep('none');
    setIsOnboardingComplete(true);
  };

  // Reset onboarding for new signups - clears any previous state
  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setIsOnboardingComplete(false);
    setCurrentStep('none');
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        startOnboarding,
        completeOnboarding,
        resetOnboarding,
        isOnboardingComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
