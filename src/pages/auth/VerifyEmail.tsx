import { useEffect, useState } from "react";
import RoomyLogo from "@/assets/roomy-logo.png";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import FluidBackground from "@/components/FluidBackground";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/contexts/OnboardingContext";

type VerificationStep = 'checking' | 'loading' | 'verifying' | 'success' | 'error';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startOnboarding } = useOnboarding();
  const [step, setStep] = useState<VerificationStep>('checking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      // Step 1: Checking
      setStep('checking');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Step 2: Loading
      setStep('loading');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Step 3: Verifying
      setStep('verifying');
      
      // Get token from URL query params (sent from roomylb.com email links)
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const type = urlParams.get('type') || 'signup';
      
      if (token) {
        try {
          // Verify the token using our custom edge function
          const { data, error } = await supabase.functions.invoke("verify-email-token", {
            body: { token, type }
          });
          
          if (error) {
            console.error('[VerifyEmail] Token verification error:', error);
            setErrorMessage(error.message || "Verification failed");
            setStep('error');
            return;
          }
          
          if (data?.valid) {
            setStep('success');
            toast({
              title: "Email verified",
              description: "Your email has been verified successfully.",
            });
            
            // Start onboarding flow and redirect
            setTimeout(() => {
              startOnboarding();
              navigate('/listings', { replace: true });
            }, 1500);
            return;
          } else {
            setErrorMessage(data?.error || "Invalid or expired verification link");
            setStep('error');
            return;
          }
        } catch (err: any) {
          console.error('[VerifyEmail] Exception:', err);
          setErrorMessage("Verification failed. Please try again.");
          setStep('error');
          return;
        }
      }
      
      // No token provided - show error
      setErrorMessage("Missing verification token. Please check your email for the verification link.");
      setStep('error');
    };

    verifyEmail();
  }, [navigate, toast]);

  const getStepContent = () => {
    switch (step) {
      case 'checking':
        return {
          icon: <Loader2 className="w-12 h-12 text-primary animate-spin" />,
          title: "Checking your code...",
          subtitle: "Please wait",
        };
      case 'loading':
        return {
          icon: <Loader2 className="w-12 h-12 text-primary animate-spin" />,
          title: "Loading...",
          subtitle: "Almost there",
        };
      case 'verifying':
        return {
          icon: <Loader2 className="w-12 h-12 text-primary animate-spin" />,
          title: "Verifying email...",
          subtitle: "This won't take long",
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          title: "Email Verified",
          subtitle: "Redirecting...",
        };
      case 'error':
        return {
          icon: <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center text-destructive text-2xl">!</div>,
          title: "Verification Failed",
          subtitle: errorMessage || "Please try again",
        };
    }
  };

  const content = getStepContent();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FluidBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm border-border/50 shadow-2xl">
          <CardContent className="pt-8 pb-8 px-6 text-center space-y-6">
            {/* Logo */}
            <img 
              src={RoomyLogo} 
              alt="Roomy Logo" 
              className="h-24 w-24 mx-auto mb-4 drop-shadow-lg"
            />
            
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                {content.icon}
              </div>
            </div>
            
            {/* Status Text */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{content.title}</h1>
              <p className="text-muted-foreground">{content.subtitle}</p>
            </div>
            
            {/* Error retry button */}
            {step === 'error' && (
              <button
                onClick={() => navigate('/listings')}
                className="text-primary hover:underline font-medium"
              >
                Back to login
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
