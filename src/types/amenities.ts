import { type LucideIcon } from 'lucide-react';

export interface AmenityWithOptions {
  id: string;
  label: string;
  icon: LucideIcon;
  hasOptions?: boolean;
  optionType?: 'electricity' | 'wifi' | 'cleaning' | 'water' | 'laundry';
}

export interface ElectricityOption {
  availability: '24/7' | 'limited';
  availabilityDetails?: string;
  included: 'yes' | 'no';
  billingInfo?: string;
}

export interface WiFiOption {
  included: 'yes' | 'no';
  billingInfo?: string;
}

export interface CleaningOption {
  frequency: 'once' | 'twice' | 'three' | 'other';
  customSchedule?: string;
}

export interface WaterOption {
  waterType: 'sweet' | 'salty';
  hotWater: '24/7' | 'other';
  hotWaterDetails?: string;
}

export interface LaundryOption {
  washingMachine: boolean;
  dryingMachine: boolean;
  billing: 'included' | 'per-use';
  washingCost?: string;
  dryingCost?: string;
}

export type AmenityOptionType = ElectricityOption | WiFiOption | CleaningOption | WaterOption | LaundryOption;

export interface AmenityDetails {
  electricity?: ElectricityOption;
  wifi?: WiFiOption;
  cleaning?: CleaningOption;
  water?: WaterOption;
  laundry?: LaundryOption;
}

export function formatElectricityOption(option: ElectricityOption): string {
  const avail = option.availability === '24/7' ? '24/7' : 'Limited';
  const bill = option.included === 'yes' ? 'Incl.' : 'Separate';
  return `${avail}, ${bill}`;
}

export function formatWiFiOption(option: WiFiOption): string {
  if (option.included === 'yes') return 'Included';
  return option.billingInfo || 'Not included';
}

export function formatCleaningOption(option: CleaningOption): string {
  switch (option.frequency) {
    case 'once': return 'Once per week';
    case 'twice': return 'Twice per week';
    case 'three': return 'Three times per week';
    case 'other': return option.customSchedule || 'Custom schedule';
  }
}

export function formatWaterOption(option: WaterOption): string {
  const type = option.waterType === 'sweet' ? 'Sweet' : 'Salty';
  const hot = option.hotWater === '24/7' ? 'Hot 24/7' : 'Custom';
  return `${type}, ${hot}`;
}

export function formatLaundryOption(option: LaundryOption): string {
  const machines = [];
  if (option.washingMachine) machines.push('Wash');
  if (option.dryingMachine) machines.push('Dry');
  const billing = option.billing === 'included' ? 'Incl.' : 'Per use';
  return `${machines.join('+')} (${billing})`;
}
