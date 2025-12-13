import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Loader2 } from 'lucide-react';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { CinematicDormCard } from '@/components/listings/CinematicDormCard';

export default function SavedDorms() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading: authLoading, userId } = useAuthGuard();
  const isMobile = useIsMobile();
  const [savedDorms, setSavedDorms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth state listener to handle sign out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/listings');
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Loading timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authLoading) {
        console.warn('Auth loading timed out on SavedDorms');
        navigate('/listings');
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && userId) {
      loadSavedDorms();

      // Set up real-time subscription to reload when items are unsaved
      const channel = supabase
        .channel('saved_items_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'saved_items',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            loadSavedDorms();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading, userId]);

  const loadSavedDorms = async () => {
    try {
      setLoading(true);
      
      // Get saved item IDs
      const { data: savedItems, error: savedError } = await supabase
        .from('saved_items')
        .select('item_id')
        .eq('user_id', userId)
        .eq('item_type', 'dorm');

      if (savedError) throw savedError;

      if (!savedItems || savedItems.length === 0) {
        setSavedDorms([]);
        setLoading(false);
        return;
      }

      const dormIds = savedItems.map(item => item.item_id);

      // Get dorm details
      const { data: dorms, error: dormsError } = await supabase
        .from('dorms')
        .select('*')
        .in('id', dormIds)
        .eq('verification_status', 'Verified')
        .eq('available', true);

      if (dormsError) throw dormsError;

      setSavedDorms(dorms || []);
    } catch (error: any) {
      console.error('Error loading saved dorms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved dorms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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

          <Badge variant="secondary" className="text-base">
            {savedDorms.length} {savedDorms.length === 1 ? 'Dorm' : 'Dorms'}
          </Badge>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">My Saved Dorms</h1>
          </div>
          <p className="text-muted-foreground text-lg mb-12">
            Dorms you've bookmarked for later
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : savedDorms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-card/50 backdrop-blur-sm rounded-3xl p-12 text-center border border-border/40"
            >
              <Heart className="w-16 h-16 text-primary/40 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-3">No Saved Dorms Yet</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Start exploring and save your favorite dorms to keep them here for easy access.
              </p>
              <Button
                onClick={() => navigate('/listings')}
                className="bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
              >
                Explore Dorms
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedDorms.map((dorm, index) => (
                <motion.div
                  key={dorm.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <CinematicDormCard
                    dorm={dorm}
                    index={index}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {isMobile && <BottomNav />}
      <Footer />
    </div>
  );
}
