/**
 * Apartment Availability Utilities
 * Implements FLEX MODE mutual exclusivity rules
 */

interface Reservation {
  id: string;
  reservationLevel: 'apartment' | 'bedroom' | 'bed';
  apartmentId?: string;
  bedroomId?: string;
  bedId?: string;
  status: string;
}

interface AvailabilityState {
  canReserveFullApartment: boolean;
  canReserveBedroom: Record<string, boolean>;
  canReserveBed: Record<string, boolean>;
  reason?: string;
}

interface ApartmentConfig {
  id: string;
  enableFullApartmentReservation: boolean;
  enableBedroomReservation: boolean;
  enableBedReservation: boolean;
  bedrooms: Array<{
    id: string;
    beds: Array<{ id: string }>;
  }>;
}

/**
 * Calculate availability state based on current reservations
 * 
 * Rules:
 * 1. If apartment is reserved → hide bedroom & bed options
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

  // Initialize availability based on apartment config
  const result: AvailabilityState = {
    canReserveFullApartment: apartment.enableFullApartmentReservation,
    canReserveBedroom: {},
    canReserveBed: {},
  };

  // Initialize bedroom and bed availability
  apartment.bedrooms.forEach(br => {
    result.canReserveBedroom[br.id] = apartment.enableBedroomReservation;
    br.beds.forEach(bed => {
      result.canReserveBed[bed.id] = apartment.enableBedReservation;
    });
  });

  // Check for apartment-level reservations
  const apartmentReservation = activeReservations.find(
    r => r.reservationLevel === 'apartment'
  );

  if (apartmentReservation) {
    // Rule 1: Apartment is reserved → hide all bedroom & bed options
    result.canReserveFullApartment = false;
    apartment.bedrooms.forEach(br => {
      result.canReserveBedroom[br.id] = false;
      br.beds.forEach(bed => {
        result.canReserveBed[bed.id] = false;
      });
    });
    result.reason = 'Apartment is fully reserved';
    return result;
  }

  // Check for bed-level reservations
  const bedReservations = activeReservations.filter(
    r => r.reservationLevel === 'bed'
  );

  if (bedReservations.length > 0) {
    // Rule 2: If ANY bed is reserved → hide full apartment reservation
    result.canReserveFullApartment = false;

    // Mark reserved beds as unavailable
    bedReservations.forEach(r => {
      if (r.bedId) {
        result.canReserveBed[r.bedId] = false;
      }
    });

    // Rule 4: If any bed in bedroom reserved → hide bedroom-as-whole option
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
    // Rule 2: If any bedroom reserved → hide full apartment
    result.canReserveFullApartment = false;

    bedroomReservations.forEach(r => {
      if (r.bedroomId) {
        // Mark bedroom as unavailable
        result.canReserveBedroom[r.bedroomId] = false;

        // Rule 3: Bedroom reserved as whole → hide its beds
        const bedroom = apartment.bedrooms.find(br => br.id === r.bedroomId);
        if (bedroom) {
          bedroom.beds.forEach(bed => {
            result.canReserveBed[bed.id] = false;
          });
        }
      }
    });
  }

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
        allowed: availability.canReserveFullApartment,
        reason: availability.canReserveFullApartment
          ? undefined
          : 'Full apartment reservation is not available',
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
