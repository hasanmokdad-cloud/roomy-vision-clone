import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import FiltersPanel from '@/components/shared/FiltersPanel';
import DormCard from '@/components/shared/DormCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useAuthGuard, useProfileCompletion } from '@/hooks/useAuthGuard';

export default function Listings() {
  const { loading: authLoading, userId } = useAuthGuard();
  const { checkingProfile } = useProfileCompletion(userId);
  const [dorms, setDorms] = useState<any[]>([]);
  const [filteredDorms, setFilteredDorms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priceRange: [0, 2000] as [number, number],
    universities: [] as string[],
    areas: [] as string[],
    roomTypes: [] as string[],
  });

  useEffect(() => {
    loadDorms();
    
    // Real-time subscription
    const channel = supabase
      .channel('dorms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dorms' }, () => {
        loadDorms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [dorms, filters, searchQuery]);

  const loadDorms = async () => {
    const { data, error } = await supabase
      .from('dorms')
      .select('*')
      .eq('verification_status', 'Verified')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDorms(data);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let result = [...dorms];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.dorm_name?.toLowerCase().includes(query) ||
        d.area?.toLowerCase().includes(query) ||
        d.services_amenities?.toLowerCase().includes(query)
      );
    }

    // Price filter
    result = result.filter(d => {
      const price = d.monthly_price || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // University filter
    if (filters.universities.length > 0) {
      result = result.filter(d => filters.universities.includes(d.university));
    }

    // Area filter
    if (filters.areas.length > 0) {
      result = result.filter(d => filters.areas.includes(d.area));
    }

    // Room type filter
    if (filters.roomTypes.length > 0) {
      result = result.filter(d => 
        filters.roomTypes.some(rt => d.room_types?.includes(rt))
      );
    }

    setFilteredDorms(result);
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
              dorms={dorms}
            />
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-96 rounded-2xl glass animate-pulse" />
                ))}
              </div>
            ) : filteredDorms.length === 0 ? (
              <div className="text-center py-16 glass-hover rounded-2xl">
                <p className="text-xl text-foreground/60">No dorms match your filters.</p>
                <p className="text-sm text-foreground/40 mt-2">Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDorms.map((dorm, idx) => (
                  <div 
                    key={dorm.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <DormCard dorm={dorm} />
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredDorms.length > 0 && (
              <p className="text-sm text-foreground/60 mt-6 text-center">
                Showing {filteredDorms.length} of {dorms.length} verified dorms
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
