import { useMemo } from 'react';

/**
 * Dorm Room Availability Hook
 * 
 * IMPORTANT: 
 * - Bed type is DESCRIPTIVE ONLY - does NOT affect capacity
 * - Capacity is ALWAYS owner-defined
 * - Available beds = capacity - capacity_occupied
 */

interface DormRoom {
  id?: string;
  capacity?: number;
  capacity_occupied?: number;
  available?: boolean;
  bed_type?: string;
}

export interface DormRoomAvailability {
  // Counts
  availableBeds: number;           // capacity - capacity_occupied
  totalBeds: number;               // capacity (owner-defined)
  occupiedBeds: number;            // capacity_occupied
  
  // Status flags
  isAvailable: boolean;            // availableBeds > 0 && room.available !== false
  isFull: boolean;                 // capacity_occupied >= capacity
  isReserved: boolean;             // room.available === false
  
  // Descriptive only - does NOT affect capacity
  bedType: string;
  bedTypeLabel: string;
}

/**
 * Calculate availability for a dorm building room
 * 
 * Key principle: Capacity is OWNER-DEFINED, never inferred from bed type
 */
export function useDormRoomAvailability(room: DormRoom | null): DormRoomAvailability {
  return useMemo(() => {
    if (!room) {
      return {
        availableBeds: 0,
        totalBeds: 0,
        occupiedBeds: 0,
        isAvailable: false,
        isFull: true,
        isReserved: true,
        bedType: 'unknown',
        bedTypeLabel: 'Unknown',
      };
    }

    const capacity = room.capacity ?? 0;
    const occupied = room.capacity_occupied ?? 0;
    const availableBeds = Math.max(0, capacity - occupied);
    const isFull = occupied >= capacity;
    const isReserved = room.available === false;
    const isAvailable = availableBeds > 0 && !isReserved;

    // Bed type is purely descriptive - does NOT affect capacity calculation
    const bedType = room.bed_type || 'single';
    const bedTypeLabel = getBedTypeLabel(bedType);

    return {
      availableBeds,
      totalBeds: capacity,
      occupiedBeds: occupied,
      isAvailable,
      isFull,
      isReserved,
      bedType,
      bedTypeLabel,
    };
  }, [room]);
}

/**
 * Get human-readable label for bed type
 * NOTE: This is purely descriptive - capacity is always owner-defined
 */
function getBedTypeLabel(bedType: string): string {
  const labels: Record<string, string> = {
    single: 'Single Bed',
    double: 'Double Bed',
    master: 'Master Bed',
    king: 'King Bed',
    bunk: 'Bunk Bed',
    twin: 'Twin Bed',
    queen: 'Queen Bed',
    separate: 'Separate Beds',
  };
  
  return labels[bedType.toLowerCase()] || bedType;
}

/**
 * Calculate availability for multiple dorm rooms
 */
export function useMultipleDormRoomAvailability(
  rooms: DormRoom[]
): Map<string, DormRoomAvailability> {
  return useMemo(() => {
    const availabilityMap = new Map<string, DormRoomAvailability>();

    rooms.forEach(room => {
      if (!room.id) return;

      const capacity = room.capacity ?? 0;
      const occupied = room.capacity_occupied ?? 0;
      const availableBeds = Math.max(0, capacity - occupied);
      const isFull = occupied >= capacity;
      const isReserved = room.available === false;
      const isAvailable = availableBeds > 0 && !isReserved;
      const bedType = room.bed_type || 'single';

      availabilityMap.set(room.id, {
        availableBeds,
        totalBeds: capacity,
        occupiedBeds: occupied,
        isAvailable,
        isFull,
        isReserved,
        bedType,
        bedTypeLabel: getBedTypeLabel(bedType),
      });
    });

    return availabilityMap;
  }, [rooms]);
}

/**
 * Get summary stats for multiple rooms
 */
export function getDormRoomsSummary(rooms: DormRoom[]): {
  totalCapacity: number;
  totalOccupied: number;
  totalAvailable: number;
  availableRooms: number;
  fullRooms: number;
} {
  let totalCapacity = 0;
  let totalOccupied = 0;
  let availableRooms = 0;
  let fullRooms = 0;

  rooms.forEach(room => {
    const capacity = room.capacity ?? 0;
    const occupied = room.capacity_occupied ?? 0;
    
    totalCapacity += capacity;
    totalOccupied += occupied;
    
    if (occupied >= capacity || room.available === false) {
      fullRooms++;
    } else {
      availableRooms++;
    }
  });

  return {
    totalCapacity,
    totalOccupied,
    totalAvailable: Math.max(0, totalCapacity - totalOccupied),
    availableRooms,
    fullRooms,
  };
}
