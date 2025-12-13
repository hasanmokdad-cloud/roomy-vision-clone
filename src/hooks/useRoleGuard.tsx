// src/hooks/useRoleGuard.tsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "owner" | "student";

const SESSION_CACHE_KEY = 'roomy_session_last_refresh';
const REFRESH_THROTTLE_MS = 30000;
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * useRoleGuard - Uses retry-first getSession approach to avoid race conditions
 */
export function useRoleGuard(requiredRole?: AppRole) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (initRef.current) return;
    initRef.current = true;
    
    let isMounted = true;

    // Retry-first session detection with exponential backoff
    const getSessionWithRetry = async (): Promise<any> => {
      const maxRetries = 5;
      const delays = [50, 100, 200, 400, 800]; // Exponential backoff
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (!isMounted) return null;
        
        console.log(`🔄 useRoleGuard: Session attempt ${attempt + 1}/${maxRetries}`);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn(`⚠️ useRoleGuard: getSession error on attempt ${attempt + 1}:`, error.message);
        }
        
        if (session) {
          console.log(`✅ useRoleGuard: Session found on attempt ${attempt + 1}`);
          return session;
        }
        
        // Wait before next attempt (except on last attempt)
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, delays[attempt]));
        }
      }
      
      console.log("⚠️ useRoleGuard: No session after all retries");
      return null;
    };

    const validateRole = async (session: any) => {
      if (!isMounted || !session) return;
      
      const user = session.user;
      setUserId(user.id);
      
      console.log("✅ useRoleGuard: Validating role for user:", user.id);

      const defaultAdminEmails = ["hassan.mokdad01@lau.edu"];

      // Fetch role with retry
      let resolvedRole: AppRole | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (!isMounted) return;
        
        const { data, error } = await supabase.rpc('get_user_role', { 
          p_user_id: user.id 
        });

        if (!error && data) {
          resolvedRole = data as AppRole;
          console.log(`✅ useRoleGuard: Role resolved: ${resolvedRole}`);
          break;
        }
        
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
        }
      }

      // Fallback for admin emails
      if (!resolvedRole && defaultAdminEmails.includes(user.email ?? "")) {
        resolvedRole = "admin";
      }

      // Admin bypass - admins can never be suspended
      if (resolvedRole === "admin") {
        setRole("admin");
        setLoading(false);
        return;
      }

      // Check suspension status
      if (resolvedRole === "owner" || resolvedRole === "student") {
        const table = resolvedRole === "owner" ? "owners" : "students";
        const { data: profileData, error: profileError } = await supabase
          .from(table)
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!profileError && profileData?.status === "suspended") {
          console.log(`⛔ useRoleGuard: ${resolvedRole} account is suspended`);
          setRole(null);
          setUserId(null);
          setLoading(false);
          navigate("/account-suspended", { replace: true });
          return;
        }
      }

      if (!resolvedRole) {
        setRole(null);
        if (requiredRole) {
          navigate("/select-role", { replace: true });
        }
        setLoading(false);
        return;
      }

      setRole(resolvedRole);

      if (requiredRole && resolvedRole !== requiredRole) {
        navigate("/unauthorized", { replace: true });
        setLoading(false);
        return;
      }

      setLoading(false);
    };

    const initAuth = async () => {
      // Retry-first: Try to get session with exponential backoff
      const session = await getSessionWithRetry();
      
      if (!isMounted) return;
      
      if (session) {
        // Optionally refresh if expiring soon
        let finalSession = session;
        if (shouldRefreshSession() && isTokenExpiringSoon(session)) {
          try {
            const { data: refreshData } = await supabase.auth.refreshSession();
            if (refreshData?.session) {
              finalSession = refreshData.session;
              markSessionRefreshed();
            }
          } catch (e) {
            console.warn("⚠️ useRoleGuard: Refresh failed, using existing session");
          }
        }
        
        await validateRole(finalSession);
      } else {
        // No session found after retries - user is not logged in
        console.log("🔓 useRoleGuard: No authenticated session, setting loading false");
        setLoading(false);
      }
    };

    // Start auth initialization
    initAuth();

    // Set up listener ONLY for reactive updates (sign-in/sign-out while on page)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔄 useRoleGuard: Auth event:", event);
      
      if (event === 'SIGNED_OUT') {
        setRole(null);
        setUserId(null);
        setLoading(false);
        navigate('/listings', { replace: true });
        return;
      }
      
      // Handle sign-in that happens while already mounted
      if (event === 'SIGNED_IN' && session) {
        validateRole(session);
      }
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, requiredRole]);

  return { loading, role, userId };
}

function shouldRefreshSession(): boolean {
  try {
    const lastRefresh = localStorage.getItem(SESSION_CACHE_KEY);
    if (!lastRefresh) return true;
    return (Date.now() - parseInt(lastRefresh, 10)) > REFRESH_THROTTLE_MS;
  } catch {
    return true;
  }
}

function isTokenExpiringSoon(session: any): boolean {
  try {
    if (!session?.expires_at) return false;
    return (session.expires_at * 1000 - Date.now()) < TOKEN_EXPIRY_BUFFER_MS;
  } catch {
    return false;
  }
}

function markSessionRefreshed(): void {
  try {
    localStorage.setItem(SESSION_CACHE_KEY, Date.now().toString());
  } catch {}
}