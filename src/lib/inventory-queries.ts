import { supabase } from '@/integrations/supabase/client';
import type {
  BuildingInventorySummary,
  ApartmentInventorySummary,
  RoomInventorySummary,
  ReserveBedResponse,
  ReserveFullApartmentResponse,
  FinalizeReservationResponse,
  StudentCheckoutResponse,
} from '@/types/inventory';

/**
 * Fetch building inventory summary for an owner
 */
export async function fetchOwnerBuildingInventory(ownerId: string): Promise<BuildingInventorySummary[]> {
  const { data, error } = await supabase
    .from('building_inventory_summary')
    .select('*')
    .eq('owner_id', ownerId);

  if (error) {
    console.error('Error fetching building inventory:', error);
    throw error;
  }

  return (data || []) as BuildingInventorySummary[];
}

/**
 * Fetch apartment inventory summary for a building
 */
export async function fetchApartmentInventory(buildingId: string): Promise<ApartmentInventorySummary[]> {
  const { data, error } = await supabase
    .from('apartment_inventory_summary')
    .select('*')
    .eq('building_id', buildingId);

  if (error) {
    console.error('Error fetching apartment inventory:', error);
    throw error;
  }

  return (data || []) as ApartmentInventorySummary[];
}

/**
 * Fetch room inventory summary for a building
 */
export async function fetchRoomInventory(buildingId: string): Promise<RoomInventorySummary[]> {
  const { data, error } = await supabase
    .from('room_inventory_summary')
    .select('*')
    .eq('building_id', buildingId);

  if (error) {
    console.error('Error fetching room inventory:', error);
    throw error;
  }

  return (data || []) as RoomInventorySummary[];
}

/**
 * Check if full apartment reservation is available
 */
export async function checkCanReserveFullApartment(apartmentId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_reserve_full_apartment', {
    p_apartment_id: apartmentId,
  });

  if (error) {
    console.error('Error checking full apartment availability:', error);
    return false;
  }

  return data as boolean;
}

/**
 * Reserve a single bed
 */
export async function reserveBed(
  bedId: string,
  userId: string,
  holdMinutes: number = 30
): Promise<ReserveBedResponse> {
  const { data, error } = await supabase.rpc('reserve_bed', {
    p_bed_id: bedId,
    p_user_id: userId,
    p_hold_minutes: holdMinutes,
  });

  if (error) {
    console.error('Error reserving bed:', error);
    return { success: false, error: error.message };
  }

  return data as unknown as ReserveBedResponse;
}

/**
 * Reserve all beds in an apartment (full apartment reservation)
 */
export async function reserveFullApartment(
  apartmentId: string,
  userId: string,
  holdMinutes: number = 30
): Promise<ReserveFullApartmentResponse> {
  const { data, error } = await supabase.rpc('reserve_full_apartment', {
    p_apartment_id: apartmentId,
    p_user_id: userId,
    p_hold_minutes: holdMinutes,
  });

  if (error) {
    console.error('Error reserving full apartment:', error);
    return { success: false, error: error.message };
  }

  return data as unknown as ReserveFullApartmentResponse;
}

/**
 * Finalize a reservation after payment
 */
export async function finalizeReservation(
  reservationId: string,
  paymentReference?: string
): Promise<FinalizeReservationResponse> {
  const { data, error } = await supabase.rpc('finalize_reservation', {
    p_reservation_id: reservationId,
    p_payment_reference: paymentReference || null,
  });

  if (error) {
    console.error('Error finalizing reservation:', error);
    return { success: false, error: error.message };
  }

  return data as unknown as FinalizeReservationResponse;
}

/**
 * Student checkout - release all beds and clear assignment
 */
export async function studentCheckout(userId: string): Promise<StudentCheckoutResponse> {
  const { data, error } = await supabase.rpc('student_checkout_extended', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error during checkout:', error);
    return { success: false, error: error.message };
  }

  return data as unknown as StudentCheckoutResponse;
}

/**
 * Cleanup expired reservations (admin function)
 */
export async function cleanupExpiredReservations(): Promise<number> {
  const { data, error } = await supabase.rpc('cleanup_expired_reservations');

  if (error) {
    console.error('Error cleaning up expired reservations:', error);
    return 0;
  }

  return data as number;
}
