/**
 * Payment Configuration
 * Constants for Whish payment integration
 */

// Commission percentage (10% of deposit)
export const COMMISSION_PERCENT = 0.10;

// Helper to calculate total due (deposit + commission)
export const calculateTotalDue = (depositAmount: number) => {
  const commission = depositAmount * COMMISSION_PERCENT;
  return {
    deposit: depositAmount,
    commission,
    total: depositAmount + commission, // deposit × 1.10
  };
};

// AI Match plan pricing (in USD)
export const MATCH_PLAN_PRICES = {
  basic: 0,
  advanced: 4.99,
  vip: 9.99,
} as const;

// Plan duration in days
export const PLAN_DURATION_DAYS = 30;

// Whish configuration (will use secrets in edge functions)
export const WHISH_CONFIG = {
  // These are placeholders - actual values come from Supabase secrets
  publicKey: import.meta.env.VITE_WHISH_PUBLIC_KEY || '',
  // API base URL (if needed, adjust based on Whish docs)
  apiBaseUrl: 'https://api.whish.com/v1', // Placeholder - update based on actual Whish API
} as const;

export type AiMatchPlan = keyof typeof MATCH_PLAN_PRICES;
export type ReservationStatus = 'pending_payment' | 'paid' | 'cancelled' | 'expired';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
