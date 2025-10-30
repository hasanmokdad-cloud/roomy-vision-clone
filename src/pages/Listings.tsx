import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import FiltersPanel from '@/components/shared/FiltersPanel';
import { FilterChips } from '@/components/shared/FilterChips';
import { DormGrid } from '@/components/dorms/DormGrid';
import { UnderwaterScene } from '@/components/UnderwaterScene';
import { Input } from '@/components/ui/input';
import { Search, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuthGuard, useProfileCompletion } from '@/hooks/useAuthGuard';
import { useListingsQuery } from '@/hooks/useListingsQuery';
import { seedDorms, SeedDorm, SeedRoom } from '@/data/dorms.seed';
import { deriveCapacity } from '@/lib/capacity';

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
  });

  const { data, loading } = useListingsQuery(filters);

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

    const query = searchQuery.toLowerCase();
    return dorms.filter(dorm =>
      dorm.name.toLowerCase().includes(query) ||
      dorm.area.toLowerCase().includes(query) ||
      dorm.rooms.some(r => 
        r.roomType.toLowerCase().includes(query) ||
        r.amenities.some(a => a.toLowerCase().includes(query))
      )
    );
  }, [dorms, searchQuery]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleRemoveFilter = (category: 'universities' | 'areas' | 'roomTypes' | 'capacity', value?: string) => {
    if (category === 'capacity') {
      setFilters({ ...filters, capacity: undefined });
    } else if (value) {
      setFilters({
        ...filters,
        [category]: filters[category].filter((v) => v !== value)
      });
    }
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
    <div className="min-h-screen flex flex-col bg-background relative">
      <UnderwaterScene />
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
            Explore verified listings and find your match.
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-lg bg-card/50 border-white/10 glass rounded-2xl"
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
                  <div key={i} className="h-96 rounded-2xl glass animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <DormGrid 
                  dorms={filteredDorms} 
                  capacityFilter={filters.capacity}
                />
                {filteredDorms.length > 0 && (
                  <p className="text-sm text-foreground/60 mt-8 text-center">
                    Showing {filteredDorms.length} verified dorms
                    {filters.capacity && ` with rooms for ${filters.capacity}+ people`}
                  </p>
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
