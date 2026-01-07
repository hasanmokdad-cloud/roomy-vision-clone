import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchOwnerBuildingInventory } from '@/lib/inventory-queries';
import type { BuildingInventorySummary } from '@/types/inventory';

interface UseOwnerBedInventoryOptions {
  enabled?: boolean;
}

interface UseOwnerBedInventoryResult {
  buildings: BuildingInventorySummary[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  totals: {
    totalBeds: number;
    availableBeds: number;
    reservedBeds: number;
    occupiedBeds: number;
    overallOccupancyRate: number;
  };
}

export function useOwnerBedInventory(
  ownerId: string | null,
  options: UseOwnerBedInventoryOptions = {}
): UseOwnerBedInventoryResult {
  const { enabled = true } = options;

  const {
    data: buildings = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['owner-bed-inventory', ownerId],
    queryFn: () => fetchOwnerBuildingInventory(ownerId!),
    enabled: enabled && !!ownerId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });

  // Subscribe to real-time bed changes
  useEffect(() => {
    if (!ownerId || !enabled) return;

    const channel = supabase
      .channel('bed-inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'beds',
        },
        () => {
          // Refetch on any bed change
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownerId, enabled, refetch]);

  // Calculate totals
  const totals = buildings.reduce(
    (acc, building) => ({
      totalBeds: acc.totalBeds + (building.total_beds || 0),
      availableBeds: acc.availableBeds + (building.available_beds || 0),
      reservedBeds: acc.reservedBeds + (building.reserved_beds || 0),
      occupiedBeds: acc.occupiedBeds + (building.occupied_beds || 0),
      overallOccupancyRate: 0, // Calculated below
    }),
    { totalBeds: 0, availableBeds: 0, reservedBeds: 0, occupiedBeds: 0, overallOccupancyRate: 0 }
  );

  // Calculate overall occupancy rate
  if (totals.totalBeds > 0) {
    totals.overallOccupancyRate = Math.round((totals.occupiedBeds / totals.totalBeds) * 100 * 10) / 10;
  }

  return {
    buildings,
    isLoading,
    error: error as Error | null,
    refetch,
    totals,
  };
}
