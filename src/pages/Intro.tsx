import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import EntryAnimation from "@/components/EntryAnimation";
import FluidBackground from "@/components/FluidBackground";
import { supabase } from "@/integrations/supabase/client";

export default function Intro() {
  const navigate = useNavigate();

  useEffect(() => {
    const played = sessionStorage.getItem("intro-played");
    if (played === "true") {
      void navigateBasedOnRole();
    }
  }, []);

  const navigateBasedOnRole = async () => {
    const { data: sessionData, error } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (error || !session) {
      navigate("/auth", { replace: true });
      return;
    }

    // Check if user has a role assigned
    const { data: userRoleRow } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", session.user.id)
      .limit(1)
      .single();

    if (!userRoleRow?.role_id) {
      navigate("/select-role", { replace: true });
      return;
    }

    // Resolve role name from roles table
    const { data: roleRecord } = await supabase
      .from("roles")
      .select("name")
      .eq("id", userRoleRow.role_id)
      .limit(1)
      .single();

    const userRole = roleRecord?.name;

    if (!userRole) {
      navigate("/select-role", { replace: true });
      return;
    }

    // Navigate based on assigned role
    if (userRole === "admin") {
      navigate("/admin", { replace: true });
    } else if (userRole === "owner") {
      navigate("/owner", { replace: true });
    } else if (userRole === "student") {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleComplete = async () => {
    sessionStorage.setItem("intro-played", "true");
    await navigateBasedOnRole();
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FluidBackground />
      <EntryAnimation onComplete={handleComplete} />
    </div>
  );
}
