interface AmenityIconProps {
  name: string;
  className?: string;
}

const icons: Record<string, JSX.Element> = {
  wifi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <title>WiFi</title>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <path d="M12 20h.01" />
    </svg>
  ),
  ac: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <title>Air Conditioning</title>
      <path d="M8 16V8" />
      <path d="M16 16V8" />
      <path d="M12 4v16" />
      <path d="M4 12h16" />
      <path d="M4 8h16" />
      <path d="M4 16h16" />
    </svg>
  ),
  laundry: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <title>Laundry</title>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="12" cy="14" r="5" />
      <path d="M7 7h.01" />
      <path d="M11 7h.01" />
    </svg>
  ),
  kitchen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <title>Kitchen</title>
      <path d="M3 2v20" />
      <path d="M7 2v20" />
      <path d="M3 10h4" />
      <path d="M3 6h4" />
      <path d="M3 14h4" />
      <rect x="12" y="2" width="9" height="20" rx="2" />
    </svg>
  ),
  parking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <title>Parking</title>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6h-4" />
    </svg>
  ),
  elevator: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <title>Elevator</title>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M10 8l2-2 2 2" />
      <path d="M14 14l-2 2-2-2" />
    </svg>
  ),
  heating: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <title>Heating</title>
      <path d="M12 2v20" />
      <path d="M5 9l7-7 7 7" />
      <path d="M5 15l7 7 7-7" />
    </svg>
  ),
  cleaning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <title>Cleaning Service</title>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ),
  security: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <title>Security</title>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  gym: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <title>Gym</title>
      <path d="M6.5 6.5l11 11" />
      <path d="M17.5 6.5l-11 11" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01" />
      <path d="M18 12h.01" />
      <path d="M12 6v.01" />
      <path d="M12 18v.01" />
    </svg>
  ),
  study: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <title>Study Area</title>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  balcony: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <title>Balcony</title>
      <rect x="2" y="7" width="20" height="15" rx="2" />
      <path d="M12 7V2" />
      <path d="M7 12v5" />
      <path d="M12 12v5" />
      <path d="M17 12v5" />
    </svg>
  ),
};

export default function AmenityIcon({ name, className = "w-5 h-5" }: AmenityIconProps) {
  const icon = icons[name.toLowerCase()] || icons.wifi;
  
  return (
    <span className={`inline-block ${className} text-secondary/80 hover:text-secondary transition-colors`} aria-label={name}>
      {icon}
    </span>
  );
}
