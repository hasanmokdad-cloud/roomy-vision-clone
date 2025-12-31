import { type LucideIcon } from 'lucide-react';

export interface AmenityWithOptions {
  id: string;
  label: string;
  icon: LucideIcon;
  hasOptions?: boolean;
  optionType?: 'electricity' | 'wifi' | 'cleaning';
}

export interface ElectricityOption {
  included: 'yes' | 'no';
  billingInfo?: string; // How students are charged if not included
}

export interface WiFiOption {
  included: 'yes' | 'no';
  billingInfo?: string; // e.g., "$20/month subscription"
}

export interface CleaningOption {
  frequency: 'once' | 'twice' | 'three' | 'other';
  customSchedule?: string; // For "Other" option
}

export type AmenityOptionType = ElectricityOption | WiFiOption | CleaningOption;

export interface AmenityDetails {
  electricity?: ElectricityOption;
  wifi?: WiFiOption;
  cleaning?: CleaningOption;
}

export function formatElectricityOption(option: ElectricityOption): string {
  if (option.included === 'yes') return 'Included';
  return option.billingInfo || 'Not included';
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
