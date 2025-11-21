// src/hooks/useRoleGuard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "owner" | "student";

/**
 * useRoleGuard - Custom hook to restrict access based on user roles
 *
 * @param requiredRole - "admin" | "owner" | "student" (optional)
 * Redirects to "/auth" if not authenticated and "/unauthorized" if wrong role.
 * Returns { loading, role, userId } for in-component logic.
 *
 * Special case: if there is no user_roles row yet BUT the email matches one of
 * the founder/admin emails, treat that user as "admin" so they can always
 * reach the admin dashboard.
 */
export function useRoleGuard(requiredRole?: AppRole) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const validateSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        setRole(null);
        setUserId(null);
        setLoading(false);
        navigate("/auth", { replace: true });
        return;
      }

      const user = session.user;
      setUserId(user.id);

      // Try to read role from user_roles joined with roles
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id)
        .maybeSingle();

      const defaultAdminEmails = [
        "hassan.mokdad01@lau.edu",
        "hasan.mokdad@aiesec.net",
      ];

      let resolvedRole = (roleRow?.roles?.name ?? null) as AppRole | null;

      // Fallback: if no stored role yet but email is a known founder/admin,
      // temporarily treat them as admin so they NEVER get stuck on /select-role.
      if (!resolvedRole && defaultAdminEmails.includes(user.email ?? "")) {
        resolvedRole = "admin";
      }

      // Admin must NEVER be redirected to /select-role
      if (resolvedRole === "admin") {
        setRole("admin");
        setLoading(false);
        return;
      }

      if (!resolvedRole) {
        // User has no role at all
        setRole(null);

        if (requiredRole) {
          // Protected route requires a role, send user to role selection
          navigate("/select-role", { replace: true });
        }

        setLoading(false);
        return;
      }

      // We have a role (either from DB or fallback)
      setRole(resolvedRole);

      if (requiredRole && resolvedRole !== requiredRole) {
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
