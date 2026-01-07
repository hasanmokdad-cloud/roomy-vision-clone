import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bed, Users } from 'lucide-react';
import type { ApartmentBedroom } from '@/types/apartmentDetail';

interface BedroomInfoCardProps {
  bedroom: ApartmentBedroom;
  index: number;
}

function BedroomInfoCardComponent({ bedroom, index }: BedroomInfoCardProps) {
  const getBedTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      single: 'Single bed',
      double: 'Double bed',
      queen: 'Queen bed',
      king: 'King bed',
      bunk: 'Bunk bed',
      sofa_bed: 'Sofa bed',
      separate_beds: 'Separate beds',
    };
    return labels[type] || type;
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-32 bg-muted">
        {bedroom.images.length > 0 ? (
          <img
            src={bedroom.images[0]}
            alt={bedroom.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Bed className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h4 className="font-medium mb-2">{bedroom.name || `Bedroom ${index + 1}`}</h4>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <Bed className="h-3 w-3" />
            {getBedTypeLabel(bedroom.bedType)}
          </Badge>
          
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            Sleeps {bedroom.maxCapacity}
          </Badge>
        </div>

        {/* Price */}
        {bedroom.bedroomPrice && (
          <div className="mt-3 text-sm">
            <span className="font-semibold">${bedroom.bedroomPrice}</span>
            <span className="text-muted-foreground"> / month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const BedroomInfoCard = memo(BedroomInfoCardComponent);
