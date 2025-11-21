// src/pages/Intro.tsx
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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth", { replace: true });
      return;
    }

    const user = session.user;

    // Fetch role using join
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", user.id)
      .maybeSingle();

    const defaultAdminEmails = [
      "hassan.mokdad01@lau.edu",
      "hasan.mokdad@aiesec.net",
    ];

    let role = roleRow?.roles?.name as "admin" | "owner" | "student" | undefined;

    // Fallback: treat founder emails as admin if no role row exists yet
    if (!role && defaultAdminEmails.includes(user.email ?? "")) {
      role = "admin";
    }

    if (!role) {
      navigate("/select-role", { replace: true });
      return;
    }

    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else if (role === "owner") {
      navigate("/owner", { replace: true });
    } else if (role === "student") {
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
