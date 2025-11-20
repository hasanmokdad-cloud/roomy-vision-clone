// src/hooks/useRoleGuard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * useRoleGuard - Custom hook to restrict access based on user roles
 *
 * @param requiredRole - "admin" | "owner" | "student" (optional)
 * Redirects to "/auth" if not authenticated and "/unauthorized" if wrong role.
 * Returns { loading, role, userId } for in-component logic.
 */
export function useRoleGuard(requiredRole?: "admin" | "owner" | "student") {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const validateSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        navigate("/auth");
        return;
      }

      const user = session.user;
      setUserId(user.id);

      // Fetch user role from user_roles table
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const userRole = roles?.[0]?.role || null; // no default, must be explicitly set
      setRole(userRole);

      // Role-based redirection
      if (requiredRole && userRole !== requiredRole) {
        navigate("/unauthorized");
        return;
      }

      setLoading(false);
    };

    validateSession();
  }, [navigate, requiredRole]);

  return { loading, role, userId };
}
