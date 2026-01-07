import { Card, CardContent } from '@/components/ui/card';

interface ApartmentInventorySectionProps {
  buildingId: string;
  buildingName: string;
}

/**
 * ApartmentInventorySection - Placeholder for apartment unit options.
 * 
 * This component is a scaffold for future apartment building pages.
 * It will display apartment units/studios when fully implemented.
 * 
 * Currently renders nothing as apartment inventory UI is not yet built.
 */
export function ApartmentInventorySection({
  buildingId,
  buildingName
}: ApartmentInventorySectionProps) {
  // Placeholder - apartment inventory not yet implemented
  // This will be expanded to show apartment units when ready
  
  return null;
}

export default ApartmentInventorySection;
