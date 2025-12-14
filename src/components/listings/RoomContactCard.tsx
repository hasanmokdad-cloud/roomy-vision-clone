import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, MessageSquare, Calendar } from 'lucide-react';
import { getAmenityIcon } from '@/utils/amenityIcons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { RoomType } from '@/types/RoomType';
import { BookingRequestModal } from '@/components/bookings/BookingRequestModal';
import { logAnalyticsEvent, sendOwnerNotification } from '@/utils/analytics';

type RoomContactCardProps = {
  room: RoomType;
  dormId: string;
  dormName: string;
  ownerId?: string;
  index?: number;
};


export default function RoomContactCard({ room, dormId, dormName, ownerId, index = 0 }: RoomContactCardProps) {
  const [loading, setLoading] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
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

    if (!ownerId) {
      toast({
        title: 'Error',
        description: 'Owner information not available',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Get owner's user_id from the owners table
      const { data: ownerData, error: ownerError } = await supabase
        .from('owners')
        .select('user_id')
        .eq('id', ownerId)
        .single();

      console.log('Owner query result:', { ownerData, ownerError, ownerId });

      if (ownerError) {
        console.error('Owner fetch error:', ownerError);
        toast({
          title: 'Error',
          description: 'Could not find owner information. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (!ownerData || !ownerData.user_id) {
        console.error('Owner data missing or invalid:', ownerData);
        toast({
          title: 'Error',
          description: 'Owner information not available. Please contact support.',
          variant: 'destructive',
        });
        return;
      }

      // Log contact click
      await logAnalyticsEvent({
        eventType: 'contact_click',
        userId: user.id,
        dormId: dormId,
        metadata: { room_type: room.type }
      });

      // Navigate to messages with owner's user_id and room preview
      navigate('/messages', {
        state: {
          openThreadWithUserId: ownerData.user_id,
          initialMessage: `Hi, I'm interested in the ${room.type} at ${dormName}. Is it still available?`,
          roomPreview: {
            dormId,
            dormName,
            roomType: room.type,
            roomPrice: room.price,
            roomCapacity: room.capacity,
          }
        }
      });
      
      toast({
        title: 'Opening conversation',
        description: 'Connecting you with the dorm owner...',
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
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
      >
        <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 ${!isAvailable ? 'opacity-50 grayscale contrast-75' : ''}`}>
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
                <span className="text-sm text-foreground/80">{room.capacity} {room.capacity === 1 ? 'student' : 'students'}</span>
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
                  const Icon = getAmenityIcon(amenity);
                  return (
                    <Badge key={i} variant="secondary" className="text-xs">
                      <Icon className="w-3 h-3 mr-1" />
                      {amenity}
                    </Badge>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleContactForReservation}
                disabled={!isAvailable || loading}
                className="flex-1"
                size="lg"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {loading ? 'Loading...' : 'Contact'}
              </Button>
              
              <Button
                onClick={() => setBookingModalOpen(true)}
                disabled={!isAvailable || !ownerId}
                variant="outline"
                size="lg"
              >
                <Calendar className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <BookingRequestModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        dormId={dormId}
        dormName={dormName}
        ownerId={ownerId || ''}
      />
    </>
  );
}
