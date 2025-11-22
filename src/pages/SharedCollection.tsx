import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share2, Lock, AlertCircle, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedRoomCard } from '@/components/listings/EnhancedRoomCard';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SharedCollection() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareCode) {
      loadSharedCollection();
    }
  }, [shareCode]);

  const loadSharedCollection = async () => {
    try {
      setLoading(true);

      // Get collection metadata
      const { data: collectionData, error: collectionError } = await supabase
        .from('shared_collections')
        .select('*')
        .eq('share_code', shareCode)
        .eq('is_public', true)
        .maybeSingle();

      if (collectionError) throw collectionError;

      if (!collectionData) {
        setError('Collection not found or is private');
        setLoading(false);
        return;
      }

      // Check expiration
      if (collectionData.expires_at && new Date(collectionData.expires_at) < new Date()) {
        setError('This collection has expired');
        setLoading(false);
        return;
      }

      setCollection(collectionData);

      // Increment view count
      await supabase.rpc('increment_collection_views', {
        p_share_code: shareCode,
      });

      // Load rooms from student's saved_rooms
      const { data: savedItems } = await supabase
        .from('saved_rooms')
        .select('room_id, dorm_id')
        .eq('student_id', collectionData.student_id);

      if (savedItems && savedItems.length > 0) {
        const roomIds = savedItems.map(item => item.room_id);

        const { data: roomsData } = await supabase
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

        setRooms(roomsData || []);
      }
    } catch (error: any) {
      console.error('Error loading shared collection:', error);
      setError('Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0F1624] to-[#15203B]">
        <div className="text-white">Loading collection...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F1624] to-[#15203B]">
        <Navbar />
        <div className="container mx-auto px-4 py-32 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-12 text-center border-white/20"
          >
            {error.includes('private') ? (
              <>
                <Lock className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-white mb-4">Private Collection</h1>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-white mb-4">Collection Not Found</h1>
              </>
            )}
            <p className="text-white/60 mb-8">{error}</p>
            <Button onClick={() => navigate('/listings')}>
              Browse Available Dorms
            </Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1624] to-[#15203B]">
      <Navbar />
      
      <div className="container mx-auto px-4 md:px-6 py-32 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="text-sm">
              <Share2 className="w-3 h-3 mr-1" />
              Shared Collection
            </Badge>
            
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Eye className="w-4 h-4" />
              <span>{collection.view_count} views</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-3">
            {collection.title || 'Shared Room Collection'}
          </h1>
          
          {collection.description && (
            <p className="text-white/70 text-lg max-w-3xl">
              {collection.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-6">
            <Badge variant="outline" className="text-base">
              {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'}
            </Badge>
            <Button
              onClick={() => navigate('/listings')}
              variant="outline"
            >
              Explore More Rooms
            </Button>
          </div>
        </motion.div>

        {/* Rooms Grid */}
        {rooms.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center border-white/20">
            <p className="text-white/60">No rooms in this collection</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room, index) => (
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

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 glass rounded-3xl p-8 text-center border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            Find Your Perfect Room
          </h2>
          <p className="text-white/70 mb-6">
            Create your own account to save and share room collections
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              Sign Up Free
            </Button>
            <Button
              onClick={() => navigate('/listings')}
              variant="outline"
            >
              Browse All Rooms
            </Button>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
