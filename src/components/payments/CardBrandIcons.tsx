import { CreditCard } from 'lucide-react';

interface CardBrandIconsProps {
  detectedBrand?: string;
  size?: 'sm' | 'md';
}

const CARD_BRANDS = [
  { id: 'visa', name: 'Visa', color: '#1A1F71' },
  { id: 'mastercard', name: 'MasterCard', color: '#EB001B' },
  { id: 'amex', name: 'Amex', color: '#006FCF' },
  { id: 'discover', name: 'Discover', color: '#FF6000' },
  { id: 'jcb', name: 'JCB', color: '#0B4EA2' },
];

export function CardBrandIcons({ detectedBrand, size = 'md' }: CardBrandIconsProps) {
  const iconSize = size === 'sm' ? 'h-6 w-10' : 'h-8 w-12';
  
  return (
    <div className="flex items-center gap-2">
      {CARD_BRANDS.map((brand) => (
        <div
          key={brand.id}
          className={`${iconSize} rounded flex items-center justify-center text-xs font-bold transition-all ${
            detectedBrand
              ? detectedBrand === brand.id
                ? 'opacity-100 ring-2 ring-primary scale-110'
                : 'opacity-30 grayscale'
              : 'opacity-60'
          }`}
          style={{ 
            backgroundColor: brand.id === detectedBrand ? `${brand.color}20` : 'transparent',
            border: `1px solid ${detectedBrand === brand.id ? brand.color : '#e5e7eb'}`
          }}
        >
          <span style={{ color: brand.color }}>{brand.name.substring(0, 2)}</span>
        </div>
      ))}
    </div>
  );
}

// Card brand detection based on card number
export function detectCardBrand(cardNumber: string): string | undefined {
  const number = cardNumber.replace(/\s/g, '');
  
  // Visa: starts with 4
  if (/^4/.test(number)) return 'visa';
  
  // MasterCard: starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard';
  
  // Amex: starts with 34 or 37
  if (/^3[47]/.test(number)) return 'amex';
  
  // Discover: starts with 6011, 644-649, or 65
  if (/^6(?:011|4[4-9]|5)/.test(number)) return 'discover';
  
  // JCB: starts with 35
  if (/^35/.test(number)) return 'jcb';
  
  return undefined;
}

// Luhn algorithm for card number validation
export function validateCardNumber(cardNumber: string): boolean {
  const number = cardNumber.replace(/\s/g, '');
  
  if (!/^\d{13,19}$/.test(number)) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// Format card number with spaces
export function formatCardNumber(value: string): string {
  const number = value.replace(/\D/g, '');
  const brand = detectCardBrand(number);
  
  // Amex uses 4-6-5 format
  if (brand === 'amex') {
    const parts = [
      number.substring(0, 4),
      number.substring(4, 10),
      number.substring(10, 15),
    ].filter(Boolean);
    return parts.join(' ');
  }
  
  // Default 4-4-4-4 format
  const parts = [];
  for (let i = 0; i < number.length && i < 16; i += 4) {
    parts.push(number.substring(i, i + 4));
  }
  return parts.join(' ');
}

// Get CVV length based on card brand
export function getCvvLength(brand?: string): number {
  return brand === 'amex' ? 4 : 3;
}
