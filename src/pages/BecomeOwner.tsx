import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import { DormForm } from '@/components/owner/DormForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Footer from '@/components/shared/Footer';
import { useTranslation } from 'react-i18next';

export default function BecomeOwner() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Not logged in, redirect to auth with redirect back
          navigate('/auth?redirect=/become-owner', { replace: true });
          return;
        }

        setUser(session.user);

        // Check current role
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const currentRole = (roleRow?.roles as any)?.name;

        // If already an owner, redirect to control panel
        if (currentRole === 'owner') {
          navigate('/owner', { replace: true });
          return;
        }
        if (currentRole === 'admin') {
          navigate('/admin', { replace: true });
          return;
        }

        // For students or users without role, upgrade to owner and create owner profile
        try {
          // Upgrade role from student to owner
          const { error: roleError } = await supabase.functions.invoke('assign-role', {
            body: { chosen_role: 'owner' }
          });

          if (roleError) {
            console.error('Role upgrade error:', roleError);
          }

          // Check if owner profile exists
          const { data: existingOwner } = await supabase
            .from('owners')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (existingOwner) {
            setOwnerId(existingOwner.id);
          } else {
            // Create owner profile
            const { data: newOwner, error: ownerError } = await supabase
              .from('owners')
              .insert({
                user_id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              })
              .select('id')
              .single();

            if (ownerError) {
              console.error('Owner creation error:', ownerError);
              throw ownerError;
            }
            setOwnerId(newOwner.id);
          }
        } catch (error) {
          console.error('Error setting up owner:', error);
          toast({
            title: t('common.error', 'Error'),
            description: t('becomeOwner.setupError', 'Failed to set up your owner account. Please try again.'),
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndRole();
  }, [navigate, t]);

  const handleDormSaved = () => {
    toast({
      title: t('becomeOwner.success', 'Welcome to Roomy Owners!'),
      description: t('becomeOwner.successDesc', 'Your dorm has been submitted for verification. You can now access your owner dashboard.'),
    });

    // Navigate to owner dashboard
    navigate('/owner', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">
          {t('common.loading', 'Loading...')}
        </div>
      </div>
    );
  }

  if (!ownerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {t('becomeOwner.setupError', 'Failed to set up your owner account. Please try again.')}
          </p>
          <Button onClick={() => navigate('/listings')}>
            {t('buttons.backToListings', 'Back to Listings')}
          </Button>
        </div>
      </div>
    );
  }

  const benefits = [
    t('becomeOwner.benefit1', 'Reach thousands of students looking for housing'),
    t('becomeOwner.benefit2', 'Easy-to-use dashboard to manage your listings'),
    t('becomeOwner.benefit3', 'AI-powered matching to find ideal tenants'),
    t('becomeOwner.benefit4', 'Secure payment processing with Roomy'),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <RoomyNavbar />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/listings')}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('buttons.backToListings', 'Back to Listings')}
          </Button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {t('becomeOwner.title', 'Become a Roomy Owner')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('becomeOwner.subtitle', 'List your dorm and connect with students looking for housing. Get started by filling out the form below.')}
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10"
          >
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border"
              >
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm text-foreground">{benefit}</span>
              </div>
            ))}
          </motion.div>

          {/* Dorm Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-8"
          >
            <h2 className="text-xl font-semibold mb-6">
              {t('becomeOwner.formTitle', 'Add Your First Dorm')}
            </h2>
            <DormForm 
              ownerId={ownerId}
              onSaved={handleDormSaved}
            />
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
