import { type LucideIcon } from 'lucide-react';

export interface AmenityWithOptions {
  id: string;
  label: string;
  icon: LucideIcon;
  hasOptions?: boolean;
  optionType?: 'electricity' | 'cleaning' | 'tv';
}

export interface ElectricityOption {
  type: '24/7' | 'other';
  customSchedule?: string; // For "Other" option
}

export interface TVOption {
  type: '24/7' | 'other';
  customSchedule?: string; // For "Other" option
}

export interface CleaningOption {
  frequency: 'once' | 'twice' | 'three' | 'other';
  customSchedule?: string; // For "Other" option
}

export type AmenityOptionType = ElectricityOption | TVOption | CleaningOption;

export interface AmenityDetails {
  electricity?: ElectricityOption;
  tv?: TVOption;
  cleaning?: CleaningOption;
}

export function formatElectricityOption(option: ElectricityOption): string {
  if (option.type === '24/7') return '24/7';
  return option.customSchedule || 'Custom schedule';
}

export function formatTVOption(option: TVOption): string {
  if (option.type === '24/7') return '24/7';
  return option.customSchedule || 'Custom schedule';
}

export function formatCleaningOption(option: CleaningOption): string {
  switch (option.frequency) {
    case 'once': return 'Once per week';
    case 'twice': return 'Twice per week';
    case 'three': return 'Three times per week';
    case 'other': return option.customSchedule || 'Custom schedule';
  }
}
