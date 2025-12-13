import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const useAuthGuard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/listings');
        return;
      }
      
      setUserId(session.user.id);
      setLoading(false);
    };

    checkAuth();

    // Listen for sign-out and redirect to /listings
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/listings');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return { loading, userId };
};

export const useProfileCompletion = (userId: string | null) => {
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    if (!userId) {
      setCheckingProfile(false);
      return;
    }

    const checkProfile = async () => {
      const { data: profile } = await supabase
        .from('students')
        .select('university, budget, residential_area, room_type')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profile) {
        setIsProfileComplete(false);
        setCompletionPercentage(0);
        setCheckingProfile(false);
        return;
      }

      const fields = [profile.university, profile.budget, profile.residential_area, profile.room_type];
      const filledFields = fields.filter(Boolean).length;
      const percentage = (filledFields / fields.length) * 100;

      setIsProfileComplete(percentage === 100);
      setCompletionPercentage(percentage);
      setCheckingProfile(false);
    };

    checkProfile();
  }, [userId]);

  return { checkingProfile, isProfileComplete, completionPercentage };
};
