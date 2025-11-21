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
      // ALWAYS refresh session to get the latest data and avoid stale cache
      console.log("🔄 useRoleGuard: Refreshing session...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error("❌ useRoleGuard: Session refresh failed:", refreshError);
      }

      let session = refreshData?.session;
      
      // Fallback to getSession if refresh fails
      if (!session) {
        console.log("⚠️ useRoleGuard: Refresh returned no session, falling back to getSession...");
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData?.session;
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
        "hasan.mokdad@aiesec.net",
      ];

      // Try to read role with retry logic - keep retrying even if no role found
      let resolvedRole: AppRole | null = null;
      let attempts = 0;
      const maxAttempts = 5; // Increased attempts for database replication lag

      while (!resolvedRole && attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 useRoleGuard: Attempt ${attempts}/${maxAttempts} to fetch role for user ${user.id}`);
        
        // Step 1: Get the role_id from user_roles
        const { data: userRoleRow, error: userRoleError } = await supabase
          .from("user_roles")
          .select("role_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (userRoleError) {
          console.error(`❌ useRoleGuard: user_roles fetch failed:`, userRoleError);
        }

        // Log what we got
        console.log(`📊 useRoleGuard: user_roles data:`, userRoleRow);

        if (userRoleRow?.role_id) {
          // Step 2: Get the role name from roles table
          const { data: roleData, error: roleError } = await supabase
            .from("roles")
            .select("name")
            .eq("id", userRoleRow.role_id)
            .single();

          if (roleError) {
            console.error(`❌ useRoleGuard: roles fetch failed:`, roleError);
          } else {
            resolvedRole = roleData?.name as AppRole | null;
            console.log(`✅ useRoleGuard: Role found on attempt ${attempts}:`, resolvedRole);
          }
        } else {
          console.log(`⏳ useRoleGuard: No user_role found on attempt ${attempts}`);
        }

        // Wait before retrying if no role found
        if (!resolvedRole && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 300 * attempts));
        }
      }

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
