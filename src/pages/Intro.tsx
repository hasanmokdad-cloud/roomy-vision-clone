// src/pages/Intro.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import EntryAnimation from "@/components/EntryAnimation";
import FluidBackground from "@/components/FluidBackground";
import { supabase } from "@/integrations/supabase/client";

export default function Intro() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkSession();
  }, []);

  useEffect(() => {
    // If intro was already played this session, navigate immediately
    const played = sessionStorage.getItem("intro-played");
    if (played === "true") {
      void navigateAfterIntro();
    }
  }, [isLoggedIn]);

  const navigateAfterIntro = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    // If not logged in, go to listings (public access)
    if (!session) {
      navigate("/listings", { replace: true });
      return;
    }

    const user = session.user;

    // Fetch role using join with roles table
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .maybeSingle();

    const defaultAdminEmails = [
      "hassan.mokdad01@lau.edu",
    ];

    let role = roleRow?.roles?.name as "admin" | "owner" | "student" | undefined;

    // Fallback: treat founder emails as admin if no role row exists yet
    if (!role && defaultAdminEmails.includes(user.email ?? "")) {
      role = "admin";
    }

    // If no role, they need to select one
    if (!role) {
      navigate("/select-role", { replace: true });
      return;
    }

    // Navigate based on role
    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else if (role === "owner") {
      navigate("/owner", { replace: true });
    } else if (role === "student") {
      navigate("/listings", { replace: true });
    }
  };

  const handleComplete = async () => {
    sessionStorage.setItem("intro-played", "true");
    await navigateAfterIntro();
  };

  // Don't render until we know login state
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FluidBackground />
      <EntryAnimation onComplete={handleComplete} isLoggedIn={isLoggedIn} />
    </div>
  );
}
