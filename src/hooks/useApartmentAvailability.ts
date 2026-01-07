import { useMemo } from 'react';
import { calculateAvailability, getAvailabilitySummary, type AvailabilityState } from '@/utils/apartmentAvailability';
import type { ApartmentData, Reservation } from './useApartmentDetails';

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

interface ReservationForCalc {
  id: string;
  reservationLevel: 'apartment' | 'bedroom' | 'bed';
  apartmentId?: string;
  bedroomId?: string;
  bedId?: string;
  status: string;
}

/**
 * Extended availability state with helper methods
 */
export interface ExtendedAvailability extends AvailabilityState {
  // Summary for display
  statusText: string;
  isFullyAvailable: boolean;
  isPartiallyAvailable: boolean;
  isFullyBooked: boolean;
}

/**
 * Hook to calculate availability for a single apartment
 * Returns extended availability with all exposed metrics
 */
export function useApartmentAvailability(
  apartment: ApartmentData | null,
  reservations: Reservation[]
): ExtendedAvailability | null {
  return useMemo(() => {
    if (!apartment) return null;

    const config: ApartmentConfig = {
      id: apartment.id,
      enableFullApartmentReservation: apartment.enableFullApartmentReservation,
      enableBedroomReservation: apartment.enableBedroomReservation,
      enableBedReservation: apartment.enableBedReservation,
      bedrooms: apartment.bedrooms.map(br => ({
        id: br.id,
        beds: br.beds.map(bed => ({ id: bed.id, available: bed.available })),
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

    const availability = calculateAvailability(config, reservationsForCalc);
    const summary = getAvailabilitySummary(availability);

    return {
      ...availability,
      ...summary,
    };
  }, [apartment, reservations]);
}

/**
 * Hook to calculate availability for multiple apartments
 * Returns extended availability with all exposed metrics
 */
export function useMultipleApartmentAvailability(
  apartments: ApartmentData[],
  reservations: Reservation[]
): Map<string, ExtendedAvailability> {
  return useMemo(() => {
    const availabilityMap = new Map<string, ExtendedAvailability>();

    apartments.forEach(apartment => {
      const config: ApartmentConfig = {
        id: apartment.id,
        enableFullApartmentReservation: apartment.enableFullApartmentReservation,
        enableBedroomReservation: apartment.enableBedroomReservation,
        enableBedReservation: apartment.enableBedReservation,
        bedrooms: apartment.bedrooms.map(br => ({
          id: br.id,
          beds: br.beds.map(bed => ({ id: bed.id, available: bed.available })),
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

      const availability = calculateAvailability(config, reservationsForCalc);
      const summary = getAvailabilitySummary(availability);

      availabilityMap.set(apartment.id, {
        ...availability,
        ...summary,
      });
    });

    return availabilityMap;
  }, [apartments, reservations]);
}

/**
 * Calculate available bedrooms and beds count for an apartment
 * NOTE: This now uses the counts directly from AvailabilityState
 */
export function getAvailabilityCounts(
  availability: AvailabilityState
): { availableBedrooms: number; availableBeds: number; totalBedrooms: number; totalBeds: number } {
  return {
    availableBedrooms: availability.availableBedroomsCount,
    availableBeds: availability.availableBedsCount,
    totalBedrooms: availability.totalBedroomsCount,
    totalBeds: availability.totalBedsCount,
  };
}
