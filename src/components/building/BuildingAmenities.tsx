import { Card, CardContent } from '@/components/ui/card';
import { getAmenityIcon } from '@/utils/amenityIcons';

interface BuildingAmenitiesProps {
  amenities: string[];
}

/**
 * BuildingAmenities - Services & Amenities section for building pages.
 * 
 * Displays a grid of amenities with icons.
 */
export function BuildingAmenities({ amenities }: BuildingAmenitiesProps) {
  if (!amenities || amenities.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Services & Amenities</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {amenities.map((amenity, idx) => {
            const IconComponent = getAmenityIcon(amenity);
            return (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <IconComponent className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{amenity}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default BuildingAmenities;
