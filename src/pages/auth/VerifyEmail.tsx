import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import FluidBackground from "@/components/FluidBackground";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type VerificationStep = 'checking' | 'loading' | 'verifying' | 'success' | 'error';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<VerificationStep>('checking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      // Step 1: Checking
      setStep('checking');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Loading
      setStep('loading');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Verifying
      setStep('verifying');
      
      // Check for session (Supabase automatically verifies from URL hash)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setErrorMessage(error.message);
        setStep('error');
        return;
      }
      
      if (session?.user?.email_confirmed_at) {
        // Email is verified
        setStep('success');
        toast({
          title: "Email verified",
          description: "Your email has been verified successfully.",
        });
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/auth?mode=login', { replace: true });
        }, 2000);
      } else {
        // Listen for auth state changes (verification might complete async)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
            setStep('success');
            toast({
              title: "Email verified",
              description: "Your email has been verified successfully.",
            });
            
            setTimeout(() => {
              navigate('/auth?mode=login', { replace: true });
            }, 2000);
          }
        });
        
        // Timeout if verification doesn't complete
        setTimeout(() => {
          if (step !== 'success') {
            subscription.unsubscribe();
            // Still redirect to login even if we can't confirm verification
            setStep('success');
            setTimeout(() => {
              navigate('/auth?mode=login', { replace: true });
            }, 2000);
          }
        }, 5000);
        
        return () => subscription.unsubscribe();
      }
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
              src="/roomy-logo.png" 
              alt="Roomy Logo" 
              className="h-28 w-28 mx-auto mb-4"
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
                onClick={() => navigate('/auth')}
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
