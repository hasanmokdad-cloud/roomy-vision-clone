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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth", { replace: true });
      return;
    }

    // Fetch role using join
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const role = roleRow?.roles?.name;

    if (!role) {
      navigate("/select-role", { replace: true });
      return;
    }

    if (role === "admin") navigate("/admin", { replace: true });
    else if (role === "owner") navigate("/owner", { replace: true });
    else if (role === "student") navigate("/dashboard", { replace: true });
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
