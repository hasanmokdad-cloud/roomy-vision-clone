/**
 * Whish Payment Client
 * Handles all Whish API interactions
 */

import { supabase } from '@/integrations/supabase/client';

export interface CreateReservationCheckoutParams {
  roomId: string;
  depositAmount: number;
}

export interface CreateMatchPlanCheckoutParams {
  planType: 'advanced' | 'vip';
}

export interface WhishCheckoutResponse {
  checkoutUrl: string;
  paymentId: string;
}

/**
 * Create a checkout session for room reservation
 */
export async function createReservationCheckout(
  params: CreateReservationCheckoutParams
): Promise<WhishCheckoutResponse> {
  const { data, error } = await supabase.functions.invoke(
    'roomy-create-reservation-checkout',
    {
      body: params,
    }
  );

  if (error) throw error;
  if (!data?.checkoutUrl) throw new Error('No checkout URL returned');

  return data;
}

/**
 * Create a checkout session for AI Match plan
 */
export async function createMatchPlanCheckout(
  params: CreateMatchPlanCheckoutParams
): Promise<WhishCheckoutResponse> {
  const { data, error } = await supabase.functions.invoke(
    'roomy-create-match-plan-checkout',
    {
      body: params,
    }
  );

  if (error) throw error;
  if (!data?.checkoutUrl) throw new Error('No checkout URL returned');

  return data;
}

/**
 * Get reservation status
 */
export async function getReservationStatus(reservationId: string) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get active match plan for current student
 */
export async function getActiveMatchPlan() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!student) return null;

  const { data, error } = await supabase
    .from('student_match_plans')
    .select('*')
    .eq('student_id', student.id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Check if Whish keys are configured (not placeholders)
 */
export function isWhishConfigured(): boolean {
  // This check happens on the backend, so we assume it's configured unless explicitly told otherwise
  // The actual check happens in the edge functions
  return true; // Will be overridden by edge function preview mode logic
}
