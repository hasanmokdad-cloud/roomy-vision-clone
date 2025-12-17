import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import FluidBackground from "@/components/FluidBackground";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { getEmailProviderInfo } from "@/utils/emailProvider";
import RoomyLogo from "@/assets/roomy-logo.png";

export default function PasswordReset() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Look up user by email to get their user_id
      // We use a custom edge function to handle this securely
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: email.trim() }
      });

      if (error) throw error;

      if (data?.error) {
        // If user doesn't exist, still show success to prevent email enumeration
        console.log('[PasswordReset] User lookup result:', data.error);
      }

      setIsSent(true);
      toast({
        title: "Reset link sent",
        description: "If an account exists, you'll receive an email from security@roomylb.com",
      });
    } catch (error: any) {
      // Always show success to prevent email enumeration attacks
      setIsSent(true);
      toast({
        title: "Reset link sent",
        description: "If an account exists, you'll receive an email from security@roomylb.com",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const providerInfo = getEmailProviderInfo(email);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FluidBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="w-full max-w-[380px] sm:max-w-md bg-background/95 backdrop-blur-sm border-border/50 shadow-2xl">
            <CardContent className="pt-8 pb-8 px-6 space-y-6">
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

              <AnimatePresence mode="wait">
                {!isSent ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Icon */}
                    <div className="flex justify-center">
                      <motion.div 
                        className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                      >
                        <Mail className="w-8 h-8 text-primary" />
                      </motion.div>
                    </div>
                    
                    {/* Title */}
                    <div className="text-center space-y-2">
                      <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
                      <p className="text-muted-foreground text-sm">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@email.com"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-[#00E0FF] to-[#BD00FF] hover:opacity-90"
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send reset link"
                        )}
                      </Button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Success State */}
                    <div className="flex justify-center">
                      <motion.div 
                        className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </motion.div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
                      <p className="text-muted-foreground text-sm">
                        Password reset link sent to <span className="font-medium text-foreground">{email}</span>. Check your inbox for instructions to reset your password.
                      </p>
                    </div>

                    {/* Smart Email Provider Button */}
                    {providerInfo && (
                      <Button
                        onClick={() => window.open(providerInfo.url, '_blank', 'noopener,noreferrer')}
                        className="w-full bg-gradient-to-r from-[#00E0FF] to-[#BD00FF] hover:opacity-90 text-white gap-2"
                        size="lg"
                      >
                        {providerInfo.label}
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => setIsSent(false)}
                      variant="outline"
                      className="w-full"
                    >
                      Send another link
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Back to Login */}
              <motion.button
                onClick={() => navigate('/auth')}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </motion.button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
