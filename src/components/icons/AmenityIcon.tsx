import { LucideProps } from 'lucide-react';
import { getAmenityIcon, amenityLabels } from '@/utils/amenityIcons';

interface AmenityIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

export const AmenityIcon: React.FC<AmenityIconProps> = ({ name, ...props }) => {
  const IconComponent = getAmenityIcon(name);
  return <IconComponent {...props} />;
};

export { amenityLabels };
