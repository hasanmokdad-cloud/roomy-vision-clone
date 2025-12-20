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
import { AISmartFilter } from '@/components/listings/AISmartFilter';
import { DormComparison, DormComparisonCheckbox } from '@/components/listings/DormComparison';
import { AirbnbFiltersModal } from '@/components/listings/AirbnbFiltersModal';
import { useListingsQuery } from '@/hooks/useListingsQuery';
import { sanitizeInput } from '@/utils/inputValidation';
import { CinematicDormCard } from '@/components/listings/CinematicDormCard';
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
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);

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

  // Get real dorms from Supabase
  const dorms = useMemo(() => {
    if (data.mode === 'dorm') {
      return data.dorms;
    }
    return [];
  }, [data]);

  // Filter dorms by search query
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

  // Paginate results
  const paginatedDorms = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * itemsPerPage;
    return filteredDorms.slice(startIndex, endIndex);
  }, [filteredDorms, currentPage]);

  const hasMore = filteredDorms.length > paginatedDorms.length;

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
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
  }, []);

  const handleLoadMore = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const handleResetPrice = useCallback(() => {
    setFilters(prev => ({ ...prev, priceRange: [0, 2000] }));
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
  }, []);

  const toggleComparisonSelection = useCallback((dormId: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(dormId)) {
        return prev.filter(id => id !== dormId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, dormId];
    });
  }, []);


  return (
    <div className="min-h-screen flex flex-col relative">
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
            {t('listings.browseVerified', 'Browse Verified Dorms')}
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black gradient-text mb-6">
            {t('listings.title', 'Available Dorms in Lebanon')}
          </h1>
          <p className="text-xl text-foreground/80">
            {t('listings.subtitle', 'Explore verified dorms and find your perfect stay near campus.')}
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
              placeholder={t('listings.searchPlaceholder', "Search by name, location, or features (e.g., 'single room near AUB')")}
              value={searchQuery}
              onChange={(e) => {
                const sanitized = sanitizeInput(e.target.value);
                const limited = sanitized.substring(0, 120);
                setSearchQuery(limited);
              }}
              className="pl-12 h-14 text-lg bg-background/30 backdrop-blur-xl border border-white/10 rounded-2xl placeholder:text-foreground/50"
              aria-label="Search dorms by name, location, or features"
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

        {/* AI Smart Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <AISmartFilter onFiltersApplied={handleAIFilters} userId={userId} />
        </motion.div>

        <div className="flex flex-col gap-8">
          <div className="flex-1 space-y-6">

            <FilterChips
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onResetPrice={handleResetPrice}
            />

            {/* Dorm Comparison */}
            {filteredDorms.length > 0 && (
              <DormComparison dorms={filteredDorms} userId={userId} />
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
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
            ) : filteredDorms.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 glass-hover rounded-3xl p-12"
              >
                <h3 className="text-2xl font-black gradient-text mb-4">{t('listings.noDorms', 'No dorms available yet')}</h3>
                <p className="text-foreground/70">
                  {t('listings.checkBack', 'Check back soon!')}
                </p>
              </motion.div>
            ) : (
              <>
                <ErrorBoundary>
                  <div 
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                    role="list"
                    aria-label="Dorm listings"
                  >
                    {paginatedDorms.map((dorm, index) => (
                      <div key={dorm.id} className="relative">
                        <DormComparisonCheckbox
                          dormId={dorm.id}
                          isSelected={selectedForComparison.includes(dorm.id)}
                          onToggle={toggleComparisonSelection}
                        />
                        <CinematicDormCard 
                          dorm={dorm} 
                          index={index}
                        />
                      </div>
                    ))}
                  </div>
                </ErrorBoundary>
                {paginatedDorms.length > 0 && (
                  <div className="text-center mt-8 space-y-4" role="status" aria-live="polite">
                    <p className="text-sm text-foreground/60">
                      {t('listings.showing', 'Showing {{current}} of {{total}} verified dorms', { current: paginatedDorms.length, total: filteredDorms.length })}
                    </p>
                    {hasMore && (
                      <Button 
                        onClick={handleLoadMore} 
                        variant="outline" 
                        size="lg" 
                        className="px-8"
                        aria-label={`Load more dorms. Currently showing ${paginatedDorms.length} of ${filteredDorms.length}`}
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
