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

      // Fetch user role_id from user_roles table
      const { data: userRoleRow } = await supabase
        .from("user_roles")
        .select("role_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!userRoleRow?.role_id) {
        navigate("/select-role");
        return;
      }

      // Resolve role name from roles table
      const { data: roleRecord } = await supabase
        .from("roles")
        .select("name")
        .eq("id", userRoleRow.role_id)
        .maybeSingle();

      const userRole = roleRecord?.name || null;
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
