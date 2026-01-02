import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { EmailProviderButtons } from "@/components/auth/EmailProviderButtons";
import { RoomyNavbar } from "@/components/RoomyNavbar";
import Footer from "@/components/shared/Footer";
import RoomyLogo from "@/assets/roomy-logo.png";

export default function ResetPasswordError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <RoomyNavbar />
      
      <main className="flex-1 flex items-center justify-center p-4 mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="w-full max-w-[380px] sm:max-w-md border-border/50 shadow-xl">
            <CardContent className="pt-8 pb-8 px-6 space-y-8">
              {/* Logo */}
              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <img 
                  src={RoomyLogo} 
                  alt="Roomy Logo" 
                  className="h-24 w-24 mx-auto mb-4 drop-shadow-lg"
                />
              </motion.div>

              {/* Error Icon with Shake */}
              <motion.div 
                className="flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1, x: [0, -10, 10, -10, 10, 0] }}
                transition={{ 
                  scale: { type: "spring", stiffness: 200, delay: 0.3 },
                  x: { duration: 0.4, delay: 0.5 }
                }}
              >
                <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-14 h-14 text-destructive" />
                </div>
              </motion.div>

              {/* Error Message */}
              <motion.div 
                className="text-center space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-2xl font-bold text-foreground">Link Expired</h1>
                <p className="text-muted-foreground">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
              </motion.div>

              {/* Actions */}
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={() => navigate('/password-reset')}
                  className="w-full bg-gradient-to-r from-[#00E0FF] to-[#BD00FF] hover:opacity-90"
                  size="lg"
                >
                  Request New Reset Link
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or check your email
                    </span>
                  </div>
                </div>

                <EmailProviderButtons variant="outline" />
              </motion.div>

              {/* Back to Login */}
              <motion.button
                onClick={() => navigate('/listings')}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </motion.button>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
