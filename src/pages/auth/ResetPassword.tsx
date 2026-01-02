import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { EmailProviderButtons } from "@/components/auth/EmailProviderButtons";
import { checkPasswordBreach } from "@/utils/passwordBreachCheck";
import { RoomyNavbar } from "@/components/RoomyNavbar";
import Footer from "@/components/shared/Footer";
import RoomyLogo from "@/assets/roomy-logo.png";

type ResetStep = 'checking' | 'loading' | 'form' | 'error';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<ResetStep>('checking');
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showMismatchError, setShowMismatchError] = useState(false);

  // Password validation
  const isMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isFormValid = isMinLength && hasNumber && hasUppercase && passwordsMatch;

  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);

  useEffect(() => {
    // Log password reset attempt
    console.log("[password_reset_attempt]", new Date().toISOString());

    const checkSession = async () => {
      setStep('checking');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setStep('loading');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get token from URL query params (sent from roomylb.com email links)
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const type = urlParams.get('type');
      
      if (token && type === 'recovery') {
        // Verify the recovery token with our custom edge function
        try {
          const { data, error } = await supabase.functions.invoke('verify-email-token', {
            body: { token, type: 'recovery' }
          });
          
          if (error || !data?.valid) {
            console.log("[password_reset_error] Token verification failed:", error || data?.error);
            setErrorMessage("This reset link is invalid or has expired.");
            toast({
              title: "Invalid reset link",
              description: "Please request a new password reset link.",
              variant: "destructive",
            });
            setStep('error');
            return;
          }
          
          // Token verified, store user ID and show password form
          setVerifiedUserId(data.userId);
          setStep('form');
          return;
        } catch (err) {
          console.log("[password_reset_error] Token verification exception:", err);
          setErrorMessage("This reset link is invalid or has expired.");
          toast({
            title: "Invalid reset link",
            description: "Please request a new password reset link.",
            variant: "destructive",
          });
          setStep('error');
          return;
        }
      }
      
      // Fallback: Check for valid recovery session (legacy URL hash flow)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log("[password_reset_error] No valid session");
        setErrorMessage("This reset link is invalid or has expired.");
        toast({
          title: "Invalid reset link",
          description: "Please request a new password reset link.",
          variant: "destructive",
        });
        setStep('error');
        return;
      }
      
      setVerifiedUserId(session.user.id);
      setStep('form');
    };

    checkSession();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setShowMismatchError(false);

    if (!isFormValid) {
      if (!passwordsMatch && confirmPassword.length > 0) {
        setShowMismatchError(true);
      }
      return;
    }

    setIsLoading(true);
    try {
      // Check password against breach database (HIBP k-anonymous API)
      const breachResult = await checkPasswordBreach(password);
      
      if (breachResult.isBreached) {
        // Log breach detection
        try {
          await supabase.from('password_breach_logs').insert({
            action_type: 'reset_blocked',
            breach_count: breachResult.breachCount
          });
        } catch {} // Silent fail for logging
        
        toast({
          title: "Password Not Secure",
          description: "This password has appeared in known data breaches. Please choose a more secure password.",
          variant: "destructive",
        });
        setPassword("");
        setConfirmPassword("");
        return;
      }

      // Update password via admin API (since we verified token via our custom flow)
      if (verifiedUserId) {
        const { error } = await supabase.functions.invoke('update-user-password', {
          body: { userId: verifiedUserId, password }
        });

        if (error) throw error;
      } else {
        // Fallback to regular update if we have a session
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      }

      // Log success
      console.log("[password_reset_success]", new Date().toISOString());

      // Clear form
      setPassword("");
      setConfirmPassword("");

      toast({
        title: "Password updated",
        description: "Your password has been reset successfully.",
      });

      // Navigate to success page
      navigate('/password-reset/success', { replace: true });
    } catch (error: any) {
      toast({
        title: "Failed to update password",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      // Clear fields on error for security
      setPassword("");
      setConfirmPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle confirm password blur to show mismatch error
  const handleConfirmBlur = () => {
    if (confirmPassword.length > 0 && !passwordsMatch) {
      setShowMismatchError(true);
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 'checking':
      case 'loading':
        return (
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {step === 'checking' ? 'Verifying link...' : 'Almost there...'}
              </h1>
              <p className="text-muted-foreground">Please wait</p>
            </div>
          </motion.div>
        );

      case 'form':
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex justify-center">
              <motion.div 
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Lock className="w-8 h-8 text-primary" />
              </motion.div>
            </div>
            
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Create new password</h1>
              <p className="text-muted-foreground text-sm">
                Enter your new password below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Meter */}
              <PasswordStrengthMeter password={password} />

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <motion.div
                    animate={showMismatchError ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setShowMismatchError(false);
                      }}
                      onBlur={handleConfirmBlur}
                      placeholder="••••••••"
                      required
                      className={`pr-10 ${showMismatchError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                  </motion.div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {showMismatchError && (
                  <motion.p 
                    className="text-xs text-red-500"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    Passwords don't match
                  </motion.p>
                )}
                {passwordsMatch && (
                  <motion.p 
                    className="text-xs text-green-500"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    Passwords match ✓
                  </motion.p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full bg-gradient-to-r from-[#00E0FF] to-[#BD00FF] hover:opacity-90 disabled:opacity-50"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div 
              className="flex justify-center"
              animate={{ x: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-4xl font-bold">
                !
              </div>
            </motion.div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Link Expired</h1>
              <p className="text-muted-foreground">{errorMessage || "Please request a new reset link"}</p>
            </div>
            
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

            <button
              onClick={() => navigate('/listings')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to login
            </button>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <RoomyNavbar />
      
      <main className="flex-1 flex items-center justify-center p-4 mt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-[380px] sm:max-w-md border-border/50 shadow-xl">
            <CardContent className="pt-8 pb-8 px-6 space-y-6">
              {/* Logo */}
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <img 
                  src={RoomyLogo} 
                  alt="Roomy Logo" 
                  className="h-24 w-24 mx-auto mb-4 drop-shadow-lg"
                />
              </motion.div>

              {getStepContent()}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
