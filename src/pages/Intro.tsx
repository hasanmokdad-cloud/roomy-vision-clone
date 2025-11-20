import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import EntryAnimation from "@/components/EntryAnimation";
import FluidBackground from "@/components/FluidBackground";
import { supabase } from "@/integrations/supabase/client";

export default function Intro() {
  const navigate = useNavigate();

  useEffect(() => {
    const introPlayed = sessionStorage.getItem("intro-played");
    if (introPlayed === "true") {
      navigateBasedOnRole();
    }
  }, []);

  const navigateBasedOnRole = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      navigate("/auth", { replace: true });
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .limit(1);

    const userRole = roles?.[0]?.role as "admin" | "owner" | "student" | undefined;

    if (!userRole) {
      navigate("/select-role", { replace: true });
      return;
    }

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
