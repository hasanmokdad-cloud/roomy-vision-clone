import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { FilterChips } from '@/components/shared/FilterChips';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
// AI Compare disabled for now
// import { AISmartFilter } from '@/components/listings/AISmartFilter';
// import { DormComparison, DormComparisonCheckbox } from '@/components/listings/DormComparison';
import { AirbnbFiltersModal } from '@/components/listings/AirbnbFiltersModal';
import { useListingsQuery, type RoomListingItem } from '@/hooks/useListingsQuery';
import { sanitizeInput } from '@/utils/inputValidation';
import { CinematicDormCard } from '@/components/listings/CinematicDormCard';
import { EnhancedRoomCard } from '@/components/listings/EnhancedRoomCard';
import { ScrollImmersion } from '@/components/listings/ScrollImmersion';
import { ScrollToTopButton } from '@/components/listings/ScrollToTopButton';
import { DormCardSkeleton } from '@/components/skeletons/DormCardSkeleton';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SkipToContent } from '@/components/SkipToContent';
import { logAnalyticsEvent } from '@/utils/analytics';
import { subscribeTo, unsubscribeFrom } from '@/lib/supabaseRealtime';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { useScrollPreservation } from '@/hooks/useScrollPreservation';

export default function Listings() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState({
    priceRange: [0, 2000] as [number, number],
    universities: [] as string[],
    areas: [] as string[],
    roomTypes: [] as string[],
    capacity: undefined as number | undefined,
    cities: [] as string[],
    shuttle: 'all' as 'all' | 'available' | 'none',
    genderPreference: [] as string[],
    amenities: [] as string[],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [allRooms, setAllRooms] = useState<any[]>([]);

  // Enable scroll preservation
  useScrollPreservation();

  const { data, loading, error } = useListingsQuery(filters);
  const queryClient = useQueryClient();

  // Fetch all rooms for accurate filter count
  useEffect(() => {
    const fetchRooms = async () => {
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id, dorm_id, name, type, price, capacity, available');
      
      if (rooms) setAllRooms(rooms);
    };
    fetchRooms();
  }, []);

  // Real-time subscriptions for dorms and rooms
  useEffect(() => {
    const dormsChannel = subscribeTo("dorms", () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    });
    
    const roomsChannel = subscribeTo("rooms", () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    });

    return () => {
      unsubscribeFrom(dormsChannel);
      unsubscribeFrom(roomsChannel);
    };
  }, [queryClient]);

  // Load user session and log page view
  useEffect(() => {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const uid = session?.user?.id || null;
        setUserId(uid);
        
        // Log page view
        logAnalyticsEvent({
          eventType: 'page_view',
          userId: uid,
          metadata: { page: 'listings' }
        });
      });
    });
  }, []);

  // Get data based on mode
  const dorms = useMemo(() => {
    if (data.mode === 'dorm') {
      return data.dorms;
    }
    return [];
  }, [data]);

  const rooms = useMemo(() => {
    if (data.mode === 'room') {
      return data.rooms;
    }
    return [];
  }, [data]);

  const isRoomMode = data.mode === 'room';

  // Filter dorms by search query (only in dorm mode)
  const filteredDorms = useMemo(() => {
    if (!searchQuery.trim()) return dorms;

    const sanitized = sanitizeInput(searchQuery);
    const query = sanitized.substring(0, 120).toLowerCase();
    
    return dorms.filter(dorm =>
      dorm.dorm_name?.toLowerCase().includes(query) ||
      dorm.area?.toLowerCase().includes(query) ||
      dorm.address?.toLowerCase().includes(query) ||
      dorm.university?.toLowerCase().includes(query)
    );
  }, [dorms, searchQuery]);

  // Filter rooms by search query (only in room mode)
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;

    const sanitized = sanitizeInput(searchQuery);
    const query = sanitized.substring(0, 120).toLowerCase();
    
    return rooms.filter(room =>
      room.name?.toLowerCase().includes(query) ||
      room.type?.toLowerCase().includes(query) ||
      room.dorm.dorm_name?.toLowerCase().includes(query) ||
      room.dorm.area?.toLowerCase().includes(query) ||
      room.dorm.university?.toLowerCase().includes(query)
    );
  }, [rooms, searchQuery]);

  // Paginate results
  const paginatedDorms = useMemo(() => {
    const endIndex = currentPage * itemsPerPage;
    return filteredDorms.slice(0, endIndex);
  }, [filteredDorms, currentPage]);

  const paginatedRooms = useMemo(() => {
    const endIndex = currentPage * itemsPerPage;
    return filteredRooms.slice(0, endIndex);
  }, [filteredRooms, currentPage]);

  const hasMore = isRoomMode 
    ? filteredRooms.length > paginatedRooms.length
    : filteredDorms.length > paginatedDorms.length;

  const totalCount = isRoomMode ? filteredRooms.length : filteredDorms.length;
  const currentCount = isRoomMode ? paginatedRooms.length : paginatedDorms.length;

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset pagination when filters change
  }, []);

  const handleRemoveFilter = useCallback((category: 'universities' | 'areas' | 'roomTypes' | 'capacity' | 'cities' | 'genderPreference' | 'amenities', value?: string) => {
    setFilters(prev => {
      if (category === 'capacity') {
        return { ...prev, capacity: undefined };
      } else if (value) {
        return {
          ...prev,
          [category]: (prev[category] as string[]).filter((v) => v !== value)
        };
      }
      return prev;
    });
    setCurrentPage(1);
  }, []);

  const handleLoadMore = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const handleResetPrice = useCallback(() => {
    setFilters(prev => ({ ...prev, priceRange: [0, 2000] }));
    setCurrentPage(1);
  }, []);

  const handleAIFilters = useCallback((aiFilters: any) => {
    setFilters(prev => ({
      ...prev,
      ...(aiFilters.priceRange && { priceRange: aiFilters.priceRange }),
      ...(aiFilters.universities && { universities: aiFilters.universities }),
      ...(aiFilters.areas && { areas: aiFilters.areas }),
      ...(aiFilters.roomTypes && { roomTypes: aiFilters.roomTypes }),
    }));
    if (aiFilters.searchQuery) {
      setSearchQuery(aiFilters.searchQuery);
    }
    setCurrentPage(1);
  }, []);



  return (
    <div className="min-h-screen flex flex-col relative bg-white">
      <SkipToContent />
      {!isMobile && <RoomyNavbar />}
      
      <ScrollImmersion>
        <main id="main-content" className="flex-1 container mx-auto px-4 py-8 mt-20" role="main">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <Badge variant="secondary" className="mb-4 neon-glow">
            <Sparkles className="w-4 h-4 mr-2" />
            {isRoomMode 
              ? t('listings.browseRooms', 'Browse Available Rooms')
              : t('listings.browseVerified', 'Browse Verified Dorms')
            }
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black gradient-text mb-6">
            {isRoomMode
              ? t('listings.roomsTitle', 'Available Rooms in Lebanon')
              : t('listings.title', 'Available Dorms in Lebanon')
            }
          </h1>
          <p className="text-xl text-foreground/80">
            {isRoomMode
              ? t('listings.roomsSubtitle', 'Showing rooms that match your criteria.')
              : t('listings.subtitle', 'Explore verified dorms and find your perfect stay near campus.')
            }
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mb-8 flex gap-3"
          role="search"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" aria-hidden="true" />
            <Input
              type="text"
              placeholder={isRoomMode
                ? t('listings.searchRoomsPlaceholder', "Search rooms by name, type, or dorm...")
                : t('listings.searchPlaceholder', "Search by name, location, or features (e.g., 'single room near AUB')")
              }
              value={searchQuery}
              onChange={(e) => {
                const sanitized = sanitizeInput(e.target.value);
                const limited = sanitized.substring(0, 120);
                setSearchQuery(limited);
              }}
              className="pl-12 h-14 text-lg bg-background/30 backdrop-blur-xl border border-white/10 rounded-2xl placeholder:text-foreground/50"
              aria-label="Search listings"
            />
          </div>
          <Button
            variant="outline"
            className="h-14 px-6 bg-background/30 border border-white/10 hover:bg-background/40 rounded-2xl whitespace-nowrap"
            aria-label="Open filters"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="w-5 h-5 mr-2" />
            {t('common.filter', 'Filters')}
          </Button>
        </motion.div>

        {/* Airbnb-style Filters Modal */}
        <AirbnbFiltersModal
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          filters={filters}
          onFilterChange={handleFilterChange}
          dorms={dorms}
          rooms={allRooms}
        />

        <div className="flex flex-col gap-8">
          <div className="flex-1 space-y-6">

            <FilterChips
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onResetPrice={handleResetPrice}
            />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <DormCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 glass-hover rounded-3xl p-12"
              >
                <h3 className="text-2xl font-black gradient-text mb-4">{t('listings.connectionError', 'Connection Error')}</h3>
                <p className="text-foreground/70">
                  {error}
                </p>
              </motion.div>
            ) : (isRoomMode ? filteredRooms.length === 0 : filteredDorms.length === 0) ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 glass-hover rounded-3xl p-12"
              >
                <h3 className="text-2xl font-black gradient-text mb-4">
                  {isRoomMode 
                    ? t('listings.noRooms', 'No rooms match your criteria')
                    : t('listings.noDorms', 'No dorms available yet')
                  }
                </h3>
                <p className="text-foreground/70">
                  {isRoomMode
                    ? t('listings.adjustFilters', 'Try adjusting your filters to see more results.')
                    : t('listings.checkBack', 'Check back soon!')
                  }
                </p>
              </motion.div>
            ) : (
              <>
                <ErrorBoundary>
                  {isRoomMode ? (
                    // Room-level display
                    <div 
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
                      role="list"
                      aria-label="Room listings"
                    >
                      {paginatedRooms.map((room, index) => (
                        <EnhancedRoomCard
                          key={room.id}
                          room={room}
                          dormId={room.dorm.id}
                          dormName={room.dorm.dorm_name}
                          ownerId={room.dorm.owner_id}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    // Dorm-level display - max 4 cols
                    <div 
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
                      role="list"
                      aria-label="Dorm listings"
                    >
                      {paginatedDorms.map((dorm, index) => (
                        <CinematicDormCard 
                          key={dorm.id}
                          dorm={dorm} 
                          index={index}
                        />
                      ))}
                    </div>
                  )}
                </ErrorBoundary>
                {currentCount > 0 && (
                  <div className="text-center mt-8 space-y-4" role="status" aria-live="polite">
                    <p className="text-sm text-foreground/60">
                      {isRoomMode
                        ? t('listings.showingRooms', 'Showing {{current}} of {{total}} matching rooms', { current: currentCount, total: totalCount })
                        : t('listings.showing', 'Showing {{current}} of {{total}} verified dorms', { current: currentCount, total: totalCount })
                      }
                    </p>
                    {hasMore && (
                      <Button 
                        onClick={handleLoadMore} 
                        variant="outline" 
                        size="lg" 
                        className="px-8"
                        aria-label={`Load more. Currently showing ${currentCount} of ${totalCount}`}
                      >
                        {t('buttons.loadMore', 'Load More')}
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <ScrollToTopButton />
      <Footer />
      </ScrollImmersion>
    </div>
  );
}
