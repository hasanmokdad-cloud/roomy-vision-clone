import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface BuildingLocationProps {
  area?: string;
  address?: string;
}

/**
 * BuildingLocation - Location section for building pages.
 * 
 * Displays the building's area and full address.
 */
export function BuildingLocation({ area, address }: BuildingLocationProps) {
  if (!address) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Location</h2>
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
          <div>
            {area && <p className="font-medium text-foreground">{area}</p>}
            <p className="text-muted-foreground">{address}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default BuildingLocation;
