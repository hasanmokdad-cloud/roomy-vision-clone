/**
 * Security Utilities - Input Validation and Sanitization
 * Used across all forms to prevent injection attacks
 */

export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML and script tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove SQL keywords (case insensitive)
  const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b/gi;
  sanitized = sanitized.replace(sqlKeywords, '');
  
  // Remove javascript: and data: protocols
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+=/gi, '');
  
  // Escape special characters
  sanitized = sanitized.replace(/[<>]/g, '');
  
  return sanitized.trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

export const validatePhone = (phone: string): boolean => {
  // Allow international format with flexible digit groups separated by spaces/dashes/dots
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?([-\s\.]?[0-9]+)*$/;
  return phoneRegex.test(phone) && phone.length <= 20;
};

export const validateName = (name: string): boolean => {
  // Allow letters, spaces, hyphens, and apostrophes only
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  return nameRegex.test(name) && name.length >= 2 && name.length <= 100;
};

export const validateMessage = (message: string): { valid: boolean; error?: string } => {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (message.length > 500) {
    return { valid: false, error: 'Message must be less than 500 characters' };
  }
  
  const sanitized = sanitizeInput(message);
  if (sanitized.length === 0) {
    return { valid: false, error: 'Message contains invalid characters' };
  }
  
  return { valid: true };
};

export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Safely encode data for use in WhatsApp URLs
 */
export const encodeForWhatsApp = (text: string): string => {
  const sanitized = sanitizeInput(text);
  return encodeURIComponent(sanitized.substring(0, 200)); // Limit WhatsApp message length
};
