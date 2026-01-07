/**
 * Apartment Building type definitions for the /become-owner wizard
 */

export interface WizardBedroomData {
  id: string;
  apartmentId: string;
  name: string;
  bedType: 'single' | 'double' | 'master';
  baseCapacity: number;
  maxCapacity: number;
  allowExtraBeds: boolean;
  pricingMode: 'per_bed' | 'per_bedroom' | 'both';
  bedroomPrice?: number;
  bedroomDeposit?: number;
  bedPrice?: number;
  bedDeposit?: number;
  images: string[];
}

export interface ApartmentPricingTier {
  capacity: number;
  monthlyPrice: number;
  deposit: number;
}

export interface WizardApartmentData {
  id: string;
  name: string;
  type: string;
  maxCapacity: number;
  enabledCapacities: number[];
  enableTieredPricing: boolean;
  pricingTiers: ApartmentPricingTier[];
  bedroomCount: number;
  bedrooms: WizardBedroomData[];
  images: string[];
  videoUrl: string | null;
}

// Apartment types for categorization
export const APARTMENT_TYPES = [
  { value: 'small', label: 'Small Apartment' },
  { value: 'medium', label: 'Medium Apartment' },
  { value: 'large', label: 'Large Apartment' },
  { value: 'studio', label: 'Studio' },
  { value: 'penthouse', label: 'Penthouse' },
] as const;

export type ApartmentType = typeof APARTMENT_TYPES[number]['value'];

// Bed types
export const BED_TYPES = [
  { value: 'single', label: 'Single Bed', defaultCapacity: 1 },
  { value: 'double', label: 'Double Bed', defaultCapacity: 2 },
  { value: 'master', label: 'Master Bed', defaultCapacity: 2 },
] as const;

export type BedType = typeof BED_TYPES[number]['value'];

// Pricing modes
export const PRICING_MODES = [
  { value: 'per_bed', label: 'Per Bed', description: 'Price each bed individually' },
  { value: 'per_bedroom', label: 'Per Bedroom', description: 'Price the whole bedroom' },
  { value: 'both', label: 'Both Options', description: 'Offer both pricing options' },
] as const;

export type PricingMode = typeof PRICING_MODES[number]['value'];

// Helper to create empty apartment
export function createEmptyApartment(index: number): WizardApartmentData {
  return {
    id: crypto.randomUUID(),
    name: `A${index + 1}`,
    type: 'medium',
    maxCapacity: 4,
    enabledCapacities: [1, 2, 3, 4],
    enableTieredPricing: false,
    pricingTiers: [],
    bedroomCount: 2,
    bedrooms: [],
    images: [],
    videoUrl: null,
  };
}

// Helper to create empty bedroom
export function createEmptyBedroom(apartmentId: string, index: number): WizardBedroomData {
  return {
    id: crypto.randomUUID(),
    apartmentId,
    name: `Bedroom ${index + 1}`,
    bedType: 'single',
    baseCapacity: 1,
    maxCapacity: 1,
    allowExtraBeds: false,
    pricingMode: 'per_bedroom',
    images: [],
  };
}
