import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuthSession = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
      
      return { session, error: null };
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setIsAuthenticated(false);
      setUserId(null);
      return { session: null, error };
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Use retry-first approach - wait briefly for Supabase hydration
    const checkSession = async () => {
      await new Promise(r => setTimeout(r, 100));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!isMounted) return;
      
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
    };

    checkSession();

    // ONLY react to explicit SIGNED_OUT event - never check !session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
      
      if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed Out",
          description: "You have been signed out.",
        });
        navigate('/listings');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return { isAuthenticated, userId, refreshSession };
};
