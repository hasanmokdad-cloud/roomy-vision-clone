import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { RoomyNavbar } from "@/components/RoomyNavbar";
import Footer from "@/components/shared/Footer";
import RoomyLogo from "@/assets/roomy-logo.png";

export default function ResetPasswordSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/listings', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

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

              {/* Success Icon */}
              <motion.div 
                className="flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
              >
                <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.5 }}
                  >
                    <CheckCircle className="w-14 h-14 text-green-500" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Success Message */}
              <motion.div 
                className="text-center space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-2xl font-bold text-foreground">Password Updated!</h1>
                <p className="text-muted-foreground">
                  Your password has been reset successfully.
                </p>
              </motion.div>

              {/* Countdown */}
              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-sm text-muted-foreground mb-4">
                  Redirecting in <span className="font-bold text-primary">{countdown}</span> seconds...
                </p>
                <Button
                  onClick={() => navigate('/listings', { replace: true })}
                  className="w-full bg-gradient-to-r from-[#00E0FF] to-[#BD00FF] hover:opacity-90"
                  size="lg"
                >
                  Continue to Listings
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
