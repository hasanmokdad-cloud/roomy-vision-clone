import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BedData {
  id: string;
  label: string;
  bedType: string;
  monthlyPrice: number | null;
  deposit: number | null;
  available: boolean;
  capacityContribution: number;
}

export interface BedroomData {
  id: string;
  name: string;
  bedType: string;
  baseCapacity: number;
  maxCapacity: number;
  allowExtraBeds: boolean;
  pricingMode: 'per_bed' | 'per_bedroom' | 'both';
  bedroomPrice: number | null;
  bedroomDeposit: number | null;
  bedPrice: number | null;
  bedDeposit: number | null;
  images: string[];
  beds: BedData[];
}

export interface PricingTier {
  capacity: number;
  monthlyPrice: number;
  deposit: number;
}

export interface ApartmentData {
  id: string;
  name: string;
  type: string;
  maxCapacity: number;
  enabledCapacities: number[];
  enableTieredPricing: boolean;
  enableFullApartmentReservation: boolean;
  enableBedroomReservation: boolean;
  enableBedReservation: boolean;
  images: string[];
  videoUrl: string | null;
  pricingTiers: PricingTier[];
  bedrooms: BedroomData[];
}

export interface Reservation {
  id: string;
  reservationLevel: 'apartment' | 'bedroom' | 'bed';
  apartmentId: string | null;
  bedroomId: string | null;
  bedId: string | null;
  status: string;
}

interface UseApartmentDetailsResult {
  apartments: ApartmentData[];
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApartmentDetails(buildingId: string): UseApartmentDetailsResult {
  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!buildingId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch apartments with nested bedrooms
      const { data: apartmentsData, error: apartmentsError } = await supabase
        .from('apartments')
        .select(`
          id, name, type, max_capacity, enabled_capacities,
          enable_tiered_pricing, enable_full_apartment_reservation,
          enable_bedroom_reservation, enable_bed_reservation,
          images, video_url
        `)
        .eq('building_id', buildingId)
        .eq('available', true);

      if (apartmentsError) throw apartmentsError;

      if (!apartmentsData || apartmentsData.length === 0) {
        setApartments([]);
        setLoading(false);
        return;
      }

      // Fetch pricing tiers for all apartments
      const apartmentIds = apartmentsData.map(a => a.id);
      const { data: tiersData, error: tiersError } = await supabase
        .from('apartment_pricing_tiers')
        .select('apartment_id, capacity, monthly_price, deposit')
        .in('apartment_id', apartmentIds);

      if (tiersError) throw tiersError;

      // Fetch bedrooms for all apartments
      const { data: bedroomsData, error: bedroomsError } = await supabase
        .from('bedrooms')
        .select(`
          id, apartment_id, name, bed_type, base_capacity, max_capacity,
          allow_extra_beds, pricing_mode, bedroom_price, bedroom_deposit,
          bed_price, bed_deposit, images
        `)
        .in('apartment_id', apartmentIds)
        .eq('available', true);

      if (bedroomsError) throw bedroomsError;

      // Fetch beds for all bedrooms
      const bedroomIds = (bedroomsData || []).map(b => b.id);
      let bedsData: any[] = [];
      if (bedroomIds.length > 0) {
        const { data, error: bedsError } = await supabase
          .from('beds')
          .select('id, bedroom_id, label, bed_type, monthly_price, deposit, available, capacity_contribution')
          .in('bedroom_id', bedroomIds);

        if (bedsError) throw bedsError;
        bedsData = data || [];
      }

      // Fetch active reservations for this building
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations')
        .select('id, reservation_level, apartment_id, bedroom_id, bed_id, status')
        .in('apartment_id', apartmentIds)
        .in('status', ['active', 'confirmed', 'pending']);

      if (reservationsError) throw reservationsError;

      // Transform data
      const transformedApartments: ApartmentData[] = apartmentsData.map(apt => {
        const aptBedrooms = (bedroomsData || [])
          .filter(b => b.apartment_id === apt.id)
          .map(bedroom => ({
            id: bedroom.id,
            name: bedroom.name,
            bedType: bedroom.bed_type,
            baseCapacity: bedroom.base_capacity,
            maxCapacity: bedroom.max_capacity,
            allowExtraBeds: bedroom.allow_extra_beds || false,
            pricingMode: bedroom.pricing_mode as 'per_bed' | 'per_bedroom' | 'both',
            bedroomPrice: bedroom.bedroom_price,
            bedroomDeposit: bedroom.bedroom_deposit,
            bedPrice: bedroom.bed_price,
            bedDeposit: bedroom.bed_deposit,
            images: bedroom.images || [],
            beds: bedsData
              .filter(bed => bed.bedroom_id === bedroom.id)
              .map(bed => ({
                id: bed.id,
                label: bed.label,
                bedType: bed.bed_type,
                monthlyPrice: bed.monthly_price,
                deposit: bed.deposit,
                available: bed.available ?? true,
                capacityContribution: bed.capacity_contribution || 1,
              })),
          }));

        const aptTiers = (tiersData || [])
          .filter(t => t.apartment_id === apt.id)
          .map(t => ({
            capacity: t.capacity,
            monthlyPrice: t.monthly_price,
            deposit: t.deposit || 0,
          }));

        return {
          id: apt.id,
          name: apt.name,
          type: apt.type || 'medium',
          maxCapacity: apt.max_capacity,
          enabledCapacities: apt.enabled_capacities || [],
          enableTieredPricing: apt.enable_tiered_pricing || false,
          enableFullApartmentReservation: apt.enable_full_apartment_reservation ?? true,
          enableBedroomReservation: apt.enable_bedroom_reservation ?? true,
          enableBedReservation: apt.enable_bed_reservation ?? false,
          images: apt.images || [],
          videoUrl: apt.video_url,
          pricingTiers: aptTiers,
          bedrooms: aptBedrooms,
        };
      });

      const transformedReservations: Reservation[] = (reservationsData || []).map(r => ({
        id: r.id,
        reservationLevel: r.reservation_level as 'apartment' | 'bedroom' | 'bed',
        apartmentId: r.apartment_id,
        bedroomId: r.bedroom_id,
        bedId: r.bed_id,
        status: r.status,
      }));

      setApartments(transformedApartments);
      setReservations(transformedReservations);
    } catch (err: any) {
      console.error('Error fetching apartment details:', err);
      setError(err.message || 'Failed to load apartment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time subscriptions
    const channel = supabase
      .channel(`apartments-${buildingId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apartments' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bedrooms' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'beds' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [buildingId]);

  return { apartments, reservations, loading, error, refetch: fetchData };
}
