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
  const { isAuthReady, isAuthenticated, role, userId } = useAuth();

  useEffect(() => {
    if (!isAuthReady) return;
    
    // Not authenticated - ProtectedRoute handles this
    if (!isAuthenticated || !userId) return;
    
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
      
      // Role mismatch check
      if (requiredRole && role !== requiredRole) {
        navigate("/unauthorized", { replace: true });
      }
    };

    checkSuspension();
  }, [isAuthReady, isAuthenticated, role, userId, requiredRole, navigate]);

  return {
    loading: !isAuthReady,
    role,
    userId,
  };
}
