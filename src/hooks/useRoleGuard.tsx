// src/hooks/useRoleGuard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "owner" | "student";

/**
 * useRoleGuard - Custom hook to restrict access based on user roles
 *
 * @param requiredRole - "admin" | "owner" | "student" (optional)
 * Redirects to "/auth" if not authenticated and "/unauthorized" if wrong role.
 * Returns { loading, role, userId } for in-component logic.
 */
export function useRoleGuard(requiredRole?: AppRole) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const validateSession = async () => {
      setLoading(true);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        navigate("/auth", { replace: true });
        return;
      }

      const user = session.user;
      setUserId(user.id);

      // 1) Get role_id from user_roles
      const { data: userRoleRow, error: userRoleError } = await supabase
        .from("user_roles")
        .select("role_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (userRoleError) {
        console.error("Error fetching user_roles:", userRoleError);
      }

      if (!userRoleRow?.role_id) {
        // No role yet → force role selection
        setRole(null);
        setLoading(false);
        if (requiredRole) {
          navigate("/select-role", { replace: true });
        }
        return;
      }

      // 2) Resolve role name from roles table
      const { data: roleRecord, error: roleError } = await supabase
        .from("roles")
        .select("name")
        .eq("id", userRoleRow.role_id)
        .maybeSingle();

      if (roleError) {
        console.error("Error fetching role name:", roleError);
      }

      const userRole = (roleRecord?.name || null) as AppRole | null;
      setRole(userRole);

      if (requiredRole && userRole !== requiredRole) {
        navigate("/unauthorized", { replace: true });
        setLoading(false);
        return;
      }

      setLoading(false);
    };

    void validateSession();
  }, [navigate, requiredRole]);

  return { loading, role, userId };
}
