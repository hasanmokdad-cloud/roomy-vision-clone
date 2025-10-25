import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RoomType {
  type: string;
  capacity: number;
  price: number;
  amenities: string[];
  images?: string[];
}

interface Dorm {
  id: string;
  dorm_name: string;
  area?: string;
  university?: string;
  monthly_price?: number;
  verification_status?: string;
  cover_image?: string;
  image_url?: string;
  room_types_json?: RoomType[];
  services_amenities?: string;
  room_types?: string;
}

interface Filters {
  priceRange: [number, number];
  universities: string[];
  areas: string[];
  roomTypes: string[];
  capacity?: number;
}

interface DormModeResult {
  mode: 'dorm';
  dorms: Dorm[];
}

interface RoomModeResult {
  mode: 'room';
  rooms: Array<{
    dorm_id: string;
    dorm_name: string;
    area?: string;
    university?: string;
    type: string;
    capacity: number;
    price: number;
    amenities: string[];
    images?: string[];
    cover_image?: string;
    verification_status?: string;
  }>;
}

type ListingsResult = DormModeResult | RoomModeResult;

export function useListingsQuery(filters: Filters) {
  const [data, setData] = useState<ListingsResult>({ mode: 'dorm', dorms: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();

    const channel = supabase
      .channel('dorms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dorms' }, () => {
        loadListings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters]);

  const loadListings = async () => {
    setLoading(true);

    // Build base query
    let query = supabase
      .from('dorms')
      .select('*')
      .eq('verification_status', 'Verified')
      .order('created_at', { ascending: false });

    // Apply server-side filters
    if (filters.universities.length > 0) {
      query = query.in('university', filters.universities);
    }

    if (filters.areas.length > 0) {
      query = query.in('area', filters.areas);
    }

    const { data: dorms, error } = await query;

    if (error || !dorms) {
      setLoading(false);
      return;
    }

    // Client-side filtering and mode determination
    const hasCapacityFilter = filters.capacity !== undefined && filters.capacity > 0;

    if (hasCapacityFilter) {
      // ROOM MODE: Flatten to individual rooms
      const rooms: RoomModeResult['rooms'] = [];

      dorms.forEach(dorm => {
        const roomTypesJson = dorm.room_types_json as unknown as RoomType[] | null;
        
        if (roomTypesJson && Array.isArray(roomTypesJson)) {
          roomTypesJson.forEach(room => {
            // Filter by capacity
            if (room.capacity >= filters.capacity!) {
              // Filter by price
              if (room.price >= filters.priceRange[0] && room.price <= filters.priceRange[1]) {
                // Filter by room type
                if (filters.roomTypes.length === 0 || filters.roomTypes.includes(room.type)) {
                  rooms.push({
                    dorm_id: dorm.id,
                    dorm_name: dorm.dorm_name,
                    area: dorm.area,
                    university: dorm.university,
                    type: room.type,
                    capacity: room.capacity,
                    price: room.price,
                    amenities: room.amenities || [],
                    images: room.images || [],
                    cover_image: dorm.cover_image || dorm.image_url,
                    verification_status: dorm.verification_status,
                  });
                }
              }
            }
          });
        }
      });

      setData({ mode: 'room', rooms });
    } else {
      // DORM MODE: Show dorm cards
      let filteredDorms = dorms.filter(dorm => {
        // Price filter (check if any room is in range OR use monthly_price fallback)
        const roomTypesJson = dorm.room_types_json as unknown as RoomType[] | null;
        let priceMatch = false;

        if (roomTypesJson && Array.isArray(roomTypesJson)) {
          priceMatch = roomTypesJson.some(room => 
            room.price >= filters.priceRange[0] && room.price <= filters.priceRange[1]
          );
        } else if (dorm.monthly_price) {
          priceMatch = dorm.monthly_price >= filters.priceRange[0] && dorm.monthly_price <= filters.priceRange[1];
        } else {
          priceMatch = true; // Include if no price info
        }

        // Room type filter
        let roomTypeMatch = filters.roomTypes.length === 0;
        if (!roomTypeMatch && roomTypesJson && Array.isArray(roomTypesJson)) {
          roomTypeMatch = roomTypesJson.some(room => filters.roomTypes.includes(room.type));
        } else if (!roomTypeMatch && dorm.room_types) {
          roomTypeMatch = filters.roomTypes.some(rt => dorm.room_types?.includes(rt));
        }

        return priceMatch && roomTypeMatch;
      });

      setData({ mode: 'dorm', dorms: filteredDorms as unknown as Dorm[] });
    }

    setLoading(false);
  };

  return { data, loading };
}
