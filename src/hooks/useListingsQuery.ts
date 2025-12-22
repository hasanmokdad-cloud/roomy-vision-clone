import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DormPublic } from '@/types/dorm';
import { matchesRoomTypeFilter } from '@/data/roomTypes';

interface DormListing extends DormPublic {
  deposit?: number;
  city?: string;
  // walking_distance?: string; // TODO: Re-enable after distance algorithm implementation
  services_amenities?: string;
}

interface RoomType {
  type: string;
  capacity: number;
  price: number;
  amenities: string[];
  images?: string[];
}

type Dorm = DormPublic & {
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
  cities?: string[];
  shuttle?: 'all' | 'available' | 'none';
  genderPreference?: string[];
  amenities?: string[];
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
  const [error, setError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Wait for auth to be ready using retry-first approach
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      // Wait briefly for Supabase to hydrate from localStorage
      await new Promise(r => setTimeout(r, 50));
      
      // Try up to 3 times with short delays
      for (let attempt = 0; attempt < 3; attempt++) {
        if (!isMounted) return;
        
        try {
          await supabase.auth.getSession();
          if (isMounted) {
            setAuthReady(true);
          }
          return;
        } catch (e) {
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 100));
          }
        }
      }
      
      // Fallback: proceed anyway after retries
      if (isMounted) {
        setAuthReady(true);
      }
    };
    
    initAuth();

    // Listener for reactive updates only - skip during sign-out transition
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Skip if we're in the middle of signing out
      if (sessionStorage.getItem('roomy_signing_out') === 'true') {
        return;
      }
      
      // Only react to meaningful auth changes, not INITIAL_SESSION
      // INITIAL_SESSION is already handled by initAuth above
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        if (isMounted) {
          setAuthReady(true);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) {
      console.log('Waiting for auth to be ready...');
      return; // Don't query until auth is ready
    }

    console.log('Auth ready, loading listings...');
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
  }, [filters, authReady]);

  const loadListings = async () => {
    setLoading(true);
    console.log('Loading listings with filters:', filters);
    
    // Get current session for debugging
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session:', session?.user?.id ? 'Authenticated' : 'Anonymous');

    // Build base query with specific columns
    let query = supabase
      .from('dorms')
      .select('id, dorm_name, monthly_price, area, university, verification_status, cover_image, image_url, room_types, room_types_json, capacity, amenities, gender_preference, shuttle, available, created_at, updated_at, type, description, address, phone_number, email, website')
      .eq('available', true)
      .eq('verification_status', 'Verified')
      .order('dorm_name', { ascending: true });

    // Apply server-side filters
    if (filters.universities.length > 0) {
      query = query.in('university', filters.universities);
    }

    if (filters.areas.length > 0) {
      query = query.in('area', filters.areas);
    }

    if (filters.cities && filters.cities.length > 0) {
      query = query.in('area', filters.cities);
    }

    if (filters.shuttle && filters.shuttle !== 'all') {
      const shuttleValue = filters.shuttle === 'available';
      query = query.eq('shuttle', shuttleValue);
    }
    
    // Gender preference filter
    if (filters.genderPreference && filters.genderPreference.length > 0) {
      query = query.in('gender_preference', filters.genderPreference);
    }

    const { data: dorms, error } = await query;

    if (error) {
      console.error('Error fetching dorms:', error);
      setError('Unable to load listings. Please try again shortly.');
      setLoading(false);
      return;
    }

    if (!dorms || dorms.length === 0) {
      setData({ mode: 'dorm', dorms: [] });
      setError(null);
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
              // Filter by room type - use substring matching
                if (filters.roomTypes.length === 0 || 
                    filters.roomTypes.some(filterType => matchesRoomTypeFilter(room.type, filterType))) {
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

        // Room type filter - use substring matching
        let roomTypeMatch = filters.roomTypes.length === 0;
        if (!roomTypeMatch && roomTypesJson && Array.isArray(roomTypesJson)) {
          roomTypeMatch = roomTypesJson.some(room => 
            filters.roomTypes.some(filterType => matchesRoomTypeFilter(room.type, filterType))
          );
        } else if (!roomTypeMatch && dorm.room_types) {
          roomTypeMatch = filters.roomTypes.some(rt => 
            matchesRoomTypeFilter(dorm.room_types, rt)
          );
        }


        // Amenities filter
        let amenitiesMatch = true;
        if (filters.amenities && filters.amenities.length > 0) {
          const dormAmenities = dorm.amenities || [];
          amenitiesMatch = filters.amenities.every(amenity => 
            dormAmenities.some((da: string) => da.toLowerCase() === amenity.toLowerCase())
          );
        }

        return priceMatch && roomTypeMatch && amenitiesMatch;
      });

      setData({ mode: 'dorm', dorms: filteredDorms as unknown as Dorm[] });
    }

    setError(null);
    setLoading(false);
  };

  return { data, loading, error };
}
