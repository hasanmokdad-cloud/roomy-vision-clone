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
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const role = userRoleRow?.role;

    if (!role) {
      // No role assigned yet → go to role selection
      navigate("/select-role", { replace: true });
      return;
    }

    // Navigate based on assigned role
    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else if (role === "owner") {
      navigate("/owner", { replace: true });
    } else if (role === "student") {
      navigate("/dashboard", { replace: true });
    } else {
      // Unknown role → go to role selection
      navigate("/select-role", { replace: true });
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
