import { getAmenityIcon } from '@/utils/amenityIcons';

interface AmenityIconProps {
  name: string;
  className?: string;
}

export default function AmenityIcon({ name, className = "w-5 h-5" }: AmenityIconProps) {
  const IconComponent = getAmenityIcon(name);
  
  return (
    <IconComponent 
      className={`${className} text-secondary/80 hover:text-secondary transition-colors`} 
      aria-label={name}
    />
  );
}
