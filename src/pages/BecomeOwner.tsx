import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MobileDormWizard } from '@/components/owner/mobile/MobileDormWizard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

export default function BecomeOwner() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { refreshAuth } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        // User is a student or has no role - they can proceed to fill the form
        // DO NOT upgrade role here - only after form submission
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndRole();
  }, [navigate, t]);

  // This function is called BEFORE dorm submission to create owner profile
  // Returns the new owner_id to be used for dorm creation
  const handleBeforeSubmit = async (): Promise<string | null> => {
    if (!user) return null;
    
    setIsSubmitting(true);
    
    try {
      // Step 1: Upgrade role from student to owner
      console.log('🔄 Upgrading role to owner...');
      const { error: roleError } = await supabase.functions.invoke('assign-role', {
        body: { chosen_role: 'owner' }
      });

      if (roleError) {
        console.error('Role upgrade error:', roleError);
        throw new Error('Failed to upgrade your account to owner');
      }
      console.log('✅ Role upgraded to owner');

      // Step 2: Check if owner profile already exists
      const { data: existingOwner } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingOwner) {
        console.log('✅ Owner profile already exists:', existingOwner.id);
        return existingOwner.id;
      }

      // Step 3: Create owner profile
      console.log('📝 Creating owner profile...');
      const { data: newOwner, error: ownerError } = await supabase
        .from('owners')
        .insert({
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        })
        .select('id')
        .single();

      if (ownerError) {
        console.error('Owner creation error:', ownerError);
        throw new Error('Failed to create owner profile');
      }
      
      console.log('✅ Owner profile created:', newOwner.id);
      return newOwner.id;
    } catch (error: any) {
      console.error('Error in become owner flow:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('becomeOwner.setupError', 'Failed to set up your owner account. Please try again.'),
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return null;
    }
  };

  const handleDormSaved = async () => {
    setIsSubmitting(false);
    toast({
      title: t('becomeOwner.success', 'Welcome to Roomy Owners!'),
      description: t('becomeOwner.successDesc', 'Your dorm has been submitted for verification. You can now access your owner dashboard.'),
    });

    // Refresh auth context to get new owner role
    await refreshAuth();
    
    // Small delay to ensure state propagates before navigation
    setTimeout(() => {
      navigate('/owner', { replace: true });
    }, 100);
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {t('becomeOwner.signInRequired', 'Please sign in to become an owner.')}
          </p>
          <Button onClick={() => navigate('/auth?redirect=/become-owner')}>
            {t('buttons.signIn', 'Sign In')}
          </Button>
        </div>
      </div>
    );
  }

  // Show the guided wizard for both mobile and desktop
  return (
    <MobileDormWizard
      onBeforeSubmit={handleBeforeSubmit}
      onSaved={handleDormSaved}
      isSubmitting={isSubmitting}
    />
  );
}
