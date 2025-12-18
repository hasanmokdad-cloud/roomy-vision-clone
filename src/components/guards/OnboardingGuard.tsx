interface OnboardingGuardProps {
  children: React.ReactNode;
}

// Onboarding is now accessed via "Get Started" button on Profile page
// This guard simply passes through without redirecting
const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  return <>{children}</>;
};

export default OnboardingGuard;
