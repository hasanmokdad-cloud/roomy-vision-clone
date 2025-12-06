/**
 * Password Breach Detection using Have I Been Pwned API
 * 
 * Uses k-anonymity model - only sends first 5 chars of SHA-1 hash
 * to protect password privacy while still checking against breaches.
 */

/**
 * Check if a password has been exposed in known data breaches
 * Uses the HIBP Range API with k-anonymity (only sends SHA-1 prefix)
 * 
 * @param password - The password to check
 * @returns Object with isBreached flag and breach count
 */
export async function checkPasswordBreach(password: string): Promise<{
  isBreached: boolean;
  breachCount: number;
}> {
  try {
    // Convert password to SHA-1 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // Split hash into prefix (5 chars) and suffix (rest)
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);
    
    // Query HIBP Range API with prefix only (k-anonymity)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Request padding to prevent response size analysis
      },
    });
    
    if (!response.ok) {
      console.warn('[password-breach-check] HIBP API error:', response.status);
      // Fail open - don't block signup if API is down
      return { isBreached: false, breachCount: 0 };
    }
    
    const text = await response.text();
    
    // Parse response - each line is "HASH_SUFFIX:COUNT"
    const lines = text.split('\n');
    
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      
      // Check if our password's suffix matches any breached hash
      if (hashSuffix && hashSuffix.trim().toUpperCase() === suffix) {
        const count = parseInt(countStr.trim(), 10) || 0;
        console.log('[password-breach-check] Password found in breaches:', count, 'times');
        return { isBreached: true, breachCount: count };
      }
    }
    
    // Password not found in breach database
    return { isBreached: false, breachCount: 0 };
    
  } catch (error) {
    console.error('[password-breach-check] Error checking password:', error);
    // Fail open - don't block user actions if check fails
    return { isBreached: false, breachCount: 0 };
  }
}

/**
 * Hash email for privacy-preserving logging
 */
export async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
