import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  const { user, role, isAuthReady } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isAuthReady) return;
      
      // Skip for non-students or non-authenticated users
      if (!user || role !== 'student') {
        setIsChecking(false);
        setNeedsOnboarding(false);
        return;
      }

      try {
        const { data: student } = await supabase
          .from('students')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();

        // If no student record or onboarding not completed, needs onboarding
        setNeedsOnboarding(!student?.onboarding_completed);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setNeedsOnboarding(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [user, role, isAuthReady]);

  // Still checking auth or onboarding status
  if (!isAuthReady || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Skip guard for onboarding page itself
  if (location.pathname === '/onboarding/student') {
    return <>{children}</>;
  }

  // Redirect to onboarding if needed
  if (needsOnboarding && role === 'student') {
    return <Navigate to="/onboarding/student" replace />;
  }

  return <>{children}</>;
};

export default OnboardingGuard;
