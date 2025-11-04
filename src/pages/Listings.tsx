import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import FiltersPanel from '@/components/shared/FiltersPanel';
import { FilterChips } from '@/components/shared/FilterChips';
import { DormGrid } from '@/components/dorms/DormGrid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuthGuard, useProfileCompletion } from '@/hooks/useAuthGuard';
import { useListingsQuery } from '@/hooks/useListingsQuery';
import { seedDorms, SeedDorm, SeedRoom } from '@/data/dorms.seed';
import { deriveCapacity } from '@/lib/capacity';
import { sanitizeInput } from '@/utils/inputValidation';

export default function Listings() {
  const navigate = useNavigate();
  const { loading: authLoading, userId } = useAuthGuard();
  const { checkingProfile } = useProfileCompletion(userId);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Cache data in sessionStorage
  useEffect(() => {
    if (data.mode === 'dorm' && data.dorms.length > 0) {
      sessionStorage.setItem('roomy_dorms_cache', JSON.stringify(data.dorms));
      sessionStorage.setItem('roomy_dorms_cache_time', Date.now().toString());
    }
  }, [data]);

  // Convert real data to SeedDorm format, or use seed data if empty
  const dorms = useMemo(() => {
    if (data.mode === 'dorm' && data.dorms.length > 0) {
      // Convert real dorms to seed format
      return data.dorms.map((dorm): SeedDorm => {
        const roomTypesJson = dorm.room_types_json as any[] | null;
        const rooms: SeedRoom[] = roomTypesJson?.map((rt, idx) => ({
          id: `${dorm.id}-room-${idx}`,
          roomType: rt.type || 'Room',
          price: rt.price || dorm.monthly_price || 0,
          capacity: deriveCapacity(rt.type || 'Room'),
          amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
          utilities: 'Contact for details',
          nearUniversity: dorm.university,
        })) || [];

        return {
          id: dorm.id,
          slug: `dorm-${dorm.id}`,
          name: dorm.dorm_name || 'Dorm',
          area: dorm.area || 'Unknown',
          exteriorPhoto: dorm.cover_image || dorm.image_url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
          verified: dorm.verification_status === 'Verified',
          distanceToUniversities: {
            [dorm.university || 'University']: 'Nearby',
          },
          rooms,
          minPrice: Math.min(...rooms.map(r => r.price), dorm.monthly_price || Infinity),
        };
      });
    }
    // Fallback to seed data if no real data
    return seedDorms;
  }, [data]);

  // Filter dorms by search query
  const filteredDorms = useMemo(() => {
    if (!searchQuery.trim()) return dorms;

    // Sanitize and limit search query
    const sanitized = sanitizeInput(searchQuery);
    const query = sanitized.substring(0, 120).toLowerCase();
    
    return dorms.filter(dorm =>
      dorm.name.toLowerCase().includes(query) ||
      dorm.area.toLowerCase().includes(query) ||
      dorm.rooms.some(r => 
        r.roomType.toLowerCase().includes(query) ||
        r.amenities.some(a => a.toLowerCase().includes(query))
      )
    );
  }, [dorms, searchQuery]);

  // Paginate results
  const paginatedDorms = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * itemsPerPage;
    return filteredDorms.slice(startIndex, endIndex);
  }, [filteredDorms, currentPage]);

  const hasMore = filteredDorms.length > paginatedDorms.length;

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleRemoveFilter = (category: 'universities' | 'areas' | 'roomTypes' | 'capacity' | 'cities', value?: string) => {
    if (category === 'capacity') {
      setFilters({ ...filters, capacity: undefined });
    } else if (value) {
      setFilters({
        ...filters,
        [category]: filters[category].filter((v) => v !== value)
      });
    }
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleResetPrice = () => {
    setFilters({ ...filters, priceRange: [0, 2000] });
  };

  if (authLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
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
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, location, or features (e.g., 'single room near AUB')"
            value={searchQuery}
            onChange={(e) => {
              const sanitized = sanitizeInput(e.target.value);
              const limited = sanitized.substring(0, 120);
              setSearchQuery(limited);
            }}
            className="pl-12 h-14 text-lg bg-white border-gray-200 rounded-2xl shadow-sm"
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
                  <div key={i} className="h-96 rounded-2xl bg-white animate-pulse shadow-sm" />
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
                <h3 className="text-2xl font-black gradient-text mb-4">No dorms match your search</h3>
                <p className="text-foreground/70">
                  Try adjusting filters or check back later.
                </p>
              </motion.div>
            ) : (
              <>
                <DormGrid 
                  dorms={paginatedDorms} 
                  capacityFilter={filters.capacity}
                />
                {paginatedDorms.length > 0 && (
                  <div className="text-center mt-8 space-y-4">
                    <p className="text-sm text-foreground/60">
                      Showing {paginatedDorms.length} of {filteredDorms.length} verified dorms
                      {filters.capacity && ` with rooms for ${filters.capacity}+ people`}
                    </p>
                    {hasMore && (
                      <Button onClick={handleLoadMore} variant="outline" size="lg" className="px-8">
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

      <Footer />
    </div>
  );
}
