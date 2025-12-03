import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, RefreshCw, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import FluidBackground from "@/components/FluidBackground";
import { getEmailProviderInfo } from "@/utils/emailProvider";

export default function DevicePending() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const providerInfo = getEmailProviderInfo(email);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FluidBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-background/95 backdrop-blur-sm border border-border/40 rounded-2xl p-8 shadow-2xl text-center">
            {/* Logo */}
            <div className="mb-6">
              <img 
                src="/roomy-logo.png" 
                alt="Roomy Logo" 
                className="h-14 w-14 mx-auto rounded-xl" 
              />
            </div>

            {/* Animated Mail Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <motion.div
                  animate={{ 
                    y: [0, -5, 0],
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Mail className="w-10 h-10 text-white" />
                </motion.div>
              </div>
            </motion.div>

            <h1 className="text-2xl font-bold mb-2">New Device Detected</h1>
            <p className="text-foreground/70 mb-6">
              For your security, we sent a verification link to{" "}
              <span className="font-medium text-foreground">{email || "your email"}</span>
            </p>

            {/* Info Box */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4 text-left mb-6">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Check your inbox</strong> and click "Yes, This Was Me" to approve this device and continue logging in.
              </p>
            </div>

            <div className="space-y-3">
              {providerInfo && (
                <Button
                  className="w-full bg-gradient-to-r from-[#00E0FF] to-[#BD00FF] hover:opacity-90 text-white gap-2"
                  onClick={() => window.open(providerInfo.url, '_blank', 'noopener,noreferrer')}
                >
                  {providerInfo.label}
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Login Again
              </Button>

              <Button
                variant="ghost"
                className="w-full text-foreground/60"
                onClick={() => navigate("/auth")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>

            <p className="text-xs text-foreground/50 mt-6">
              Didn't receive the email? Check your spam folder or try logging in again to resend.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
