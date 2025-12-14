import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Building2, DoorOpen } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';

export default function Wishlists() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAuthenticated, isAuthReady, openAuthModal, userId } = useAuth();
  const [savedDormsCount, setSavedDormsCount] = useState(0);
  const [savedRoomsCount, setSavedRoomsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;
    
    if (!isAuthenticated || !userId) {
      setLoading(false);
      return;
    }

    const fetchCounts = async () => {
      try {
        // Count saved dorms from saved_items table (type='dorm')
        const { count: dormsCount } = await supabase
          .from('saved_items')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('item_type', 'dorm');
        
        setSavedDormsCount(dormsCount || 0);

        // Get student ID for saved_rooms
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (student) {
          // Count saved rooms
          const { count: roomsCount } = await supabase
            .from('saved_rooms')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student.id);
          
          setSavedRoomsCount(roomsCount || 0);
        }
      } catch (error) {
        console.error('Error fetching saved counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [isAuthReady, isAuthenticated, userId]);

  // Unauthenticated state - Airbnb style
  if (isAuthReady && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {!isMobile && <RoomyNavbar />}
        
        <div className="pt-20 md:pt-28 px-6 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center space-y-6"
          >
            <h1 className="text-3xl font-bold text-foreground">Wishlists</h1>
            
            <div className="py-12">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-6" />
              <h2 className="text-xl font-semibold mb-2">Log in to view your wishlists</h2>
              <p className="text-muted-foreground">
                You can create, view, or edit wishlists once you've logged in.
              </p>
            </div>

            <Button
              onClick={() => openAuthModal()}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-6 text-lg rounded-xl"
            >
              Log in
            </Button>
          </motion.div>
        </div>
        
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!isMobile && <RoomyNavbar />}
      
      <div className="pt-20 md:pt-28 px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <h1 className="text-3xl font-bold text-foreground mb-8">Wishlists</h1>
          
          {loading ? (
            <div className="space-y-4">
              <div className="h-24 bg-muted animate-pulse rounded-xl" />
              <div className="h-24 bg-muted animate-pulse rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Saved Dorms Card */}
              <Card 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate('/saved-dorms')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Dorms Saved</h3>
                    <p className="text-muted-foreground text-sm">
                      {savedDormsCount} {savedDormsCount === 1 ? 'dorm' : 'dorms'} saved
                    </p>
                  </div>
                  <Heart className={`w-6 h-6 ${savedDormsCount > 0 ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                </CardContent>
              </Card>

              {/* Saved Rooms Card */}
              <Card 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate('/saved-rooms')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
                    <DoorOpen className="w-7 h-7 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Rooms Saved</h3>
                    <p className="text-muted-foreground text-sm">
                      {savedRoomsCount} {savedRoomsCount === 1 ? 'room' : 'rooms'} saved
                    </p>
                  </div>
                  <Heart className={`w-6 h-6 ${savedRoomsCount > 0 ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
      
      <BottomNav />
    </div>
  );
}
