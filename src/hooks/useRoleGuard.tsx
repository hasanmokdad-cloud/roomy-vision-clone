// src/hooks/useRoleGuard.tsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "owner" | "student";

const SESSION_CACHE_KEY = 'roomy_session_last_refresh';
const REFRESH_THROTTLE_MS = 30000; // 30 seconds minimum between refreshes
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // Only refresh if expiring within 5 minutes

/**
 * useRoleGuard - Custom hook to restrict access based on user roles
 */
export function useRoleGuard(requiredRole?: AppRole) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const validationInProgress = useRef(false);

  useEffect(() => {
    // Prevent concurrent validations
    if (validationInProgress.current) return;
    
    // Safety timeout to prevent infinite loading (10 seconds max)
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ useRoleGuard: Safety timeout reached, forcing loading complete");
        setLoading(false);
      }
    }, 10000);
    
    const validateSession = async () => {
      validationInProgress.current = true;
      
      try {
        // First try getSession (faster, works for fresh logins)
        console.log("🔄 useRoleGuard: Getting session...");
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn("⚠️ useRoleGuard: getSession error:", sessionError.message);
        }
        
        let session = sessionData?.session;

        // Only refresh if we have a session AND it's appropriate to refresh
        if (session) {
          const shouldRefresh = shouldRefreshSession();
          const tokenExpiringSoon = isTokenExpiringSoon(session);
          
          if (shouldRefresh && tokenExpiringSoon) {
            console.log("🔄 useRoleGuard: Token expiring soon, attempting refresh...");
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshError) {
                // Handle rate limiting gracefully - don't redirect, just use existing session
                if (refreshError.message?.includes('429') || refreshError.status === 429) {
                  console.warn("⚠️ useRoleGuard: Rate limited, using existing session");
                } else {
                  console.warn("⚠️ useRoleGuard: Session refresh failed:", refreshError.message);
                }
              } else if (refreshData?.session) {
                session = refreshData.session;
                markSessionRefreshed();
              }
            } catch (refreshErr: any) {
              // Catch any refresh errors and continue with existing session
              console.warn("⚠️ useRoleGuard: Refresh exception:", refreshErr?.message);
            }
          }
        }

        if (!session) {
          console.log("❌ useRoleGuard: No session found, redirecting to auth");
          setRole(null);
          setUserId(null);
          setLoading(false);
          navigate("/auth", { replace: true });
          return;
        }

        console.log("✅ useRoleGuard: Session active, email_confirmed_at:", session.user.email_confirmed_at);
        
        const user = session.user;
        setUserId(user.id);

        const defaultAdminEmails = [
          "hassan.mokdad01@lau.edu",
        ];

        // Try to read role with retry logic
        let resolvedRole: AppRole | null = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (!resolvedRole && attempts < maxAttempts) {
          attempts++;
          console.log(`🔄 useRoleGuard: Attempt ${attempts}/${maxAttempts} to fetch role for user ${user.id}`);
          
          const { data, error } = await supabase.rpc('get_user_role', { 
            p_user_id: user.id 
          });

          if (error) {
            console.error(`❌ useRoleGuard: get_user_role RPC failed:`, error);
          } else {
            resolvedRole = data as AppRole | null;
            console.log(`✅ useRoleGuard: Role found on attempt ${attempts}:`, resolvedRole);
          }

          if (!resolvedRole && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 200 * attempts));
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

        // Check suspension status for owners and students
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
      } finally {
        validationInProgress.current = false;
        clearTimeout(safetyTimeout);
      }
    };

    void validateSession();
    
    return () => clearTimeout(safetyTimeout);
  }, [navigate, requiredRole]);

  return { loading, role, userId };
}

// Helper: Check if we should attempt a refresh (throttling)
function shouldRefreshSession(): boolean {
  try {
    const lastRefresh = localStorage.getItem(SESSION_CACHE_KEY);
    if (!lastRefresh) return true;
    
    const now = Date.now();
    const lastRefreshTime = parseInt(lastRefresh, 10);
    return (now - lastRefreshTime) > REFRESH_THROTTLE_MS;
  } catch {
    return true;
  }
}

// Helper: Check if token is expiring soon
function isTokenExpiringSoon(session: any): boolean {
  try {
    if (!session?.expires_at) return false;
    const expiresAt = session.expires_at * 1000; // Convert to ms
    const now = Date.now();
    return (expiresAt - now) < TOKEN_EXPIRY_BUFFER_MS;
  } catch {
    return false;
  }
}

// Helper: Mark that we just refreshed
function markSessionRefreshed(): void {
  try {
    localStorage.setItem(SESSION_CACHE_KEY, Date.now().toString());
  } catch {
    // Ignore localStorage errors
  }
}
