import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';

interface AvailabilityIndicatorProps {
  isAvailable: boolean | null;
  conflictType?: string;
  isChecking?: boolean;
}

export function AvailabilityIndicator({
  isAvailable,
  conflictType,
  isChecking = false,
}: AvailabilityIndicatorProps) {
  if (isChecking) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (isAvailable === null) {
    return null;
  }

  if (isAvailable) {
    return (
      <Badge variant="secondary" className="gap-1 bg-green-500/20 text-green-700 dark:text-green-400">
        <CheckCircle className="w-3 h-3" />
        Available
      </Badge>
    );
  }

  if (conflictType === 'booking_conflict') {
    return (
      <Badge variant="secondary" className="gap-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
        <AlertCircle className="w-3 h-3" />
        Already Booked
      </Badge>
    );
  }

  if (conflictType === 'owner_blocked') {
    return (
      <Badge variant="secondary" className="gap-1 bg-red-500/20 text-red-700 dark:text-red-400">
        <XCircle className="w-3 h-3" />
        Unavailable
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1 bg-red-500/20 text-red-700 dark:text-red-400">
      <XCircle className="w-3 h-3" />
      Not Available
    </Badge>
  );
}
