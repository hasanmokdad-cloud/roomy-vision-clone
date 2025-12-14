import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FluidBackground from "@/components/FluidBackground";

type VerifyState = "loading" | "success" | "error" | "expired";

export default function VerifyDevice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<VerifyState>("loading");
  const [deviceName, setDeviceName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setState("error");
      setErrorMessage("No verification token provided.");
      return;
    }

    verifyDevice(token);
  }, [searchParams]);

  useEffect(() => {
    if (state === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (state === "success" && countdown === 0) {
      navigate("/listings", { replace: true });
    }
  }, [state, countdown, navigate]);

  const verifyDevice = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("confirm-device", {
        body: { token }
      });

      if (error || data?.error) {
        const errorCode = data?.code || "";
        if (errorCode === "EXPIRED_TOKEN") {
          setState("expired");
          setErrorMessage(data?.error || "The verification link has expired.");
        } else {
          setState("error");
          setErrorMessage(data?.error || "Failed to verify device.");
        }
        return;
      }

      setDeviceName(data.deviceName || "Your device");
      setState("success");
    } catch (err) {
      console.error("Verification error:", err);
      setState("error");
      setErrorMessage("An unexpected error occurred.");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FluidBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="bg-background/95 backdrop-blur-sm border border-border/40 rounded-2xl p-8 shadow-2xl text-center">
            {state === "loading" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
                <h2 className="text-xl font-semibold">Verifying Device...</h2>
                <p className="text-foreground/60">Please wait a moment</p>
              </motion.div>
            )}

            {state === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-bold text-green-600">Device Approved!</h2>
                <p className="text-foreground/70">
                  <span className="font-medium">{deviceName}</span> has been added to your trusted devices.
                </p>
                <p className="text-sm text-foreground/50">
                  Redirecting to login in {countdown}...
                </p>
                <Button
                  onClick={() => navigate("/listings")}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90"
                >
                  Go to Login Now
                </Button>
              </motion.div>
            )}

            {state === "error" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ repeat: 2, duration: 0.3 }}
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-white" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
                <p className="text-foreground/70">{errorMessage}</p>
                <Button
                  onClick={() => navigate("/listings")}
                  variant="outline"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </motion.div>
            )}

            {state === "expired" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <span className="text-3xl">⏰</span>
                </div>
                <h2 className="text-2xl font-bold text-amber-600">Link Expired</h2>
                <p className="text-foreground/70">{errorMessage}</p>
                <p className="text-sm text-foreground/50">
                  Log in again to receive a new verification email.
                </p>
                <Button
                  onClick={() => navigate("/listings")}
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
                >
                  Go to Listings
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
