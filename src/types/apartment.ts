/**
 * Apartment Building type definitions for the /become-owner wizard
 * FLEX MODE: All capacity values are OWNER-DEFINED, never auto-derived from bed type
 */

export interface WizardBedData {
  id: string;
  bedroomId: string;
  label: string;
  bedType: string;              // DESCRIPTIVE ONLY - does NOT affect capacity
  capacityContribution: number; // Owner-defined, default 1
  monthlyPrice?: number;
  deposit?: number;
  available: boolean;
}

export interface WizardBedroomData {
  id: string;
  apartmentId: string;
  name: string;
  bedType: 'single' | 'double' | 'master' | 'king' | 'bunk';
  baseCapacity: number;         // OWNER-DEFINED - never inferred from bed type
  maxCapacity: number;          // OWNER-DEFINED
  allowExtraBeds: boolean;
  pricingMode: 'per_bed' | 'per_bedroom' | 'both';
  bedroomPrice?: number;
  bedroomDeposit?: number;
  bedPrice?: number;
  bedDeposit?: number;
  images: string[];
  beds: WizardBedData[];        // Individual beds for per_bed pricing mode
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
  // FLEX MODE reservation options
  enableFullApartmentReservation: boolean;
  enableBedroomReservation: boolean;
  enableBedReservation: boolean;
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

// Bed types - DESCRIPTIVE ONLY, no defaultCapacity
// Capacity is ALWAYS owner-defined
export const BED_TYPES = [
  { value: 'single', label: 'Single Bed' },
  { value: 'double', label: 'Double Bed' },
  { value: 'master', label: 'Master Bed' },
  { value: 'king', label: 'King Bed' },
  { value: 'bunk', label: 'Bunk Bed' },
] as const;

export type BedType = typeof BED_TYPES[number]['value'];

// Pricing modes
export const PRICING_MODES = [
  { value: 'per_bed', label: 'Per Bed', description: 'Price each bed individually' },
  { value: 'per_bedroom', label: 'Per Bedroom', description: 'Price the whole bedroom' },
  { value: 'both', label: 'Both Options', description: 'Offer both pricing options' },
] as const;

export type PricingMode = typeof PRICING_MODES[number]['value'];

// Helper to create empty apartment with FLEX MODE defaults
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
    // FLEX MODE defaults
    enableFullApartmentReservation: true,
    enableBedroomReservation: true,
    enableBedReservation: false,
  };
}

// Helper to create empty bedroom - capacity is NOT auto-derived
export function createEmptyBedroom(apartmentId: string, index: number): WizardBedroomData {
  return {
    id: crypto.randomUUID(),
    apartmentId,
    name: `Bedroom ${index + 1}`,
    bedType: 'single',          // Descriptive only
    baseCapacity: 1,            // Owner will set this explicitly
    maxCapacity: 1,             // Owner will set this explicitly
    allowExtraBeds: false,
    pricingMode: 'per_bedroom',
    images: [],
    beds: [],
  };
}

// Helper to create empty bed
export function createEmptyBed(bedroomId: string, index: number): WizardBedData {
  return {
    id: crypto.randomUUID(),
    bedroomId,
    label: `Bed ${String.fromCharCode(65 + index)}`, // Bed A, Bed B, etc.
    bedType: 'single',          // Descriptive only
    capacityContribution: 1,    // Owner-defined
    available: true,
  };
}
