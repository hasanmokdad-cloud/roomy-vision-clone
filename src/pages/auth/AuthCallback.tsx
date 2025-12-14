import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FluidBackground from "@/components/FluidBackground";
import RoomyLogo from "@/assets/roomy-logo.png";
import { Loader2, CheckCircle } from "lucide-react";

type CallbackState = "processing" | "success" | "error";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>("processing");
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait for Supabase to process the URL hash automatically
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          setState("error");
          setMessage("Authentication failed");
          setTimeout(() => navigate("/listings"), 2000);
          return;
        }

        if (!session) {
          setState("error");
          setMessage("No session found");
          setTimeout(() => navigate("/listings"), 2000);
          return;
        }

        setState("success");
        setMessage("Authentication successful!");

        // Get user role
        const { data: roleData } = await supabase.rpc("get_user_role", {
          p_user_id: session.user.id,
        });

        // Redirect based on role
        setTimeout(() => {
          if (roleData === "admin") {
            navigate("/admin", { replace: true });
          } else if (roleData === "owner") {
            navigate("/owner", { replace: true });
          } else if (roleData === "student") {
            navigate("/intro", { replace: true });
          } else {
            navigate("/select-role", { replace: true });
          }
        }, 1500);
      } catch (err) {
        console.error("Auth callback exception:", err);
        setState("error");
        setMessage("Something went wrong");
        setTimeout(() => navigate("/listings"), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <FluidBackground />
      <div className="relative z-10 text-center">
        <img
          src={RoomyLogo}
          alt="Roomy"
          className="w-24 h-24 mx-auto mb-6 drop-shadow-2xl"
        />
        <div className="flex flex-col items-center gap-4">
          {state === "processing" && (
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          )}
          {state === "success" && (
            <CheckCircle className="w-8 h-8 text-green-500" />
          )}
          <p className="text-lg text-foreground/80">{message}</p>
        </div>
      </div>
    </div>
  );
}
