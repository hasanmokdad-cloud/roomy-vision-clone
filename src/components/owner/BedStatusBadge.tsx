import { Badge } from '@/components/ui/badge';
import type { BedAvailabilityStatus } from '@/types/inventory';

interface BedStatusBadgeProps {
  status: BedAvailabilityStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<BedAvailabilityStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: 'Available', variant: 'default' },
  reserved: { label: 'Reserved', variant: 'secondary' },
  occupied: { label: 'Occupied', variant: 'destructive' },
  unavailable: { label: 'Unavailable', variant: 'outline' },
};

export function BedStatusBadge({ status, size = 'md' }: BedStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.unavailable;
  
  return (
    <Badge 
      variant={config.variant}
      className={size === 'sm' ? 'text-xs px-1.5 py-0.5' : ''}
    >
      {config.label}
    </Badge>
  );
}
