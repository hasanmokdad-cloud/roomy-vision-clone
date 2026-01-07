import { useMemo } from 'react';
import { calculateAvailability, type AvailabilityState } from '@/utils/apartmentAvailability';
import type { ApartmentData, Reservation } from './useApartmentDetails';

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

interface ReservationForCalc {
  id: string;
  reservationLevel: 'apartment' | 'bedroom' | 'bed';
  apartmentId?: string;
  bedroomId?: string;
  bedId?: string;
  status: string;
}

/**
 * Hook to calculate availability for a single apartment
 */
export function useApartmentAvailability(
  apartment: ApartmentData | null,
  reservations: Reservation[]
): AvailabilityState | null {
  return useMemo(() => {
    if (!apartment) return null;

    const config: ApartmentConfig = {
      id: apartment.id,
      enableFullApartmentReservation: apartment.enableFullApartmentReservation,
      enableBedroomReservation: apartment.enableBedroomReservation,
      enableBedReservation: apartment.enableBedReservation,
      bedrooms: apartment.bedrooms.map(br => ({
        id: br.id,
        beds: br.beds.map(bed => ({ id: bed.id })),
      })),
    };

    const reservationsForCalc: ReservationForCalc[] = reservations
      .filter(r => r.apartmentId === apartment.id)
      .map(r => ({
        id: r.id,
        reservationLevel: r.reservationLevel,
        apartmentId: r.apartmentId || undefined,
        bedroomId: r.bedroomId || undefined,
        bedId: r.bedId || undefined,
        status: r.status,
      }));

    return calculateAvailability(config, reservationsForCalc);
  }, [apartment, reservations]);
}

/**
 * Hook to calculate availability for multiple apartments
 */
export function useMultipleApartmentAvailability(
  apartments: ApartmentData[],
  reservations: Reservation[]
): Map<string, AvailabilityState> {
  return useMemo(() => {
    const availabilityMap = new Map<string, AvailabilityState>();

    apartments.forEach(apartment => {
      const config: ApartmentConfig = {
        id: apartment.id,
        enableFullApartmentReservation: apartment.enableFullApartmentReservation,
        enableBedroomReservation: apartment.enableBedroomReservation,
        enableBedReservation: apartment.enableBedReservation,
        bedrooms: apartment.bedrooms.map(br => ({
          id: br.id,
          beds: br.beds.map(bed => ({ id: bed.id })),
        })),
      };

      const reservationsForCalc: ReservationForCalc[] = reservations
        .filter(r => r.apartmentId === apartment.id)
        .map(r => ({
          id: r.id,
          reservationLevel: r.reservationLevel,
          apartmentId: r.apartmentId || undefined,
          bedroomId: r.bedroomId || undefined,
          bedId: r.bedId || undefined,
          status: r.status,
        }));

      availabilityMap.set(apartment.id, calculateAvailability(config, reservationsForCalc));
    });

    return availabilityMap;
  }, [apartments, reservations]);
}

/**
 * Calculate available bedrooms and beds count for an apartment
 */
export function getAvailabilityCounts(
  apartment: ApartmentData,
  availability: AvailabilityState
): { availableBedrooms: number; availableBeds: number } {
  let availableBedrooms = 0;
  let availableBeds = 0;

  apartment.bedrooms.forEach(bedroom => {
    if (availability.canReserveBedroom[bedroom.id]) {
      availableBedrooms++;
    }

    bedroom.beds.forEach(bed => {
      if (availability.canReserveBed[bed.id] && bed.available) {
        availableBeds++;
      }
    });
  });

  return { availableBedrooms, availableBeds };
}
