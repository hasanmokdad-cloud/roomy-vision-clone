import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import FluidBackground from "@/components/FluidBackground";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateDeviceFingerprint, getApproximateRegion } from "@/utils/deviceFingerprint";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle mode param from redirects (e.g., after email verification)
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'login') {
      setTab('login');
    }
  }, [searchParams]);

  const onLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast({ 
            title: "Email not verified", 
            description: "Please check your email and click the verification link before signing in.",
            variant: "destructive" 
          });
          return;
        }
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
        return;
      }

      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        toast({ 
          title: "Email not verified", 
          description: "Please verify your email before signing in.",
          variant: "destructive" 
        });
        return;
      }

      // Device verification check
      const deviceInfo = await generateDeviceFingerprint();
      const ipRegion = getApproximateRegion();

      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke("verify-device", {
        body: {
          userId: data.user.id,
          fingerprintHash: deviceInfo.fingerprintHash,
          deviceName: deviceInfo.deviceName,
          browserName: deviceInfo.browserName,
          browserVersion: deviceInfo.browserVersion,
          osName: deviceInfo.osName,
          osVersion: deviceInfo.osVersion,
          deviceType: deviceInfo.deviceType,
          ipRegion
        }
      });

      if (verifyError) {
        console.error("Device verify error:", verifyError);
        // Continue with login on error (fail open for UX)
        toast({ title: "Welcome back!", description: "Signed in successfully." });
        navigate("/intro", { replace: true });
        return;
      }

      if (verifyResult?.rateLimited) {
        await supabase.auth.signOut();
        toast({ 
          title: "Too many attempts", 
          description: "Please try again later.",
          variant: "destructive" 
        });
        return;
      }

      if (verifyResult?.needsVerification) {
        await supabase.auth.signOut();
        navigate("/auth/device-pending", { state: { email } });
        return;
      }

      toast({ title: "Welcome back!", description: "Signed in successfully." });
      navigate("/intro", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `https://roomylb.com/auth/verify`,
      },
    });
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }
    // Redirect to check email page
    navigate(`/auth/check-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FluidBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <img 
              src="/roomy-logo.png" 
              alt="Roomy Logo" 
              className="h-28 w-28 mx-auto mb-4"
            />
            <CardTitle className="text-2xl">Welcome to Roomy</CardTitle>
            <CardDescription>Sign in or create an account to find your perfect student housing</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link 
                      to="/password-reset" 
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <Button onClick={onLogin} disabled={isLoading} className="w-full bg-gradient-to-r from-[#00E0FF] to-[#BD00FF] hover:opacity-90">
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Password</Label>
                  <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <Button onClick={onSignup} className="w-full bg-gradient-to-r from-[#00E0FF] to-[#BD00FF] hover:opacity-90">
                  Create account
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
