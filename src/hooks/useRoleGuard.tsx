// src/hooks/useRoleGuard.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "owner" | "student";

/**
 * useRoleGuard - Simplified to use AuthContext instead of own retry logic
 * Handles role-based access control and suspension checks
 */
export function useRoleGuard(requiredRole?: AppRole) {
  const navigate = useNavigate();
  const { isAuthReady, isAuthenticated, role, userId, isSigningOut } = useAuth();

  useEffect(() => {
    // Don't do anything during sign-out
    if (isSigningOut) return;
    
    if (!isAuthReady) return;
    
    // Not authenticated - ProtectedRoute handles this
    if (!isAuthenticated || !userId) return;
    
    // Don't check role if it's still null (being fetched)
    // This prevents premature redirect to /unauthorized
    if (requiredRole && role === null) return;
    
    // Check suspension status for owners/students
    const checkSuspension = async () => {
      if (role === "owner" || role === "student") {
        const table = role === "owner" ? "owners" : "students";
        const { data: profileData } = await supabase
          .from(table)
          .select("status")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileData?.status === "suspended") {
          console.log(`⛔ useRoleGuard: ${role} account is suspended`);
          navigate("/account-suspended", { replace: true });
          return;
        }
      }
      
      // Role mismatch check - only if role is resolved
      if (requiredRole && role !== requiredRole) {
        navigate("/unauthorized", { replace: true });
      }
    };

    checkSuspension();
  }, [isAuthReady, isAuthenticated, role, userId, requiredRole, navigate, isSigningOut]);

  return {
    loading: !isAuthReady || (requiredRole && role === null),
    role,
    userId,
  };
}
