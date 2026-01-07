import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOwnerBedInventory } from '@/hooks/useOwnerBedInventory';
import { BedInventoryCard } from '@/components/owner/BedInventoryCard';
import { OccupancyChart } from '@/components/owner/OccupancyChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Bed, Users, Clock, TrendingUp } from 'lucide-react';

export default function OwnerInventory() {
  const { userId } = useAuth();
  
  const { data: owner, isLoading: ownerLoading } = useQuery({
    queryKey: ['owner-profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId!)
        .single();
      return data;
    },
    enabled: !!userId,
  });

  const { 
    buildings, 
    isLoading: inventoryLoading, 
    refetch, 
    totals 
  } = useOwnerBedInventory(owner?.id || null);

  const isLoading = ownerLoading || inventoryLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bed Inventory</h1>
          <p className="text-muted-foreground">
            Real-time bed availability across all your properties
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Bed className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Beds</p>
                <p className="text-2xl font-bold">{totals.totalBeds}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-500/10">
                <div className="h-5 w-5 rounded-full bg-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">{totals.availableBeds}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reserved</p>
                <p className="text-2xl font-bold text-yellow-600">{totals.reservedBeds}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-red-500/10">
                <Users className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold text-red-600">{totals.occupiedBeds}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                <p className="text-2xl font-bold">{totals.overallOccupancyRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Chart */}
      {totals.totalBeds > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Bed Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <OccupancyChart
              available={totals.availableBeds}
              reserved={totals.reservedBeds}
              occupied={totals.occupiedBeds}
              size="lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Per-Building Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">By Property</h2>
        {buildings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No properties found. Add a property to see bed inventory.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildings.map((building) => (
              <BedInventoryCard key={building.id} building={building} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
