import { useEffect, useState } from "react";
import RoomyLogo from "@/assets/roomy-logo.png";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import FluidBackground from "@/components/FluidBackground";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";

type VerificationStep = 'checking' | 'loading' | 'verifying' | 'success' | 'error';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startOnboarding } = useOnboarding();
  const { refreshEmailVerification, refreshAuth } = useAuth();
  const [step, setStep] = useState<VerificationStep>('checking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      // Step 1: Checking
      setStep('checking');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Step 2: Loading
      setStep('loading');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Step 3: Verifying
      setStep('verifying');
      
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Check for different verification methods
        const customToken = urlParams.get('token'); // Our custom Roomy token
        const code = urlParams.get('code'); // Supabase PKCE code (legacy)
        const token_hash = urlParams.get('token_hash'); // Supabase token_hash (legacy)
        const type = urlParams.get('type') || 'signup';
        const accessToken = hashParams.get('access_token');
        const errorParam = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        
        console.log('[VerifyEmail] URL params:', { customToken: !!customToken, code: !!code, token_hash: !!token_hash, type, accessToken: !!accessToken, error: errorParam });
        
        // Handle error in URL (from Supabase redirect)
        if (errorParam) {
          console.error('[VerifyEmail] Error in URL:', errorParam, errorDescription);
          setErrorMessage(errorDescription || errorParam || "Verification failed");
          setStep('error');
          return;
        }
        
        let user = null;
        
        // Method 1: Handle custom Roomy token (from security@roomylb.com emails)
        if (customToken) {
          console.log('[VerifyEmail] Verifying custom Roomy token...');
          const { data, error } = await supabase.functions.invoke('verify-email-token', {
            body: { token: customToken, type }
          });
          
          if (error || !data?.valid) {
            console.error('[VerifyEmail] Custom token verification error:', error || data?.error);
            setErrorMessage(data?.error || error?.message || "Verification failed");
            setStep('error');
            return;
          }
          
          // Token verified - user is now confirmed
          console.log('[VerifyEmail] Custom token verified for user:', data.userId);
          
          // Refresh auth context to update isEmailVerified
          await refreshEmailVerification();
          await refreshAuth();
          
          setStep('success');
          toast({
            title: "Email verified",
            description: "Your email has been verified successfully.",
          });
          
          setTimeout(() => {
            startOnboarding();
          }, 1500);
          
          setTimeout(() => {
            navigate('/listings', { replace: true });
          }, 1700);
          return;
        }
        
        // Method 2: Handle PKCE code (from Supabase default emails with ?code=) - legacy
        if (code) {
          console.log('[VerifyEmail] Exchanging PKCE code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('[VerifyEmail] PKCE exchange error:', error);
            // If flow state expired, check if user is already logged in
            if (error.message.includes('flow state')) {
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session?.user) {
                console.log('[VerifyEmail] User already has session, proceeding...');
                user = sessionData.session.user;
              } else {
                setErrorMessage("Verification link expired. Please request a new one.");
                setStep('error');
                return;
              }
            } else {
              setErrorMessage(error.message || "Verification failed");
              setStep('error');
              return;
            }
          } else {
            user = data?.user;
          }
        }
        // Method 3: Handle token_hash (from legacy emails with ?token_hash=)
        else if (token_hash) {
          console.log('[VerifyEmail] Verifying with token_hash...');
          const otpType = type === 'signup' || type === 'email' ? 'email' : 'recovery';
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token_hash,
            type: otpType,
          });
          
          if (error) {
            console.error('[VerifyEmail] Token verification error:', error);
            setErrorMessage(error.message || "Verification failed");
            setStep('error');
            return;
          }
          user = data?.user;
        }
        // Method 4: Handle hash fragment (magic links/OAuth - session already set)
        else if (accessToken) {
          console.log('[VerifyEmail] Access token in hash, getting session...');
          const { data: sessionData, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[VerifyEmail] Session error:', error);
            setErrorMessage(error.message || "Verification failed");
            setStep('error');
            return;
          }
          user = sessionData?.session?.user;
        }
        // Method 5: No verification params - check if already authenticated
        else {
          console.log('[VerifyEmail] No verification params, checking existing session...');
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (sessionData?.session?.user) {
            console.log('[VerifyEmail] User already authenticated');
            user = sessionData.session.user;
          } else {
            setErrorMessage("Missing verification token. Please check your email for the verification link.");
            setStep('error');
            return;
          }
        }
        
        // If we got a user, handle role assignment
        if (user) {
          console.log('[VerifyEmail] User verified:', user.email);
          
          // Check if they need role assignment
          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (!existingRole) {
            // Auto-assign student role
            const { data: studentRole } = await supabase
              .from('roles')
              .select('id')
              .eq('name', 'student')
              .single();
            
            if (studentRole) {
              await supabase.from('user_roles').insert({
                user_id: user.id,
                role_id: studentRole.id
              });
              
              // Create student profile
              await supabase.from('students').insert({
                user_id: user.id,
                email: user.email,
                full_name: user.email?.split('@')[0] || 'Student'
              });
              
              // Pre-cache onboarding status for faster redirect
              sessionStorage.setItem(`roomy_onboarding_${user.id}`, 'pending');
            }
          }
          
          setStep('success');
          toast({
            title: "Email verified",
            description: "Your email has been verified successfully.",
          });
          
          // Start onboarding flow first, then navigate after state propagates
          setTimeout(() => {
            startOnboarding();
          }, 1500);
          
          setTimeout(() => {
            navigate('/listings', { replace: true });
          }, 1700);
        } else {
          setErrorMessage("Verification failed. Please try again.");
          setStep('error');
        }
      } catch (err: any) {
        console.error('[VerifyEmail] Exception:', err);
        setErrorMessage("Verification failed. Please try again.");
        setStep('error');
      }
    };

    verifyEmail();
  }, [navigate, toast, startOnboarding]);

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
