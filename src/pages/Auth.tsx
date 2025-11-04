import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { FluidBackground } from '@/components/FluidBackground';

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255);
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(100);

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: owner } = await supabase
          .from('owners')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        navigate(owner ? '/admin' : '/dashboard');
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: owner } = await supabase
          .from('owners')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        navigate(owner ? '/admin' : '/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (!isLogin && !name.trim()) {
      newErrors.name = "Name is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createOwnerRecordForLAU = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('create-owner-record', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error creating owner record:', error);
        return;
      }

      // Show success toast only if owner record was newly created
      if (data?.success && data?.message === 'Owner record created successfully') {
        toast({
          title: "Admin Access Granted",
          description: "You are now registered as a verified Roomy Owner.",
        });
      }
    } catch (error) {
      console.error('Error invoking create-owner-record:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;

        // Check if LAU domain user and create owner record
        if (email.endsWith('@lau.edu')) {
          await createOwnerRecordForLAU();
        }
        
        toast({
          title: "Welcome back!",
          description: "Successfully logged in.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: name.trim(),
            }
          }
        });
        
        if (error) throw error;

        // Check if LAU domain user and create owner record
        if (email.endsWith('@lau.edu')) {
          // Wait a bit for the user to be created
          setTimeout(async () => {
            await createOwnerRecordForLAU();
          }, 1000);
        }
        
        toast({
          title: "Account created!",
          description: "Welcome to Roomy!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6">
      <FluidBackground />
      
      <Button
        variant="ghost"
        className="absolute top-6 left-6 z-10"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md glass rounded-3xl p-8 relative z-10"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-purple">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-bold gradient-text">Roomy</span>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">
          {isLogin ? 'Welcome Back' : 'Join Roomy'}
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          {isLogin ? 'Sign in to find your perfect dorm' : 'Start your journey to the perfect dorm'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>
          )}

          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                disabled={loading}
              />
            </div>
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                disabled={loading}
              />
            </div>
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-secondary"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
