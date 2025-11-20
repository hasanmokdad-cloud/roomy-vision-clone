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

      // Fetch role using join
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role_id, roles(name)")
        .eq("user_id", user.id)
        .maybeSingle();

      const role = roleRow?.roles?.name;

      if (!role && requiredRole) {
        navigate("/select-role");
        return;
      }

      if (!role) {
        setRole(null);
        setLoading(false);
        return;
      }
      
      setRole(role);

      // Role-based redirection
      if (requiredRole && role !== requiredRole) {
        navigate("/unauthorized");
        return;
      }

      setLoading(false);
    };

    validateSession();
  }, [navigate, requiredRole]);

  return { loading, role, userId };
}
