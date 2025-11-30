import { supabase } from '@/integrations/supabase/client';
import { PLAN_DURATION_DAYS } from '@/lib/payments/config';

export type AiMatchPlan = 'basic' | 'advanced' | 'vip';

/**
 * Get the maximum number of roommate matches based on tier
 */
export const getMatchLimit = (plan: AiMatchPlan): number => {
  switch (plan) {
    case 'basic': 
      return 1;
    case 'advanced': 
      return 3;
    case 'vip': 
      return Infinity;
    default: 
      return 1;
  }
};

/**
 * Check if personality/compatibility matching should be used
 * Basic tier = random matches only
 */
export const shouldUsePersonalityMatching = (plan: AiMatchPlan): boolean => {
  return plan === 'advanced' || plan === 'vip';
};

/**
 * Check if compatibility scores should be displayed
 */
export const shouldShowCompatibilityScore = (plan: AiMatchPlan): boolean => {
  return plan === 'advanced' || plan === 'vip';
};

/**
 * Check if user has VIP tier
 */
export const isVipPlan = (plan: AiMatchPlan): boolean => {
  return plan === 'vip';
};

/**
 * Check if a plan has expired
 */
export const isPlanExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

/**
 * Get active plan for a student
 * Returns the highest tier active (non-expired) plan, or 'basic' as default
 */
export async function getActivePlan(studentId: string): Promise<AiMatchPlan> {
  try {
    const { data, error } = await supabase
      .from('student_match_plans')
      .select('plan_type, expires_at, status')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return 'basic';
    }

    return data.plan_type as AiMatchPlan;
  } catch (error) {
    console.error('Error fetching active plan:', error);
    return 'basic';
  }
}

/**
 * Shuffle array for random matching (used in basic tier)
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
