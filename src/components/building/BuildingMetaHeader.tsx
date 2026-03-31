import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, Bookmark } from 'lucide-react';
import { ShareButton } from '@/components/shared/ShareButton';

interface BuildingMetaHeaderProps {
  displayName: string;
  area?: string;
  location?: string;
  verificationStatus?: string;
  startingPrice: number;
  hasMultipleRoomTypes: boolean;
  dormId: string;
  isSaved: boolean;
  onToggleSave: () => void;
}

/**
 * BuildingMetaHeader - Header section with name, location, price, and actions.
 * 
 * Displays the building name, verified badge, location, price, and
 * share/save action buttons.
 */
export function BuildingMetaHeader({
  displayName,
  area,
  location,
  verificationStatus,
  startingPrice,
  hasMultipleRoomTypes,
  dormId,
  isSaved,
  onToggleSave
}: BuildingMetaHeaderProps) {
  const isVerified = verificationStatus === 'Verified';

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-5 h-5" />
            <span>{area || location}</span>
            {isVerified && (
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-foreground">
            ${startingPrice}
          </div>
          <div className="text-sm text-muted-foreground">
            {hasMultipleRoomTypes ? 'starting from' : 'per month'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuildingMetaHeader;
