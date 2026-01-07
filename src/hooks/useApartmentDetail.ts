import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ApartmentDetailData, 
  ApartmentPhoto, 
  ApartmentSpace, 
  ApartmentBedroom,
  ApartmentOwner,
  SpaceType 
} from '@/types/apartmentDetail';

interface UseApartmentDetailResult {
  apartment: ApartmentDetailData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApartmentDetail(apartmentId: string): UseApartmentDetailResult {
  const [apartment, setApartment] = useState<ApartmentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!apartmentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch apartment with building info
      const { data: aptData, error: aptError } = await supabase
        .from('apartments')
        .select(`
          id, building_id, name, type, max_capacity, guest_capacity,
          area_m2, description, short_description, house_rules,
          safety_features, cancellation_policy, amenities, images, video_url,
          enable_full_apartment_reservation, enable_bedroom_reservation,
          enable_bed_reservation, bathroom_count
        `)
        .eq('id', apartmentId)
        .single();

      if (aptError) throw aptError;
      if (!aptData) throw new Error('Apartment not found');

      // Fetch building info
      const { data: buildingData } = await supabase
        .from('dorms')
        .select('id, name, location, address, university, owner_id, amenities')
        .eq('id', aptData.building_id)
        .single();

      // Fetch owner info
      let ownerData: ApartmentOwner | undefined;
      if (buildingData?.owner_id) {
        const { data: owner } = await supabase
          .from('owners')
          .select('id, full_name, profile_photo_url, email, phone_number')
          .eq('id', buildingData.owner_id)
          .single();
        
        if (owner) {
          ownerData = {
            id: owner.id,
            name: owner.full_name,
            avatar: owner.profile_photo_url || undefined,
            email: owner.email || undefined,
            phone: owner.phone_number || undefined,
          };
        }
      }

      // Fetch apartment photos
      const { data: photosData } = await supabase
        .from('apartment_photos')
        .select('*')
        .eq('apartment_id', apartmentId)
        .order('sort_order');

      const photos: ApartmentPhoto[] = (photosData || []).map(p => ({
        id: p.id,
        apartmentId: p.apartment_id,
        url: p.url,
        spaceType: p.space_type as SpaceType,
        spaceInstance: p.space_instance || undefined,
        sortOrder: p.sort_order || 0,
        caption: p.caption || undefined,
        isCover: p.is_cover || false,
      }));

      // Fetch apartment spaces
      const { data: spacesData } = await supabase
        .from('apartment_spaces')
        .select('*')
        .eq('apartment_id', apartmentId)
        .order('sort_order');

      const spaces: ApartmentSpace[] = (spacesData || []).map(s => ({
        id: s.id,
        apartmentId: s.apartment_id,
        spaceType: s.space_type as SpaceType,
        spaceInstance: s.space_instance || undefined,
        meta: (s.meta_json as any) || {},
        sortOrder: s.sort_order || 0,
      }));

      // Fetch bedrooms
      const { data: bedroomsData } = await supabase
        .from('bedrooms')
        .select('*')
        .eq('apartment_id', apartmentId)
        .eq('available', true)
        .order('name');

      const bedrooms: ApartmentBedroom[] = (bedroomsData || []).map(b => ({
        id: b.id,
        name: b.name,
        bedType: b.bed_type,
        baseCapacity: b.base_capacity,
        maxCapacity: b.max_capacity,
        pricingMode: b.pricing_mode,
        bedroomPrice: b.bedroom_price || undefined,
        bedroomDeposit: b.bedroom_deposit || undefined,
        images: b.images || [],
      }));

      // Fetch pricing tiers
      const { data: tiersData } = await supabase
        .from('apartment_pricing_tiers')
        .select('capacity, monthly_price, deposit')
        .eq('apartment_id', apartmentId)
        .order('capacity');

      const pricingTiers = (tiersData || []).map(t => ({
        capacity: t.capacity,
        monthlyPrice: t.monthly_price,
        deposit: t.deposit || 0,
      }));

      // Combine all amenities
      const allAmenities = [
        ...(aptData.amenities || []),
        ...(buildingData?.amenities || []),
      ];

      const apartmentDetail: ApartmentDetailData = {
        id: aptData.id,
        buildingId: aptData.building_id,
        buildingName: buildingData?.name || '',
        name: aptData.name,
        type: aptData.type || 'apartment',
        description: aptData.description || undefined,
        shortDescription: aptData.short_description || undefined,
        maxCapacity: aptData.max_capacity,
        guestCapacity: aptData.guest_capacity || undefined,
        bedroomCount: bedrooms.length,
        bathroomCount: aptData.bathroom_count || 1,
        areaM2: aptData.area_m2 || undefined,
        houseRules: aptData.house_rules || undefined,
        safetyFeatures: aptData.safety_features || undefined,
        cancellationPolicy: aptData.cancellation_policy || undefined,
        amenities: allAmenities,
        images: aptData.images || [],
        videoUrl: aptData.video_url || undefined,
        photos,
        spaces,
        bedrooms,
        owner: ownerData,
        location: buildingData?.location || undefined,
        address: buildingData?.address || undefined,
        university: buildingData?.university || undefined,
        enableFullApartmentReservation: aptData.enable_full_apartment_reservation ?? true,
        enableBedroomReservation: aptData.enable_bedroom_reservation ?? true,
        enableBedReservation: aptData.enable_bed_reservation ?? false,
        pricingTiers,
      };

      setApartment(apartmentDetail);
    } catch (err: any) {
      console.error('Error fetching apartment detail:', err);
      setError(err.message || 'Failed to load apartment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apartmentId]);

  return { apartment, loading, error, refetch: fetchData };
}
