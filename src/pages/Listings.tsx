import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import FiltersPanel from '@/components/shared/FiltersPanel';
import DormCard from '@/components/listings/DormCard';
import RoomCard from '@/components/listings/RoomCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useAuthGuard, useProfileCompletion } from '@/hooks/useAuthGuard';
import { useListingsQuery } from '@/hooks/useListingsQuery';

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
  const [filteredResults, setFilteredResults] = useState(data);

  useEffect(() => {
    applySearch();
  }, [data, searchQuery]);

  const applySearch = () => {
    if (!searchQuery.trim()) {
      setFilteredResults(data);
      return;
    }

    const query = searchQuery.toLowerCase();

    if (data.mode === 'dorm') {
      const filtered = data.dorms.filter(d => 
        d.dorm_name?.toLowerCase().includes(query) ||
        d.area?.toLowerCase().includes(query) ||
        d.services_amenities?.toLowerCase().includes(query)
      );
      setFilteredResults({ mode: 'dorm', dorms: filtered });
    } else {
      const filtered = data.rooms.filter(r =>
        r.dorm_name?.toLowerCase().includes(query) ||
        r.area?.toLowerCase().includes(query) ||
        r.type?.toLowerCase().includes(query) ||
        r.amenities.some(a => a.toLowerCase().includes(query))
      );
      setFilteredResults({ mode: 'room', rooms: filtered });
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-3">
            Available Dorms in Lebanon
          </h1>
          <p className="text-lg text-foreground/70">
            Explore verified listings and find your match.
          </p>
        </div>

        <div className="relative mb-6 animate-fade-in">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, location, or features (e.g., 'single room near AUB')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-lg bg-card/50 border-white/10"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-80 flex-shrink-0">
            <FiltersPanel 
              filters={filters}
              onFilterChange={handleFilterChange}
              dorms={data.mode === 'dorm' ? data.dorms : []}
            />
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-96 rounded-2xl glass animate-pulse" />
                ))}
              </div>
            ) : filteredResults.mode === 'dorm' && filteredResults.dorms.length === 0 ? (
              <div className="text-center py-16 glass-hover rounded-2xl">
                <p className="text-xl text-foreground/60">No dorms match your filters.</p>
                <p className="text-sm text-foreground/40 mt-2">Try adjusting your search criteria.</p>
              </div>
            ) : filteredResults.mode === 'room' && filteredResults.rooms.length === 0 ? (
              <div className="text-center py-16 glass-hover rounded-2xl">
                <p className="text-xl text-foreground/60">No rooms match your capacity filter.</p>
                <p className="text-sm text-foreground/40 mt-2">Try adjusting your search criteria.</p>
              </div>
            ) : filteredResults.mode === 'dorm' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredResults.dorms.map((dorm, idx) => (
                    <DormCard key={dorm.id} dorm={dorm} index={idx} />
                  ))}
                </div>
                <p className="text-sm text-foreground/60 mt-6 text-center">
                  Showing {filteredResults.dorms.length} verified dorms
                </p>
              </>
            ) : (
              <>
                <div className="mb-4 glass-hover rounded-xl p-4">
                  <p className="text-sm text-foreground/80">
                    Showing rooms for <span className="font-semibold text-primary">{filters.capacity}+ people</span>
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredResults.rooms.map((room, idx) => (
                    <RoomCard
                      key={`${room.dorm_id}-${room.type}-${idx}`}
                      room={room}
                      dormName={room.dorm_name}
                      dormArea={room.area}
                      university={room.university}
                      onViewDetails={() => navigate(`/dorm/${room.dorm_id}?room=${encodeURIComponent(room.type)}`)}
                      index={idx}
                    />
                  ))}
                </div>
                <p className="text-sm text-foreground/60 mt-6 text-center">
                  Showing {filteredResults.rooms.length} available rooms
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
