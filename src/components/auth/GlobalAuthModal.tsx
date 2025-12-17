import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Mail, Lock, Eye, EyeOff, X } from 'lucide-react';
import { checkPasswordBreach } from '@/utils/passwordBreachCheck';
import { useIsMobile } from '@/hooks/use-mobile';

export function GlobalAuthModal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authModalOpen, closeAuthModal, refreshAuth } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // Fetch role for redirect
      const { data: roleData } = await supabase.rpc('get_user_role', {
        p_user_id: data.user!.id
      });

      toast({ title: 'Welcome back!', description: 'You have been signed in successfully.' });
      resetForm();
      closeAuthModal();
      await refreshAuth();
      
      // Role-based redirect
      if (roleData === 'owner') {
        navigate('/owner', { replace: true });
      } else if (roleData === 'admin') {
        navigate('/admin', { replace: true });
      }
      // Students stay on current page
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      // Check for breached passwords
      const breachResult = await checkPasswordBreach(password);
      if (breachResult.isBreached) {
        throw new Error(
          `This password has been found in ${breachResult.breachCount.toLocaleString()} data breaches. Please choose a different password.`
        );
      }

      // Sign up user - auto-confirm is enabled, we send our own verification email
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // Send custom Roomy-branded verification email
      if (data.user) {
        const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
          body: {
            userId: data.user.id,
            email: email.trim(),
            tokenType: 'signup'
          }
        });

        if (emailError) {
          console.error('[GlobalAuthModal] Failed to send verification email:', emailError);
          // Don't throw - user is created, just notify them
        }
      }

      // Clear any previous onboarding state for fresh signup experience
      localStorage.removeItem('roomy_onboarding_complete');

      toast({
        title: 'Check your email',
        description: 'We sent you a verification link from security@roomylb.com',
      });
      
      resetForm();
      closeAuthModal();
      navigate(`/auth/check-email?email=${encodeURIComponent(email.trim())}`);
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const authFormContent = (
    <>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')} className="mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="mt-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="login-password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => {
                    closeAuthModal();
                    navigate('/password-reset');
                  }}
                >
                  Forgot password?
                </Button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Sign In
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="mt-4">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  minLength={8}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-confirm">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signup-confirm"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Account
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By signing up, you agree to our{' '}
              <a href="/legal/terms" className="underline hover:text-foreground">Terms of Service</a>
              {' '}and{' '}
              <a href="/legal/privacy" className="underline hover:text-foreground">Privacy Policy</a>
            </p>
          </form>
        </TabsContent>
      </Tabs>
    </>
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeAuthModal();
    }
  };

  // Mobile: Use Drawer (slides up from bottom like Airbnb)
  if (isMobile) {
    return (
      <Drawer open={authModalOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="relative border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={closeAuthModal}
            >
              <X className="h-4 w-4" />
            </Button>
            <DrawerTitle className="text-xl font-bold text-center">
              {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
            </DrawerTitle>
            <DrawerDescription className="text-center">
              {activeTab === 'login' 
                ? 'Sign in to your Roomy account' 
                : 'Join Roomy to find your perfect dorm'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto">
            {authFormContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={authModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {activeTab === 'login' 
              ? 'Sign in to your Roomy account' 
              : 'Join Roomy to find your perfect dorm'}
          </DialogDescription>
        </DialogHeader>
        {authFormContent}
      </DialogContent>
    </Dialog>
  );
}