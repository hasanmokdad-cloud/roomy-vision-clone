import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import RoomyLogo from "@/assets/roomy-logo.png";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink } from "lucide-react";
import { RoomyNavbar } from "@/components/RoomyNavbar";
import Footer from "@/components/shared/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getEmailProviderInfo } from "@/utils/emailProvider";
import { useAuth } from "@/contexts/AuthContext";

export default function CheckEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const { isAuthenticated, isAuthReady } = useAuth();
  
  const email = searchParams.get('email') || '';
  const redirectUrl = searchParams.get('redirect_url');
  const providerInfo = getEmailProviderInfo(email);

  // Store redirect URL for post-verification if provided
  useEffect(() => {
    if (redirectUrl) {
      sessionStorage.setItem('roomy_auth_redirect', redirectUrl);
    }
  }, [redirectUrl]);

  // Auto-redirect when user becomes authenticated (verified in another tab)
  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      const storedRedirect = sessionStorage.getItem('roomy_auth_redirect');
      sessionStorage.removeItem('roomy_auth_redirect');
      navigate(storedRedirect || '/listings', { replace: true });
    }
  }, [isAuthReady, isAuthenticated, navigate]);

  // Listen for visibility changes to check auth when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const storedRedirect = sessionStorage.getItem('roomy_auth_redirect');
          sessionStorage.removeItem('roomy_auth_redirect');
          navigate(storedRedirect || '/listings', { replace: true });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [navigate]);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: {
          email: email,
          tokenType: 'signup'
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Email sent",
        description: "We've sent you another verification email.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleOpenProvider = () => {
    if (providerInfo?.url) {
      window.open(providerInfo.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <RoomyNavbar />
      
      <main className="flex-1 flex items-center justify-center p-4 mt-20">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardContent className="pt-8 pb-8 px-6 text-center space-y-6">
            {/* Logo */}
            <img 
              src={RoomyLogo} 
              alt="Roomy Logo" 
              className="h-24 w-24 mx-auto mb-4 drop-shadow-lg"
            />
            
            {/* Mail Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-10 h-10 text-primary" />
              </div>
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Check your inbox</h1>
              <p className="text-muted-foreground">
                Click the link we sent to{' '}
                <span className="font-medium text-foreground">{email}</span>{' '}
                to finish your account setup.
              </p>
            </div>
            
            {/* Smart Email Provider Button */}
            {providerInfo && (
              <Button
                onClick={handleOpenProvider}
                className="w-full bg-gradient-to-r from-[#00E0FF] to-[#BD00FF] hover:opacity-90 text-white gap-2"
                size="lg"
              >
                {providerInfo.label}
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            
            {/* Resend Link */}
            <div className="text-sm text-muted-foreground">
              Didn't receive an email?{' '}
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="text-primary hover:underline font-medium disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend email'}
              </button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
