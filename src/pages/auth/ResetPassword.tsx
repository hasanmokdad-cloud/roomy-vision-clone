import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import FluidBackground from "@/components/FluidBackground";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ResetStep = 'checking' | 'loading' | 'form' | 'success' | 'error';

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

  useEffect(() => {
    const checkSession = async () => {
      // Step 1: Checking
      setStep('checking');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Loading
      setStep('loading');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if we have a valid recovery session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setErrorMessage(error.message);
        setStep('error');
        return;
      }
      
      // Show the form
      setStep('form');
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setStep('success');
      toast({
        title: "Password updated",
        description: "Your password has been reset successfully.",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/auth?mode=login', { replace: true });
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Failed to update password",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 'checking':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Checking your code...</h1>
              <p className="text-muted-foreground">Please wait</p>
            </div>
          </div>
        );
      case 'loading':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Loading...</h1>
              <p className="text-muted-foreground">Almost there</p>
            </div>
          </div>
        );
      case 'form':
        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Create new password</h1>
              <p className="text-muted-foreground text-sm">
                Enter your new password below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#6b21a8] via-[#2563eb] to-[#10b981] hover:opacity-90"
              >
                {isLoading ? "Updating..." : "Update password"}
              </Button>
            </form>
          </div>
        );
      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Password Updated</h1>
              <p className="text-muted-foreground">Redirecting...</p>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-3xl font-bold">
                !
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
              <p className="text-muted-foreground">{errorMessage || "Please try again"}</p>
            </div>
            <button
              onClick={() => navigate('/password-reset')}
              className="text-primary hover:underline font-medium"
            >
              Request a new reset link
            </button>
          </div>
        );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FluidBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm border-border/50 shadow-2xl">
          <CardContent className="pt-8 pb-8 px-6 space-y-6">
            {/* Logo */}
            <div className="text-center text-4xl font-extrabold">
              <span className="bg-gradient-to-r from-[#6b21a8] via-[#2563eb] to-[#10b981] bg-clip-text text-transparent">
                Roomy
              </span>
            </div>

            {getStepContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
