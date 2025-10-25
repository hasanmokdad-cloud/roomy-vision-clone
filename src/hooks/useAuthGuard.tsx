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
        navigate('/auth');
        return;
      }
      
      setUserId(session.user.id);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  return { loading, userId };
};

export const useProfileCompletion = (userId: string | null) => {
  const navigate = useNavigate();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const checkProfile = async () => {
      const { data: profile } = await supabase
        .from('students')
        .select('university, budget, residential_area, room_type')
        .eq('user_id', userId)
        .maybeSingle();

      if (profile && (!profile.university || !profile.budget || !profile.residential_area || !profile.room_type)) {
        navigate('/profile');
        return;
      }

      setCheckingProfile(false);
    };

    checkProfile();
  }, [userId, navigate]);

  return { checkingProfile };
};
