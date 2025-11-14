import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, MessageSquare, Wifi, Wind, Droplet, CookingPot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { RoomType } from '@/types/RoomType';

type RoomContactCardProps = {
  room: RoomType;
  dormId: string;
  dormName: string;
  ownerId?: string;
  index?: number;
};

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  'air conditioning': Wind,
  'private bathroom': Droplet,
  kitchen: CookingPot,
};

export default function RoomContactCard({ room, dormId, dormName, ownerId, index = 0 }: RoomContactCardProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleContactForReservation = async () => {
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to contact dorm owners',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      // Get student ID
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!student || !ownerId) {
        throw new Error('Unable to create conversation');
      }

      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('student_id', student.id)
        .eq('owner_id', ownerId)
        .eq('dorm_id', dormId)
        .maybeSingle();

      let conversationId = existingConv?.id;

      // Create conversation if it doesn't exist
      if (!conversationId) {
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            student_id: student.id,
            owner_id: ownerId,
            dorm_id: dormId,
          })
          .select('id')
          .single();

        if (error) throw error;
        conversationId = newConv.id;

        // Send initial message
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: `Hi, I'm interested in the ${room.type} at ${dormName}. Is it still available?`,
        });
      }

      // Navigate to messages
      navigate('/messages');
      toast({
        title: 'Conversation started',
        description: 'You can now chat with the dorm owner',
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isAvailable = room.available !== false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 ${!isAvailable ? 'opacity-60 grayscale' : ''}`}>
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          {!isAvailable && (
            <Badge variant="destructive" className="absolute top-4 right-4 text-sm font-semibold">
              Unavailable
            </Badge>
          )}
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto mb-2 text-primary/60" />
            <p className="text-lg font-semibold text-foreground">{room.type}</p>
          </div>
        </div>
        
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-foreground/60" />
              <span className="text-sm text-foreground/80">{room.capacity} {room.capacity === 1 ? 'person' : 'people'}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold gradient-text">${room.price}</span>
              <span className="text-sm text-foreground/60">/month</span>
            </div>
          </div>

          {room.amenities && room.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {room.amenities.slice(0, 4).map((amenity, i) => {
                const Icon = amenityIcons[amenity.toLowerCase()] || Wind;
                return (
                  <Badge key={i} variant="secondary" className="text-xs">
                    <Icon className="w-3 h-3 mr-1" />
                    {amenity}
                  </Badge>
                );
              })}
            </div>
          )}

          <Button
            onClick={handleContactForReservation}
            disabled={!isAvailable || loading}
            className="w-full"
            size="lg"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {loading ? 'Loading...' : 'Contact for Reservation'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
