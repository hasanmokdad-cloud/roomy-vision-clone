import { LucideProps } from 'lucide-react';

type AmenityType = 
  | 'wifi' 
  | 'ac' 
  | 'laundry' 
  | 'parking' 
  | 'kitchen' 
  | 'study' 
  | 'security' 
  | 'furnished' 
  | 'balcony' 
  | 'gym'
  | 'elevator'
  | 'heating'
  | 'cleaning';

interface AmenityIconProps extends Omit<LucideProps, 'ref'> {
  name: AmenityType;
}

const amenityIcons: Record<AmenityType, React.FC<LucideProps>> = {
  wifi: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" />
    </svg>
  ),
  ac: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M7 13v6" />
      <path d="M12 13v6" />
      <path d="M17 13v6" />
    </svg>
  ),
  laundry: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="1" width="18" height="22" rx="2" />
      <circle cx="12" cy="14" r="5" />
      <path d="M7 3h2" />
      <path d="M15 3h2" />
    </svg>
  ),
  parking: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6h-4" />
    </svg>
  ),
  kitchen: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 2v20h18V2H3z" />
      <path d="M7 2v8" />
      <path d="M12 2v8" />
      <path d="M17 2v8" />
      <path d="M3 14h18" />
    </svg>
  ),
  study: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  security: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  furnished: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9v12h18V9" />
      <path d="M3 9l2-6h14l2 6" />
      <path d="M3 9h18" />
      <path d="M6 21v-4" />
      <path d="M18 21v-4" />
    </svg>
  ),
  balcony: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 21h18" />
      <path d="M5 21V7l5-5v5l5-5v19" />
      <path d="M19 21V10" />
    </svg>
  ),
  gym: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6.5 6.5l11 11" />
      <path d="M21 21l-1-1" />
      <path d="M3 3l1 1" />
      <path d="M18.5 18.5l1 1" />
      <path d="M6.5 17.5l-1 1" />
      <path d="M17.5 6.5l1-1" />
      <path d="M6.5 6.5l-1-1" />
    </svg>
  ),
  elevator: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="1" width="14" height="22" rx="1" />
      <path d="M9 8l3-3 3 3" />
      <path d="M9 16l3 3 3-3" />
    </svg>
  ),
  heating: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2v20" />
      <path d="M8 6L12 2l4 4" />
      <path d="M8 18l4 4 4-4" />
      <path d="M6 12h12" />
    </svg>
  ),
  cleaning: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2L4 8v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-8-6z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
};

export const AmenityIcon: React.FC<AmenityIconProps> = ({ name, ...props }) => {
  const IconComponent = amenityIcons[name];
  if (!IconComponent) return null;
  return <IconComponent {...props} />;
};

export const amenityLabels: Record<AmenityType, string> = {
  wifi: 'WiFi',
  ac: 'AC',
  laundry: 'Laundry',
  parking: 'Parking',
  kitchen: 'Kitchen',
  study: 'Study Area',
  security: 'Security',
  furnished: 'Furnished',
  balcony: 'Balcony',
  gym: 'Gym',
  elevator: 'Elevator',
  heating: 'Heating',
  cleaning: 'Cleaning',
};
