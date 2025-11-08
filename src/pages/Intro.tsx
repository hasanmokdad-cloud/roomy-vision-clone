import { useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";
import EntryAnimation from "@/components/EntryAnimation";
import FluidBackground from "@/components/FluidBackground";

export default function Intro() {
  const navigate = useNavigate();

  const handleComplete = useCallback(() => {
    sessionStorage.setItem("intro-played", "true");
    navigate("/", { replace: true });
  }, [navigate]);

  // Skip replay within same session
  useEffect(() => {
    const played = sessionStorage.getItem("intro-played");
    if (played) navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FluidBackground />
      <EntryAnimation onComplete={handleComplete} />
    </div>
  );
}
