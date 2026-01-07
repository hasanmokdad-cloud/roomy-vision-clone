/**
 * Apartment Availability Utilities
 * Implements STRICT FLEX MODE mutual exclusivity rules
 * 
 * Rules:
 * 1. If apartment.reserved == true → hide bedroom + bed reservations
 * 2. If any bed.reserved == true → hide full apartment reservation
 * 3. If bedroom.reserved_as_whole == true → hide its beds
 */

interface Reservation {
  id: string;
  reservationLevel: 'apartment' | 'bedroom' | 'bed';
  apartmentId?: string;
  bedroomId?: string;
  bedId?: string;
  status: string;
}

export interface AvailabilityState {
  // Per-item availability maps
  canReserveFullApartment: boolean;
  canReserveBedroom: Record<string, boolean>;
  canReserveBed: Record<string, boolean>;
  reason?: string;
  
  // EXPOSED: Explicit boolean flags
  apartmentReservable: boolean;      // true if full apartment can be reserved
  bedroomReservable: boolean;        // true if ANY bedroom is reservable
  bedReservable: boolean;            // true if ANY bed is reservable
  
  // EXPOSED: Counts
  availableBedroomsCount: number;
  availableBedsCount: number;
  totalBedroomsCount: number;
  totalBedsCount: number;
  
  // Status flags for rule enforcement
  isApartmentLocked: boolean;        // apartment is reserved
  hasAnyBedReserved: boolean;        // any bed in apartment is reserved
  hasAnyBedroomReserved: boolean;    // any bedroom is reserved as whole
}

interface ApartmentConfig {
  id: string;
  enableFullApartmentReservation: boolean;
  enableBedroomReservation: boolean;
  enableBedReservation: boolean;
  bedrooms: Array<{
    id: string;
    beds: Array<{ id: string; available?: boolean }>;
  }>;
}

/**
 * Calculate availability state based on current reservations
 * 
 * STRICT Rules:
 * 1. If apartment is reserved → hide ALL bedroom & bed options
 * 2. If ANY bed is reserved → hide full apartment reservation
 * 3. If bedroom reserved as whole → hide its beds
 * 4. If any bed in bedroom reserved → hide bedroom-as-whole option
 */
export function calculateAvailability(
  apartment: ApartmentConfig,
  reservations: Reservation[]
): AvailabilityState {
  const activeReservations = reservations.filter(r =>
    r.apartmentId === apartment.id &&
    ['active', 'confirmed', 'pending'].includes(r.status)
  );

  // Initialize counts
  const totalBedroomsCount = apartment.bedrooms.length;
  const totalBedsCount = apartment.bedrooms.reduce((sum, br) => sum + br.beds.length, 0);

  // Initialize availability based on apartment config
  const result: AvailabilityState = {
    canReserveFullApartment: apartment.enableFullApartmentReservation,
    canReserveBedroom: {},
    canReserveBed: {},
    
    // Exposed flags - will be computed
    apartmentReservable: apartment.enableFullApartmentReservation,
    bedroomReservable: false,
    bedReservable: false,
    
    // Counts - will be computed
    availableBedroomsCount: 0,
    availableBedsCount: 0,
    totalBedroomsCount,
    totalBedsCount,
    
    // Status flags
    isApartmentLocked: false,
    hasAnyBedReserved: false,
    hasAnyBedroomReserved: false,
  };

  // Initialize bedroom and bed availability
  apartment.bedrooms.forEach(br => {
    result.canReserveBedroom[br.id] = apartment.enableBedroomReservation;
    br.beds.forEach(bed => {
      // Only mark as reservable if bed itself is available
      result.canReserveBed[bed.id] = apartment.enableBedReservation && (bed.available !== false);
    });
  });

  // Check for apartment-level reservations
  const apartmentReservation = activeReservations.find(
    r => r.reservationLevel === 'apartment'
  );

  if (apartmentReservation) {
    // RULE 1: Apartment is reserved → hide ALL bedroom & bed options
    result.isApartmentLocked = true;
    result.canReserveFullApartment = false;
    result.apartmentReservable = false;
    
    apartment.bedrooms.forEach(br => {
      result.canReserveBedroom[br.id] = false;
      br.beds.forEach(bed => {
        result.canReserveBed[bed.id] = false;
      });
    });
    
    result.reason = 'Apartment is fully reserved';
    result.availableBedroomsCount = 0;
    result.availableBedsCount = 0;
    result.bedroomReservable = false;
    result.bedReservable = false;
    
    return result;
  }

  // Check for bed-level reservations
  const bedReservations = activeReservations.filter(
    r => r.reservationLevel === 'bed'
  );

  if (bedReservations.length > 0) {
    result.hasAnyBedReserved = true;
    
    // RULE 2: If ANY bed is reserved → hide full apartment reservation
    result.canReserveFullApartment = false;
    result.apartmentReservable = false;

    // Mark reserved beds as unavailable
    bedReservations.forEach(r => {
      if (r.bedId) {
        result.canReserveBed[r.bedId] = false;
      }
    });

    // RULE 4: If any bed in bedroom reserved → hide bedroom-as-whole option
    apartment.bedrooms.forEach(br => {
      const hasReservedBed = bedReservations.some(r =>
        br.beds.some(bed => bed.id === r.bedId)
      );
      if (hasReservedBed) {
        result.canReserveBedroom[br.id] = false;
      }
    });
  }

  // Check for bedroom-level reservations
  const bedroomReservations = activeReservations.filter(
    r => r.reservationLevel === 'bedroom'
  );

  if (bedroomReservations.length > 0) {
    result.hasAnyBedroomReserved = true;
    
    // RULE 2: If any bedroom reserved → hide full apartment
    result.canReserveFullApartment = false;
    result.apartmentReservable = false;

    bedroomReservations.forEach(r => {
      if (r.bedroomId) {
        // Mark bedroom as unavailable
        result.canReserveBedroom[r.bedroomId] = false;

        // RULE 3: Bedroom reserved as whole → hide its beds
        const bedroom = apartment.bedrooms.find(br => br.id === r.bedroomId);
        if (bedroom) {
          bedroom.beds.forEach(bed => {
            result.canReserveBed[bed.id] = false;
          });
        }
      }
    });
  }

  // Calculate final counts
  result.availableBedroomsCount = Object.values(result.canReserveBedroom).filter(Boolean).length;
  result.availableBedsCount = Object.values(result.canReserveBed).filter(Boolean).length;
  
  // Set exposed boolean flags
  result.bedroomReservable = result.availableBedroomsCount > 0 && apartment.enableBedroomReservation;
  result.bedReservable = result.availableBedsCount > 0 && apartment.enableBedReservation;
  
  // Final apartment reservable check
  result.apartmentReservable = result.canReserveFullApartment && 
    apartment.enableFullApartmentReservation && 
    !result.hasAnyBedReserved && 
    !result.hasAnyBedroomReserved;

  return result;
}

/**
 * Check if a specific reservation action is allowed
 */
export function canMakeReservation(
  apartment: ApartmentConfig,
  reservations: Reservation[],
  level: 'apartment' | 'bedroom' | 'bed',
  targetId?: string
): { allowed: boolean; reason?: string } {
  const availability = calculateAvailability(apartment, reservations);

  switch (level) {
    case 'apartment':
      return {
        allowed: availability.apartmentReservable,
        reason: availability.apartmentReservable
          ? undefined
          : availability.reason || 'Full apartment reservation is not available',
      };

    case 'bedroom':
      if (!targetId) return { allowed: false, reason: 'Bedroom ID required' };
      return {
        allowed: availability.canReserveBedroom[targetId] ?? false,
        reason: availability.canReserveBedroom[targetId]
          ? undefined
          : 'This bedroom is not available for reservation',
      };

    case 'bed':
      if (!targetId) return { allowed: false, reason: 'Bed ID required' };
      return {
        allowed: availability.canReserveBed[targetId] ?? false,
        reason: availability.canReserveBed[targetId]
          ? undefined
          : 'This bed is not available for reservation',
      };

    default:
      return { allowed: false, reason: 'Invalid reservation level' };
  }
}

/**
 * Get availability summary for display
 */
export function getAvailabilitySummary(availability: AvailabilityState): {
  statusText: string;
  isFullyAvailable: boolean;
  isPartiallyAvailable: boolean;
  isFullyBooked: boolean;
} {
  const isFullyBooked = !availability.apartmentReservable && 
    !availability.bedroomReservable && 
    !availability.bedReservable;
  
  const isFullyAvailable = availability.apartmentReservable;
  
  const isPartiallyAvailable = !isFullyAvailable && !isFullyBooked;

  let statusText = 'Fully Available';
  if (isFullyBooked) {
    statusText = 'Fully Booked';
  } else if (isPartiallyAvailable) {
    statusText = `${availability.availableBedsCount} beds available`;
  }

  return {
    statusText,
    isFullyAvailable,
    isPartiallyAvailable,
    isFullyBooked,
  };
}
