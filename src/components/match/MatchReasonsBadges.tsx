import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, GraduationCap, Users, Home } from 'lucide-react';

interface MatchReasonsBadgesProps {
  profileA: any;
  profileB: any;
}

export function MatchReasonsBadges({ profileA, profileB }: MatchReasonsBadgesProps) {
  const reasons = generateMatchReasons(profileA, profileB);

  const getIcon = (reason: string) => {
    if (reason.includes('university') || reason.includes('University')) return GraduationCap;
    if (reason.includes('budget') || reason.includes('Budget')) return DollarSign;
    if (reason.includes('area') || reason.includes('location')) return MapPin;
    if (reason.includes('age')) return Users;
    return Home;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {reasons.map((reason, idx) => {
        const Icon = getIcon(reason);
        return (
          <Badge 
            key={idx} 
            variant="secondary"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border-primary/20"
          >
            <Icon className="w-3.5 h-3.5" />
            {reason}
          </Badge>
        );
      })}
    </div>
  );
}

function generateMatchReasons(profileA: any, profileB: any): string[] {
  const reasons: string[] = [];

  // University match
  if (profileA.university === profileB.university && profileA.university) {
    reasons.push(`Same university: ${profileA.university}`);
  }

  // Preferred university match
  if (profileA.preferred_university === profileB.preferred_university && profileA.preferred_university) {
    reasons.push(`Both prefer ${profileA.preferred_university}`);
  }

  // Budget compatibility
  if (profileA.budget && profileB.budget) {
    const diff = Math.abs(profileA.budget - profileB.budget);
    if (diff < 100) {
      reasons.push(`Similar budget (~$${profileA.budget}/mo)`);
    } else if (diff < 200) {
      reasons.push('Compatible budget range');
    }
  }

  // Age proximity
  if (profileA.age && profileB.age) {
    const ageDiff = Math.abs(profileA.age - profileB.age);
    if (ageDiff <= 2) {
      reasons.push('Close in age');
    } else if (ageDiff <= 4) {
      reasons.push('Similar age group');
    }
  }

  // Location overlap
  if (profileA.favorite_areas?.length && profileB.favorite_areas?.length) {
    const overlap = profileA.favorite_areas.filter((a: string) => 
      profileB.favorite_areas.includes(a)
    );
    if (overlap.length > 0) {
      reasons.push(`Both like ${overlap[0]}`);
    }
  }

  // Room type match
  if (profileA.preferred_room_types?.length && profileB.preferred_room_types?.length) {
    const overlap = profileA.preferred_room_types.filter((t: string) =>
      profileB.preferred_room_types.includes(t)
    );
    if (overlap.length > 0) {
      reasons.push(`Both prefer ${overlap[0]}`);
    }
  }

  // Amenities overlap
  if (profileA.preferred_amenities?.length && profileB.preferred_amenities?.length) {
    const overlap = profileA.preferred_amenities.filter((a: string) =>
      profileB.preferred_amenities.includes(a)
    );
    if (overlap.length >= 2) {
      reasons.push(`${overlap.length} shared amenity preferences`);
    }
  }

  return reasons.slice(0, 4); // Max 4 reasons for display
}
