/**
 * Whish Payment API Utilities
 * Mock functions for Whish integration - will be replaced with real API calls
 */

export interface CardDetails {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvv: string;
  country: string;
}

export interface TokenResult {
  success: boolean;
  token?: string;
  brand?: string;
  last4?: string;
  error?: string;
}

export interface PayoutResult {
  success: boolean;
  transactionId?: string;
  amount?: number;
  error?: string;
}

export interface PayoutRecord {
  id: string;
  amount: number;
  type: string;
  status: 'completed' | 'pending' | 'failed';
  transactionId: string;
  cardLast4: string;
  createdAt: string;
}

/**
 * Create a tokenized card for owner payouts
 * In production, this would call Whish API to securely tokenize card
 */
export async function createOwnerCardToken(cardDetails: CardDetails): Promise<TokenResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock token generation
  const mockToken = `whish_tok_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const last4 = cardDetails.cardNumber.replace(/\s/g, '').slice(-4);
  
  // Detect brand from card number
  const cardNum = cardDetails.cardNumber.replace(/\s/g, '');
  let brand = 'Unknown';
  if (cardNum.startsWith('4')) brand = 'Visa';
  else if (/^5[1-5]/.test(cardNum) || /^2[2-7]/.test(cardNum)) brand = 'MasterCard';
  else if (/^3[47]/.test(cardNum)) brand = 'Amex';
  else if (/^35/.test(cardNum)) brand = 'JCB';
  else if (/^6(?:011|5)/.test(cardNum)) brand = 'Discover';

  return {
    success: true,
    token: mockToken,
    brand,
    last4,
  };
}

/**
 * Delete an owner's stored card token
 * In production, this would call Whish API to remove the tokenized card
 */
export async function deleteOwnerCard(tokenId: string): Promise<boolean> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // In production, would call: DELETE /whish/v1/tokens/{tokenId}
  console.log('Mock: Deleting owner card token:', tokenId);
  
  return true;
}

/**
 * Send payout to owner's card
 * In production, this would initiate a Whish transfer to owner's card
 */
export async function sendOwnerPayout(
  ownerId: string, 
  amount: number,
  currency: string = 'USD'
): Promise<PayoutResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Mock transaction ID
  const transactionId = `whish_txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // In production, would call: POST /whish/v1/payouts
  console.log('Mock: Sending owner payout:', { ownerId, amount, currency });

  return {
    success: true,
    transactionId,
    amount,
  };
}

/**
 * Fetch owner's current balance
 * In production, this would query the owner's wallet balance from Whish
 */
export async function fetchOwnerBalance(ownerId: string): Promise<number> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  // In production, would call: GET /whish/v1/wallets/{ownerId}/balance
  // For now, return 0 - balance is stored in owner_payment_methods.balance
  console.log('Mock: Fetching owner balance:', ownerId);

  return 0;
}

/**
 * Fetch owner's payout history
 * In production, this would retrieve transaction history from Whish
 */
export async function fetchOwnerPayoutHistory(ownerId: string): Promise<PayoutRecord[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // In production, would call: GET /whish/v1/wallets/{ownerId}/transactions
  // For now, return empty - data comes from payout_history table
  console.log('Mock: Fetching owner payout history:', ownerId);

  return [];
}

/**
 * Create a checkout session for student payment
 * In production, this would create a Whish hosted checkout session
 */
export async function createCheckoutSession(params: {
  amount: number;
  currency: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));

  const sessionId = `whish_sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // In production, would call: POST /whish/v1/checkout/sessions
  console.log('Mock: Creating checkout session:', params);

  return {
    sessionId,
    checkoutUrl: `/mock-whish-checkout?sessionId=${sessionId}`,
  };
}

/**
 * Verify webhook signature from Whish
 * In production, this would verify the signature using HMAC-SHA256
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // In production, implement HMAC-SHA256 verification
  // For now, always return true in development
  console.log('Mock: Verifying webhook signature');
  return true;
}
