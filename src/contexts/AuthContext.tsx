import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'owner' | 'student' | null;

interface AuthContextValue {
  isAuthReady: boolean;
  session: Session | null;
  user: User | null;
  role: AppRole;
  userId: string | null;
  isAuthenticated: boolean;
  isSigningOut: boolean;
  signOut: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const initRef = useRef(false);
  const isSigningOutRef = useRef(false);

  const fetchRole = useCallback(async (userId: string): Promise<AppRole> => {
    try {
      const { data, error } = await supabase.rpc('get_user_role', { p_user_id: userId });
      if (error) {
        console.warn('Failed to fetch role:', error);
        return null;
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
      
      // Force clear any lingering session
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // Ignore errors
      }
      
      // Set auth ready with no user
      setSession(null);
      setUser(null);
      setRole(null);
      setIsAuthReady(true);
      console.log('✅ AuthContext: Sign-out completed, auth ready');
      return;
    }

    try {
      // Wait 100ms for Supabase to hydrate session from localStorage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get session with retry
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('AuthContext: getSession error:', error);
      }

      if (currentSession?.user) {
        console.log('✅ AuthContext: Session found for', currentSession.user.email);
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Fetch role
        const userRole = await fetchRole(currentSession.user.id);
        setRole(userRole);
        console.log('✅ AuthContext: Role resolved:', userRole);
      } else {
        console.log('🔓 AuthContext: No session found');
        setSession(null);
        setUser(null);
        setRole(null);
      }
    } catch (err) {
      console.error('AuthContext: Init error:', err);
    } finally {
      setIsAuthReady(true);
      console.log('✅ AuthContext: Ready');
    }
  }, [fetchRole]);

  useEffect(() => {
    initializeAuth();

    // Listen ONLY for real auth events (not INITIAL_SESSION)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
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
        return;
      }

      if (event === 'SIGNED_IN' && newSession?.user) {
        console.log('👤 AuthContext: User signed in');
        setSession(newSession);
        setUser(newSession.user);
        
        const userRole = await fetchRole(newSession.user.id);
        setRole(userRole);
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
  }, [initializeAuth, fetchRole]);

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

  const value: AuthContextValue = {
    isAuthReady,
    session,
    user,
    role,
    userId: user?.id || null,
    isAuthenticated: !!user,
    isSigningOut,
    signOut,
    openAuthModal,
    closeAuthModal,
    authModalOpen,
    refreshAuth,
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
