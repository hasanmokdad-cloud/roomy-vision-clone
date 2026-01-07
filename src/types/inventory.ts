/**
 * Bed availability status enum
 */
export type BedAvailabilityStatus = 'available' | 'reserved' | 'occupied' | 'unavailable';

/**
 * Reservation status enum
 */
export type ReservationStatus = 'pending_payment' | 'reserved' | 'cancelled' | 'expired' | 'completed';

/**
 * Payment provider enum
 */
export type PaymentProvider = 'whish' | 'manual' | 'none';

/**
 * Bed with availability tracking
 */
export interface BedInventory {
  id: string;
  label: string;
  bed_type: string;
  bedroom_id: string | null;
  room_id: string | null;
  parent_type: 'room' | 'bedroom';
  availability_status: BedAvailabilityStatus;
  reserved_by_user_id: string | null;
  reserved_at: string | null;
  occupied_by_user_id: string | null;
  monthly_price: number | null;
  deposit: number | null;
  is_active: boolean;
}

/**
 * Room inventory summary from view
 */
export interface RoomInventorySummary {
  id: string;
  building_id: string;
  name: string;
  type: string | null;
  capacity: number | null;
  total_beds: number;
  available_beds: number;
  reserved_beds: number;
  occupied_beds: number;
  is_fully_available: boolean;
  is_full: boolean;
}

/**
 * Apartment inventory summary from view
 */
export interface ApartmentInventorySummary {
  id: string;
  building_id: string;
  name: string;
  total_bedrooms: number;
  total_beds: number;
  available_beds: number;
  reserved_beds: number;
  occupied_beds: number;
  can_reserve_full_apartment: boolean;
  availability_status: 'no_beds' | 'available' | 'partially_filled' | 'full';
}

/**
 * Building inventory summary from view
 */
export interface BuildingInventorySummary {
  id: string;
  name: string;
  property_type: string | null;
  owner_id: string | null;
  total_beds: number;
  available_beds: number;
  reserved_beds: number;
  occupied_beds: number;
  occupancy_rate: number;
}

/**
 * Reserve bed RPC response
 */
export interface ReserveBedResponse {
  success: boolean;
  error?: string;
  reservation_id?: string;
  bed_id?: string;
  deposit_amount?: number;
  platform_fee?: number;
  total_amount?: number;
  expires_at?: string;
  status?: string;
}

/**
 * Reserve full apartment RPC response
 */
export interface ReserveFullApartmentResponse {
  success: boolean;
  error?: string;
  reservation_group_id?: string;
  reservation_ids?: string[];
  apartment_id?: string;
  bed_count?: number;
  deposit_amount?: number;
  platform_fee?: number;
  total_amount?: number;
  expires_at?: string;
  unavailable_count?: number;
  total_beds?: number;
}

/**
 * Finalize reservation RPC response
 */
export interface FinalizeReservationResponse {
  success: boolean;
  error?: string;
  reservation_id?: string;
  accommodation_status?: string;
}

/**
 * Student checkout RPC response
 */
export interface StudentCheckoutResponse {
  success: boolean;
  error?: string;
  student_id?: string;
  message?: string;
}

/**
 * Cleanup expired reservations RPC response
 */
export interface CleanupExpiredResponse {
  expired_count: number;
}
