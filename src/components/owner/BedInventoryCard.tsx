import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Building2, Bed, Users, Clock } from 'lucide-react';
import { OccupancyChart } from './OccupancyChart';
import type { BuildingInventorySummary } from '@/types/inventory';

interface BedInventoryCardProps {
  building: BuildingInventorySummary;
  showChart?: boolean;
}

export function BedInventoryCard({ building, showChart = true }: BedInventoryCardProps) {
  const occupancyPercent = building.total_beds > 0 
    ? Math.round((building.occupied_beds / building.total_beds) * 100) 
    : 0;

  const utilizationPercent = building.total_beds > 0
    ? Math.round(((building.occupied_beds + building.reserved_beds) / building.total_beds) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{building.name}</CardTitle>
          </div>
          <Badge variant={building.property_type === 'apartment' ? 'secondary' : 'outline'}>
            {building.property_type || 'Dorm'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Beds</p>
              <p className="text-lg font-semibold">{building.total_beds}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 rounded-md bg-green-500/10">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-lg font-semibold text-green-600">{building.available_beds}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-500/10">
            <Clock className="h-4 w-4 text-yellow-600" />
            <div>
              <p className="text-xs text-muted-foreground">Reserved</p>
              <p className="text-lg font-semibold text-yellow-600">{building.reserved_beds}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-md bg-red-500/10">
            <Users className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">Occupied</p>
              <p className="text-lg font-semibold text-red-600">{building.occupied_beds}</p>
            </div>
          </div>
        </div>

        {/* Occupancy Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Occupancy Rate</span>
            <span className="font-medium">{occupancyPercent}%</span>
          </div>
          <Progress value={occupancyPercent} className="h-2" />
        </div>

        {/* Utilization Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Utilization (Occupied + Reserved)</span>
            <span className="font-medium">{utilizationPercent}%</span>
          </div>
          <Progress value={utilizationPercent} className="h-2" />
        </div>

        {/* Chart */}
        {showChart && building.total_beds > 0 && (
          <OccupancyChart
            available={building.available_beds}
            reserved={building.reserved_beds}
            occupied={building.occupied_beds}
            size="sm"
          />
        )}
      </CardContent>
    </Card>
  );
}
