import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'owner' | 'student' | null;

interface AuthContextValue {
  isAuthReady: boolean;
  isRoleReady: boolean;
  isEmailVerificationReady: boolean;
  session: Session | null;
  user: User | null;
  role: AppRole;
  userId: string | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean | null;
  hasPendingVerification: boolean;
  isSigningOut: boolean;
  signOut: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  refreshAuth: () => Promise<void>;
  refreshEmailVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isRoleReady, setIsRoleReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null);
  const [isEmailVerificationReady, setIsEmailVerificationReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const initRef = useRef(false);
  const isSigningOutRef = useRef(false);
  const lastHandledUserRef = useRef<string | null>(null);

  // Check custom email verification status via Roomy token system
  const checkEmailVerification = useCallback(async (userEmail: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-email-verified', {
        body: { email: userEmail }
      });
      if (error) {
        console.warn('Email verification check failed:', error);
        return false;
      }
      return data?.verified === true;
    } catch (err) {
      console.warn('Email verification check error:', err);
      return false;
    }
  }, []);

  const fetchRole = useCallback(async (userId: string, retryCount = 0): Promise<AppRole> => {
    try {
      const { data, error } = await supabase.rpc('get_user_role', { p_user_id: userId });
      if (error) {
        console.warn('Failed to fetch role:', error);
        return null;
      }
      
      // If null and user is authenticated, retry (role might still be getting created)
      if (!data && retryCount < 2) {
        console.log('🔄 AuthContext: Role is null, retrying in 500ms...');
        await new Promise(r => setTimeout(r, 500));
        return fetchRole(userId, retryCount + 1);
      }
      
      return data as AppRole;
    } catch (err) {
      console.warn('Error fetching role:', err);
      return null;
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    if (initRef.current) return;
    initRef.current = true;

    console.log('🔐 AuthContext: Initializing...');

    // Check if we were signing out before page reload
    const wasSigningOut = sessionStorage.getItem('roomy_signing_out') === 'true';
    
    if (wasSigningOut) {
      console.log('🚪 AuthContext: Completing sign-out from previous page...');
      sessionStorage.removeItem('roomy_signing_out');
      
      // Session already cleared before redirect - no need to call signOut again
      // Just set auth ready with no user
      setSession(null);
      setUser(null);
      setRole(null);
      setIsAuthReady(true);
      setIsRoleReady(true);
      console.log('✅ AuthContext: Sign-out completed, auth ready');
      return;
    }

    try {
      // Wait 100ms for Supabase to hydrate session from localStorage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get session with retry
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      // Handle corrupted session errors (e.g., "Refresh Token Not Found")
      if (error) {
        console.warn('AuthContext: getSession error:', error);
        
        // Check for corrupted token errors
        const errorMessage = error.message?.toLowerCase() || '';
        if (errorMessage.includes('refresh token') || errorMessage.includes('invalid') || errorMessage.includes('not found')) {
          console.log('🔧 AuthContext: Detected corrupted session, clearing...');
          try {
            await supabase.auth.signOut({ scope: 'local' });
          } catch (signOutErr) {
            console.warn('AuthContext: Error during cleanup signOut:', signOutErr);
          }
          // Clear any stale flags
          sessionStorage.removeItem('roomy_signing_out');
          setSession(null);
          setUser(null);
          setRole(null);
          setIsRoleReady(true);
          setIsAuthReady(true);
          console.log('✅ AuthContext: Corrupted session cleared, ready');
          return;
        }
      }

      if (currentSession?.user) {
        console.log('✅ AuthContext: Session found for', currentSession.user.email);
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Fetch role
        const userRole = await fetchRole(currentSession.user.id);
        setRole(userRole);
        setIsRoleReady(true);
        console.log('✅ AuthContext: Role resolved:', userRole);
        
        // Check custom email verification
        const verified = await checkEmailVerification(currentSession.user.email || '');
        setIsEmailVerified(verified);
        setIsEmailVerificationReady(true);
        console.log('✅ AuthContext: Email verified:', verified);
      } else {
        console.log('🔓 AuthContext: No session found');
        setSession(null);
        setUser(null);
        setRole(null);
        setIsEmailVerified(null);
        setIsEmailVerificationReady(true);
        setIsRoleReady(true);
      }
    } catch (err) {
      console.error('AuthContext: Init error:', err);
      
      // On any unexpected error, try to clear corrupted state
      try {
        await supabase.auth.signOut({ scope: 'local' });
        sessionStorage.removeItem('roomy_signing_out');
      } catch (cleanupErr) {
        console.warn('AuthContext: Cleanup error:', cleanupErr);
      }
      
      setSession(null);
      setUser(null);
      setRole(null);
      setIsRoleReady(true);
    } finally {
      setIsAuthReady(true);
      console.log('✅ AuthContext: Ready');
    }
  }, [fetchRole]);

  useEffect(() => {
    initializeAuth();

    // Listen ONLY for real auth events (not INITIAL_SESSION)
    // CRITICAL: Do NOT use async callback - causes Chrome "message channel closed" error
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Block ALL events during sign-out (check both ref and sessionStorage)
      if (isSigningOutRef.current || sessionStorage.getItem('roomy_signing_out') === 'true') {
        console.log('🔄 AuthContext: Ignoring event during sign-out:', event);
        return;
      }

      console.log('🔄 AuthContext: Auth event:', event);

      // Ignore INITIAL_SESSION - we handle it in initializeAuth
      if (event === 'INITIAL_SESSION') {
        return;
      }

      if (event === 'SIGNED_OUT') {
        console.log('👋 AuthContext: User signed out');
        setSession(null);
        setUser(null);
        setRole(null);
        setIsEmailVerified(null);
        return;
      }

      if (event === 'SIGNED_IN' && newSession?.user) {
        // Skip duplicate SIGNED_IN events for the same user
        if (lastHandledUserRef.current === newSession.user.id) {
          console.log('🔄 AuthContext: Skipping duplicate SIGNED_IN for same user');
          return;
        }
        lastHandledUserRef.current = newSession.user.id;
        
        console.log('👤 AuthContext: User signed in');
        setSession(newSession);
        setUser(newSession.user);
        setIsRoleReady(false); // Reset while fetching
        setIsEmailVerificationReady(false); // Reset while checking
        
        // Defer async fetchRole with setTimeout(0) to avoid async callback issues
        setTimeout(async () => {
          const userRole = await fetchRole(newSession.user.id);
          setRole(userRole);
          setIsRoleReady(true);
          
          // Check email verification
          const verified = await checkEmailVerification(newSession.user.email || '');
          setIsEmailVerified(verified);
          setIsEmailVerificationReady(true);
        }, 0);
      }

      if (event === 'TOKEN_REFRESHED' && newSession) {
        console.log('🔄 AuthContext: Token refreshed');
        setSession(newSession);
        setUser(newSession.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeAuth, fetchRole, checkEmailVerification]);

  const signOut = useCallback(async () => {
    console.log('🚪 AuthContext: Signing out...');
    
    // SET FLAG IN SESSION STORAGE - persists across page reload
    sessionStorage.setItem('roomy_signing_out', 'true');
    isSigningOutRef.current = true;
    setIsSigningOut(true);
    
    // Close auth modal
    setAuthModalOpen(false);
    
    // Clear state immediately
    setSession(null);
    setUser(null);
    setRole(null);
    
    // MUST await signOut FIRST to clear session from localStorage
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    
    // THEN redirect after session is cleared
    window.location.href = '/listings';
  }, []);

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const refreshAuth = useCallback(async () => {
    if (!session?.user) return;
    
    const userRole = await fetchRole(session.user.id);
    setRole(userRole);
  }, [session, fetchRole]);

  const refreshEmailVerification = useCallback(async () => {
    if (!user?.email) return;
    const verified = await checkEmailVerification(user.email);
    setIsEmailVerified(verified);
  }, [user, checkEmailVerification]);

  const value: AuthContextValue = {
    isAuthReady,
    isRoleReady,
    isEmailVerificationReady,
    session,
    user,
    role,
    userId: user?.id || null,
    isAuthenticated: !!user && isEmailVerified === true,
    isEmailVerified,
    hasPendingVerification: !!user && isEmailVerified === false,
    isSigningOut,
    signOut,
    openAuthModal,
    closeAuthModal,
    authModalOpen,
    refreshAuth,
    refreshEmailVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
