import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import FiltersPanel from '@/components/shared/FiltersPanel';
import { FilterChips } from '@/components/shared/FilterChips';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useListingsQuery } from '@/hooks/useListingsQuery';
import { sanitizeInput } from '@/utils/inputValidation';
import { CinematicDormCard } from '@/components/listings/CinematicDormCard';
import { ScrollImmersion } from '@/components/listings/ScrollImmersion';
import { ScrollToTopButton } from '@/components/listings/ScrollToTopButton';
import { DormCardSkeleton } from '@/components/skeletons/DormCardSkeleton';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SkipToContent } from '@/components/SkipToContent';

export default function Listings() {
  const navigate = useNavigate();
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
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data, loading, error } = useListingsQuery(filters);

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

  const handleRemoveFilter = useCallback((category: 'universities' | 'areas' | 'roomTypes' | 'capacity' | 'cities', value?: string) => {
    setFilters(prev => {
      if (category === 'capacity') {
        return { ...prev, capacity: undefined };
      } else if (value) {
        return {
          ...prev,
          [category]: prev[category].filter((v) => v !== value)
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


  return (
    <div className="min-h-screen flex flex-col relative">
      <SkipToContent />
      <Navbar />
      
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
            Browse Verified Dorms
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black gradient-text mb-6">
            Available Dorms in Lebanon
          </h1>
          <p className="text-xl text-foreground/80">
            Explore verified dorms and find your perfect stay near campus.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mb-8"
          role="search"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" aria-hidden="true" />
          <Input
            type="text"
            placeholder="Search by name, location, or features (e.g., 'single room near AUB')"
            value={searchQuery}
            onChange={(e) => {
              const sanitized = sanitizeInput(e.target.value);
              const limited = sanitized.substring(0, 120);
              setSearchQuery(limited);
            }}
            className="pl-12 h-14 text-lg bg-background/30 backdrop-blur-xl border border-white/10 rounded-2xl placeholder:text-foreground/50"
            aria-label="Search dorms by name, location, or features"
          />
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-80 flex-shrink-0">
            <FiltersPanel 
              filters={filters}
              onFilterChange={handleFilterChange}
              dorms={data.mode === 'dorm' ? data.dorms : []}
            />
          </aside>

          <div className="flex-1 space-y-6">
            <FilterChips
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onResetPrice={handleResetPrice}
            />

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
                <h3 className="text-2xl font-black gradient-text mb-4">Connection Error</h3>
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
                <h3 className="text-2xl font-black gradient-text mb-4">No dorms available yet</h3>
                <p className="text-foreground/70">
                  Check back soon!
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
                      <CinematicDormCard 
                        key={dorm.id} 
                        dorm={dorm} 
                        index={index}
                      />
                    ))}
                  </div>
                </ErrorBoundary>
                {paginatedDorms.length > 0 && (
                  <div className="text-center mt-8 space-y-4" role="status" aria-live="polite">
                    <p className="text-sm text-foreground/60">
                      Showing {paginatedDorms.length} of {filteredDorms.length} verified dorms
                    </p>
                    {hasMore && (
                      <Button 
                        onClick={handleLoadMore} 
                        variant="outline" 
                        size="lg" 
                        className="px-8"
                        aria-label={`Load more dorms. Currently showing ${paginatedDorms.length} of ${filteredDorms.length}`}
                      >
                        Load More
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
