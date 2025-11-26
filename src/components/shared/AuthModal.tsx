import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { sanitizeInput } from "@/utils/inputValidation";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72);

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [signUpData, setSignUpData] = useState({ email: '', password: '', confirmPassword: '' });
  const [signInData, setSignInData] = useState({ email: '', password: '' });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: signUpData.email,
      password: signUpData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      }
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success!',
        description: 'Account created successfully',
      });
      
      // Create student profile - will be done via trigger or user can complete later
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('students').upsert({
          user_id: user.id,
          email: signUpData.email,
          full_name: signUpData.email.split('@')[0],
        }, { onConflict: 'user_id' });
      }

      onOpenChange(false);
      setSignUpData({ email: '', password: '', confirmPassword: '' });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: signInData.email,
      password: signInData.password,
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'Sign In Failed',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'Signed in successfully',
      });
      onOpenChange(false);
      setSignInData({ email: '', password: '' });
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-description"
      >
        <DialogHeader>
          <DialogTitle id="auth-modal-title" className="text-2xl gradient-text">
            Welcome to Roomy
          </DialogTitle>
          <DialogDescription id="auth-modal-description">
            Sign in or create an account to get started
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2" role="tablist" aria-label="Authentication options">
            <TabsTrigger value="signin" role="tab" aria-controls="signin-panel">
              Log In
            </TabsTrigger>
            <TabsTrigger value="signup" role="tab" aria-controls="signup-panel">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" id="signin-panel" role="tabpanel" aria-labelledby="signin-tab">
            <form onSubmit={handleSignIn} className="space-y-4" aria-label="Sign in form">
              <div>
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  required
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                  className="bg-black/20 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  required
                  value={signInData.password}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                  className="bg-black/20 border-white/10"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-secondary"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" id="signup-panel" role="tabpanel" aria-labelledby="signup-tab">
            <form onSubmit={handleSignUp} className="space-y-4" aria-label="Sign up form">
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  required
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  className="bg-black/20 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  required
                  value={signUpData.password}
                  onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                  className="bg-black/20 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="signup-confirm">Confirm Password</Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  required
                  value={signUpData.confirmPassword}
                  onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                  className="bg-black/20 border-white/10"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-secondary"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
