import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Loader2, SlidersHorizontal, Share2 } from 'lucide-react';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedRoomCard } from '@/components/listings/EnhancedRoomCard';
import { ShareCollectionDialog } from '@/components/shared/ShareCollectionDialog';

type SortOption = 'recent' | 'price-asc' | 'price-desc' | 'name';

export default function SavedRooms() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading: authLoading, userId } = useAuthGuard();
  const isMobile = useIsMobile();
  const [savedRooms, setSavedRooms] = useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);
  
  // Share collection states
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [existingCollection, setExistingCollection] = useState<any>(null);

  // Auth state listener to handle sign out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!authLoading && userId) {
      loadSavedRooms();

      // Real-time subscription
      const channel = supabase
        .channel('saved_rooms_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'saved_rooms',
            filter: `student_id=eq.${userId}`,
          },
          () => {
            loadSavedRooms();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading, userId]);

  // Apply filters and sorting when data or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [savedRooms, priceRange, selectedType, sortBy]);

  const loadSavedRooms = async () => {
    try {
      setLoading(true);
      
      // Get saved rooms with created_at for sorting
      const { data: savedItems, error: savedError } = await supabase
        .from('saved_rooms')
        .select('room_id, dorm_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (savedError) throw savedError;

      if (!savedItems || savedItems.length === 0) {
        setSavedRooms([]);
        setLoading(false);
        return;
      }

      const roomIds = savedItems.map(item => item.room_id);

      // Get room details with dorm info
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          dorms!inner (
            id,
            name,
            area,
            owner_id,
            amenities
          )
        `)
        .in('id', roomIds)
        .eq('available', true);

      if (roomsError) throw roomsError;

      // Merge created_at from saved_items
      const roomsWithSaveDate = (rooms || []).map(room => {
        const savedItem = savedItems.find(item => item.room_id === room.id);
        return {
          ...room,
          savedAt: savedItem?.created_at,
        };
      });

      setSavedRooms(roomsWithSaveDate);
    } catch (error: any) {
      console.error('Error loading saved rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved rooms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...savedRooms];

    // Price filter
    filtered = filtered.filter(
      room => room.price >= priceRange[0] && room.price <= priceRange[1]
    );

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(
        room => room.type.toLowerCase() === selectedType
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
      default:
        // Already sorted by savedAt from query
        break;
    }

    setFilteredRooms(filtered);
  };

  const handleClearFilters = () => {
    setPriceRange([0, 2000]);
    setSelectedType('all');
    setSortBy('recent');
  };

  const handleShareCollection = async () => {
    if (savedRooms.length === 0) {
      toast({
        title: 'No rooms to share',
        description: 'Save some rooms first before sharing your collection',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingLink(true);
    
    try {
      // Check if user already has a collection
      const { data: existing } = await supabase
        .from('shared_collections')
        .select('*')
        .eq('student_id', userId)
        .maybeSingle();

      let shareCode: string;
      
      if (existing) {
        shareCode = existing.share_code;
        setExistingCollection(existing);
      } else {
        // Create new collection
        const { data: newCollection, error } = await supabase
          .from('shared_collections')
          .insert({
            student_id: userId,
            title: 'My Saved Rooms',
            share_code: '', // Will be auto-generated by trigger
          } as any)
          .select()
          .single();

        if (error) throw error;
        
        shareCode = newCollection.share_code;
        setExistingCollection(newCollection);
      }

      const url = `${window.location.origin}/shared/${shareCode}`;
      setShareUrl(url);
      setShowShareDialog(true);
    } catch (error: any) {
      console.error('Error creating share link:', error);
      toast({
        title: 'Error',
        description: 'Failed to create share link',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleUpdateCollection = async (updates: any) => {
    if (!existingCollection) return;

    const { error } = await supabase
      .from('shared_collections')
      .update(updates)
      .eq('id', existingCollection.id);

    if (error) throw error;

    setExistingCollection({ ...existingCollection, ...updates });
  };

  if (authLoading) return null;

  const roomTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' },
    { value: 'triple', label: 'Triple' },
    { value: 'studio', label: 'Studio' },
    { value: 'suite', label: 'Suite' },
  ];

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-background to-muted/20">
      {!isMobile && <RoomyNavbar />}

      <div className="container mx-auto px-4 md:px-6 py-32 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/settings')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Button>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-base">
              {filteredRooms.length} {filteredRooms.length === 1 ? 'Room' : 'Rooms'}
            </Badge>
            
            {savedRooms.length > 0 && (
              <Button
                onClick={handleShareCollection}
                disabled={isGeneratingLink}
                className="bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              >
                <Share2 className="w-4 h-4 mr-2" />
                {isGeneratingLink ? 'Generating...' : 'Share Collection'}
              </Button>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Home className="w-8 h-8 text-secondary" />
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">My Saved Rooms</h1>
          </div>
          <p className="text-muted-foreground text-lg mb-8">
            Rooms you've bookmarked for later
          </p>

          {/* Filters & Sort Bar */}
          {!loading && savedRooms.length > 0 && (
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-8 border border-border/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Filters</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Price Range */}
                <div className="space-y-3">
                  <Label className="text-foreground">
                    Price: ${priceRange[0]} - ${priceRange[1]}
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={2000}
                    step={50}
                    className="py-2"
                  />
                </div>

                {/* Room Type */}
                <div className="space-y-3">
                  <Label className="text-foreground">Room Type</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="bg-background/50 border-border text-foreground">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-3">
                  <Label className="text-foreground">Sort By</Label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="bg-background/50 border-border text-foreground">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recently Saved</SelectItem>
                      <SelectItem value="price-asc">Price: Low to High</SelectItem>
                      <SelectItem value="price-desc">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : savedRooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-card/50 backdrop-blur-sm rounded-3xl p-12 text-center border border-border/40"
            >
              <Home className="w-16 h-16 text-secondary/40 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-3">No Saved Rooms Yet</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Start exploring and save your favorite rooms to keep them here for easy access.
              </p>
              <Button
                onClick={() => navigate('/listings')}
                className="bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
              >
                Explore Dorms
              </Button>
            </motion.div>
          ) : filteredRooms.length === 0 ? (
            <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-12 text-center border border-border/40">
              <SlidersHorizontal className="w-16 h-16 text-primary/40 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-3">No Rooms Match Your Filters</h2>
              <p className="text-muted-foreground mb-6">Try adjusting your filters to see more results.</p>
              <Button
                variant="outline"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
              {filteredRooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <EnhancedRoomCard
                    room={room}
                    dormId={room.dorms.id}
                    dormName={room.dorms.name}
                    ownerId={room.dorms.owner_id}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {isMobile && <BottomNav />}
      <Footer />

      {/* Share Collection Dialog */}
      {showShareDialog && existingCollection && (
        <ShareCollectionDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          shareUrl={shareUrl}
          collection={existingCollection}
          onUpdateCollection={handleUpdateCollection}
        />
      )}
    </div>
  );
}
