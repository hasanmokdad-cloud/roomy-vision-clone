import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FluidBackground from "@/components/FluidBackground";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const onLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Welcome back!", description: "Signed in successfully." });
    navigate("/intro", { replace: true });
  };

  const onSignup = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Account created", description: "Check your inbox to verify your email." });
    navigate("/intro", { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FluidBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="text-5xl font-extrabold">
              <span className="bg-gradient-to-r from-[#6b21a8] via-[#2563eb] to-[#10b981] bg-clip-text text-transparent">
                Roomy
              </span>
            </div>
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
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <Button onClick={onLogin} className="w-full bg-gradient-to-r from-[#6b21a8] via-[#2563eb] to-[#10b981] hover:opacity-90">
                  Sign in
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
                <Button onClick={onSignup} className="w-full bg-gradient-to-r from-[#6b21a8] via-[#2563eb] to-[#10b981] hover:opacity-90">
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
