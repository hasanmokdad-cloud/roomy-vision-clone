import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createMatchPlanCheckout } from '@/lib/payments/whishClient';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { AiMatchPlan } from '@/utils/tierLogic';

interface UseMatchTierOptions {
  studentId?: string;
  userId?: string;
  onTierChange?: (newTier: AiMatchPlan) => void;
}

export function useMatchTier({ studentId, userId, onTierChange }: UseMatchTierOptions = {}) {
  const [currentTier, setCurrentTier] = useState<AiMatchPlan>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch current tier on mount
  const fetchCurrentTier = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('students')
        .select('ai_match_plan')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      const plan = (data?.ai_match_plan || 'basic') as AiMatchPlan;
      setCurrentTier(plan);
    } catch (error) {
      console.error('Error fetching tier:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchCurrentTier();
  }, [fetchCurrentTier]);

  // Upgrade tier (triggers payment for paid tiers)
  const upgradeTier = useCallback(async (newTier: AiMatchPlan) => {
    if (newTier === 'basic') return;

    setIsLoading(true);
    try {
      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to upgrade your plan',
          variant: 'destructive',
        });
        navigate('/listings');
        return;
      }

      toast({
        title: 'Redirecting to payment...',
        description: `Upgrading to ${newTier} plan`,
      });

      // Create checkout session and redirect
      const { checkoutUrl } = await createMatchPlanCheckout({ planType: newTier });
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Upgrade failed',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, navigate]);

  // Downgrade tier (immediate in placeholder mode, scheduled in production)
  const downgradeTier = useCallback(async (newTier: AiMatchPlan) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // In placeholder mode, downgrade immediately
      const { error } = await supabase
        .from('students')
        .update({ ai_match_plan: newTier })
        .eq('user_id', userId);

      if (error) throw error;

      setCurrentTier(newTier);
      onTierChange?.(newTier);
      
      toast({
        title: 'Plan updated',
        description: `You've been downgraded to ${newTier}. Your matches will refresh.`,
      });
    } catch (error: any) {
      console.error('Downgrade error:', error);
      toast({
        title: 'Downgrade failed',
        description: error.message || 'Failed to downgrade plan',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, onTierChange, toast]);

  // Update tier directly (for internal use after payment success)
  const setTier = useCallback(async (newTier: AiMatchPlan) => {
    if (!userId) return;

    try {
      await supabase
        .from('students')
        .update({ ai_match_plan: newTier })
        .eq('user_id', userId);

      setCurrentTier(newTier);
      onTierChange?.(newTier);
    } catch (error) {
      console.error('Error setting tier:', error);
    }
  }, [userId, onTierChange]);

  return {
    currentTier,
    isLoading,
    upgradeTier,
    downgradeTier,
    setTier,
    refetch: fetchCurrentTier
  };
}
