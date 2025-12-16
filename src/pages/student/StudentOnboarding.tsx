import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import MobileStudentWizard from '@/components/student/mobile/MobileStudentWizard';

const StudentOnboarding = () => {
  const navigate = useNavigate();
  const { user, role, isAuthReady } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthReady) return;

      // Must be authenticated student
      if (!user || role !== 'student') {
        navigate('/listings');
        return;
      }

      // Check if already completed onboarding
      const { data: student } = await supabase
        .from('students')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

      if (student?.onboarding_completed) {
        navigate('/listings');
      }
    };

    checkAccess();
  }, [user, role, isAuthReady, navigate]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Mobile always shows wizard
  if (isMobile) {
    return <MobileStudentWizard />;
  }

  // Desktop can also use wizard (or show different layout later)
  return <MobileStudentWizard />;
};

export default StudentOnboarding;
