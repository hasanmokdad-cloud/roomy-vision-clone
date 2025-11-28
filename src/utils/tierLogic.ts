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
