import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield, Star } from 'lucide-react';
import type { ApartmentOwner } from '@/types/apartmentDetail';

interface HostInfoCardProps {
  owner: ApartmentOwner;
  buildingName?: string;
}

function HostInfoCardComponent({ owner, buildingName }: HostInfoCardProps) {
  const initials = owner.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="py-6 border-b">
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={owner.avatar} alt={owner.name} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Hosted by {owner.name}</h3>
          {buildingName && (
            <p className="text-muted-foreground text-sm">{buildingName}</p>
          )}
          
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              Verified
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span>Superhost</span>
            </div>
          </div>
        </div>
      </div>

      {/* Response info */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Response rate: </span>
          <span className="font-medium">{owner.responseRate || 95}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Response time: </span>
          <span className="font-medium">{owner.responseTime || 'Within an hour'}</span>
        </div>
      </div>
    </div>
  );
}

export const HostInfoCard = memo(HostInfoCardComponent);
