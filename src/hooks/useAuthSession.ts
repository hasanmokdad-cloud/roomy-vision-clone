import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuthSession = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const isSigningOutRef = useRef(false);

  const refreshSession = async () => {
    // Don't refresh during sign-out
    if (isSigningOutRef.current || sessionStorage.getItem('roomy_signing_out') === 'true') {
      return { session: null, error: null };
    }
    
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
    
    // Check if we're in the middle of a sign-out
    const checkSigningOut = () => {
      return isSigningOutRef.current || sessionStorage.getItem('roomy_signing_out') === 'true';
    };
    
    // Use retry-first approach - wait briefly for Supabase hydration
    const checkSession = async () => {
      // Skip session check if signing out
      if (checkSigningOut()) {
        setIsAuthenticated(false);
        setUserId(null);
        return;
      }
      
      await new Promise(r => setTimeout(r, 100));
      
      // Double-check after delay
      if (!isMounted || checkSigningOut()) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!isMounted || checkSigningOut()) return;
      
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
    };

    checkSession();

    // Listen for auth state changes but block during sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Block ALL events during sign-out to prevent React Error #300
      if (!isMounted || checkSigningOut()) {
        return;
      }
      
      // Handle sign-out event
      if (event === 'SIGNED_OUT') {
        isSigningOutRef.current = true;
        setIsAuthenticated(false);
        setUserId(null);
        
        // Only show toast and navigate if not already handling sign-out elsewhere
        if (!sessionStorage.getItem('roomy_signing_out')) {
          toast({
            title: "Signed Out",
            description: "You have been signed out.",
          });
          navigate('/listings');
        }
        return;
      }
      
      // Update state for other events
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return { isAuthenticated, userId, refreshSession };
};
