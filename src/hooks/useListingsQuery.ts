import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DormPublic } from '@/types/dorm';
import { matchesRoomTypeFilter } from '@/data/roomTypes';

interface DormListing extends DormPublic {
  deposit?: number;
  city?: string;
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

export interface RoomListingItem {
  id: string;
  name: string;
  type: string;
  price: number;
  deposit?: number;
  capacity?: number;
  capacity_occupied?: number;
  available: boolean;
  images?: string[];
  video_url?: string;
  description?: string;
  area_m2?: number;
  dorm: {
    id: string;
    dorm_name: string;
    area?: string;
    university?: string;
    cover_image?: string;
    owner_id: string;
    verification_status?: string;
  };
}

interface DormModeResult {
  mode: 'dorm';
  dorms: Dorm[];
}

interface RoomModeResult {
  mode: 'room';
  rooms: RoomListingItem[];
}

type ListingsResult = DormModeResult | RoomModeResult;

// Check if room-specific filters are active
function hasRoomFilters(filters: Filters): boolean {
  const hasPrice = filters.priceRange[0] > 0 || filters.priceRange[1] < 2000;
  const hasRoomType = filters.roomTypes.length > 0;
  const hasCapacity = filters.capacity !== undefined && filters.capacity > 0;
  return hasPrice || hasRoomType || hasCapacity;
}

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

    // Check if we need room-level display
    const needsRoomDisplay = hasRoomFilters(filters);
    
    if (needsRoomDisplay) {
      // ROOM MODE: Query rooms with their parent dorm info
      console.log('Room mode: querying rooms table with filters');
      
      let roomsQuery = supabase
        .from('rooms')
        .select(`
          id, name, type, price, deposit, capacity, capacity_occupied, available, 
          images, video_url, description, area_m2,
          dorms!inner (
            id, dorm_name, area, university, cover_image, owner_id, verification_status, available
          )
        `)
        .eq('available', true)
        .eq('dorms.verification_status', 'Verified')
        .eq('dorms.available', true);
      
      // Apply price filter
      if (filters.priceRange[0] > 0) {
        roomsQuery = roomsQuery.gte('price', filters.priceRange[0]);
      }
      if (filters.priceRange[1] < 2000) {
        roomsQuery = roomsQuery.lte('price', filters.priceRange[1]);
      }
      
      // Apply capacity filter
      if (filters.capacity && filters.capacity > 0) {
        roomsQuery = roomsQuery.gte('capacity', filters.capacity);
      }
      
      const { data: rooms, error: roomsError } = await roomsQuery;
      
      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        setError('Unable to load listings. Please try again shortly.');
        setLoading(false);
        return;
      }
      
      // Filter rooms by room type (needs client-side matching)
      let filteredRooms = rooms || [];
      if (filters.roomTypes.length > 0) {
        filteredRooms = filteredRooms.filter(room => 
          filters.roomTypes.some(filterType => matchesRoomTypeFilter(room.type, filterType))
        );
      }
      
      // Apply dorm-level filters (university, area)
      if (filters.universities.length > 0) {
        filteredRooms = filteredRooms.filter(room => 
          filters.universities.includes((room.dorms as any).university)
        );
      }
      
      if (filters.areas.length > 0) {
        filteredRooms = filteredRooms.filter(room => 
          filters.areas.includes((room.dorms as any).area)
        );
      }
      
      // Transform to RoomListingItem format
      const transformedRooms: RoomListingItem[] = filteredRooms.map(room => ({
        id: room.id,
        name: room.name,
        type: room.type,
        price: room.price,
        deposit: room.deposit,
        capacity: room.capacity,
        capacity_occupied: room.capacity_occupied,
        available: room.available,
        images: room.images,
        video_url: room.video_url,
        description: room.description,
        area_m2: room.area_m2,
        dorm: {
          id: (room.dorms as any).id,
          dorm_name: (room.dorms as any).dorm_name,
          area: (room.dorms as any).area,
          university: (room.dorms as any).university,
          cover_image: (room.dorms as any).cover_image,
          owner_id: (room.dorms as any).owner_id,
          verification_status: (room.dorms as any).verification_status,
        }
      }));
      
      console.log(`Found ${transformedRooms.length} matching rooms`);
      
      setData({ mode: 'room', rooms: transformedRooms });
      setError(null);
      setLoading(false);
      return;
    }

    // DORM MODE: Standard dorm-level query
    let query = supabase
      .from('dorms')
      .select('id, dorm_name, monthly_price, area, university, verification_status, cover_image, image_url, room_types, room_types_json, capacity, amenities, gender_preference, shuttle, available, created_at, updated_at, type, description, address, phone_number, email, website')
      .eq('available', true)
      .eq('verification_status', 'Verified')
      .order('dorm_name', { ascending: true });

    // Apply server-side dorm-level filters
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

    // Apply amenities filter
    let filteredDorms = dorms;
    if (filters.amenities && filters.amenities.length > 0) {
      filteredDorms = filteredDorms.filter(dorm => {
        const dormAmenities = dorm.amenities || [];
        return filters.amenities!.every(amenity => 
          dormAmenities.some((da: string) => da.toLowerCase() === amenity.toLowerCase())
        );
      });
    }

    setData({ mode: 'dorm', dorms: filteredDorms as unknown as Dorm[] });
    setError(null);
    setLoading(false);
  };

  return { data, loading, error };
}
