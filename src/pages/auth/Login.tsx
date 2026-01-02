import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { checkPasswordBreach } from '@/utils/passwordBreachCheck';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, isAuthReady, refreshAuth } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Store redirect URL in sessionStorage on mount
  useEffect(() => {
    const redirectUrl = searchParams.get('redirect_url');
    if (redirectUrl) {
      sessionStorage.setItem('roomy_auth_redirect', redirectUrl);
    }
  }, [searchParams]);

  // If already authenticated, redirect to intended destination or home
  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      const storedRedirect = sessionStorage.getItem('roomy_auth_redirect');
      sessionStorage.removeItem('roomy_auth_redirect');
      navigate(storedRedirect || '/listings', { replace: true });
    }
  }, [isAuthReady, isAuthenticated, navigate]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAgreedToTerms(false);
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
      await refreshAuth();
      
      // Check for stored redirect URL first
      const storedRedirect = sessionStorage.getItem('roomy_auth_redirect');
      sessionStorage.removeItem('roomy_auth_redirect');
      
      if (storedRedirect) {
        navigate(storedRedirect, { replace: true });
      } else if (roleData === 'owner') {
        navigate('/owner', { replace: true });
      } else if (roleData === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/listings', { replace: true });
      }
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

      // Sign up user
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // Create student profile and assign role
      if (data.user) {
        const { error: studentError } = await supabase.from('students').upsert({
          user_id: data.user.id,
          email: email.trim(),
          full_name: email.trim().split('@')[0],
        }, { onConflict: 'user_id' });

        if (studentError) {
          console.error('[Login] Failed to create student profile:', studentError);
        }

        const { error: roleError } = await supabase.rpc('assign_student_role', { 
          p_user_id: data.user.id 
        });

        if (roleError) {
          console.error('[Login] Failed to assign student role:', roleError);
        }

        // Send verification email
        const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
          body: {
            userId: data.user.id,
            email: email.trim(),
            tokenType: 'signup'
          }
        });

        if (emailError) {
          console.error('[Login] Failed to send verification email:', emailError);
          toast({
            title: 'Account created',
            description: 'Verification email may be delayed. Check spam or resend from the next page.',
          });
        }
      }

      localStorage.removeItem('roomy_onboarding_complete');

      toast({
        title: 'Check your email',
        description: 'We sent you a verification link from security@roomylb.com',
      });
      
      resetForm();
      
      // Pass redirect_url to check-email page
      const storedRedirect = sessionStorage.getItem('roomy_auth_redirect');
      const checkEmailUrl = storedRedirect 
        ? `/auth/check-email?email=${encodeURIComponent(email.trim())}&redirect_url=${encodeURIComponent(storedRedirect)}`
        : `/auth/check-email?email=${encodeURIComponent(email.trim())}`;
      
      navigate(checkEmailUrl);
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <RoomyNavbar />
      
      <main className="flex-1 flex items-center justify-center p-4 mt-20">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">
              {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'login' 
                ? 'Sign in to your Roomy account' 
                : 'Join Roomy to find your perfect dorm'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')} className="mt-2">
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
                        onClick={() => navigate('/password-reset')}
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

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms-checkbox"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      required
                      className="mt-0.5"
                    />
                    <Label htmlFor="terms-checkbox" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                      I agree to the{' '}
                      <Link 
                        to="/legal/terms" 
                        className="underline hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link 
                        to="/legal/privacy" 
                        className="underline hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || !agreedToTerms}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Create Account
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By signing up, you agree to the{' '}
                    <Link to="/legal/terms" className="underline hover:text-foreground">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/legal/payments" className="underline hover:text-foreground">Payments Disclaimer</Link>.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
