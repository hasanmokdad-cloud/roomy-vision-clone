import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ShieldAlert, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import FluidBackground from "@/components/FluidBackground";

type SecureState = "loading" | "secured" | "error";

export default function SecureAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<SecureState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setState("error");
      setErrorMessage("No security token provided.");
      return;
    }

    secureAccount(token);
  }, [searchParams]);

  const secureAccount = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("secure-account", {
        body: { token }
      });

      if (error || data?.error) {
        setState("error");
        setErrorMessage(data?.error || "Failed to secure account.");
        return;
      }

      setState("secured");
    } catch (err) {
      console.error("Security error:", err);
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
                <Loader2 className="w-16 h-16 mx-auto text-red-500 animate-spin" />
                <h2 className="text-xl font-semibold">Securing Your Account...</h2>
                <p className="text-foreground/60">Revoking all active sessions</p>
              </motion.div>
            )}

            {state === "secured" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="space-y-6"
              >
                {/* Pulsing Alert */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 0 0 rgba(239, 68, 68, 0.4)",
                      "0 0 0 20px rgba(239, 68, 68, 0)",
                      "0 0 0 0 rgba(239, 68, 68, 0)"
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center"
                >
                  <ShieldAlert className="w-12 h-12 text-white" />
                </motion.div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-red-600">Account Secured</h2>
                  <p className="text-foreground/70">
                    All devices have been logged out and removed from your account.
                  </p>
                </div>

                {/* Action Items */}
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 text-left space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>Recommended:</strong> Reset your password immediately to prevent unauthorized access.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Review your account for any suspicious activity after logging back in.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    onClick={() => navigate("/password-reset")}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90"
                  >
                    Reset Password Now
                  </Button>
                  <Button
                    onClick={() => navigate("/auth")}
                    variant="outline"
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>
              </motion.div>
            )}

            {state === "error" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                  <ShieldAlert className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Something Went Wrong</h2>
                <p className="text-foreground/70">{errorMessage}</p>
                <Button
                  onClick={() => navigate("/auth")}
                  variant="outline"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
