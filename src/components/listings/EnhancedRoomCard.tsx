import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Calendar, MessageSquare, Home, Users, DollarSign, Heart, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BookingRequestModal } from '@/components/bookings/BookingRequestModal';
import { motion } from 'framer-motion';

interface EnhancedRoomCardProps {
  room: {
    id?: string;
    name: string;
    type: string;
    price: number;
    capacity?: number;
    available?: boolean;
    images?: string[];
    description?: string;
    amenities?: string[];
    area_m2?: number;
  };
  dormId: string;
  dormName: string;
  ownerId: string;
  isLegacy?: boolean;
  index?: number;
}

export function EnhancedRoomCard({ 
  room, 
  dormId, 
  dormName, 
  ownerId, 
  isLegacy = false,
  index = 0 
}: EnhancedRoomCardProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const isUnavailable = room.available === false;

  // Check if room is saved on mount
  useEffect(() => {
    const checkSaved = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !room.id) return;

      const { data } = await supabase
        .from('saved_rooms')
        .select('id')
        .eq('student_id', user.id)
        .eq('room_id', room.id)
        .maybeSingle();

      setIsSaved(!!data);
    };
    
    checkSaved();
  }, [room.id]);

  // Use placeholder images if none provided
  const displayImages = room.images && room.images.length > 0 
    ? room.images 
    : [`https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop&q=80`];

  const handleContact = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isUnavailable) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ 
        title: 'Sign in required', 
        description: 'Please sign in to contact the owner',
        variant: 'destructive' 
      });
      navigate('/auth');
      return;
    }

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!student) {
      toast({ 
        title: 'Profile error', 
        description: 'Please complete your student profile',
        variant: 'destructive' 
      });
      return;
    }

    const deposit = room.price;
    
    navigate('/messages', {
      state: {
        openThreadWithUserId: ownerId,
        initialMessage: `Hello! I am interested in ${room.name} (${room.type}) at ${dormName}.\n\nPrice: $${room.price}/month\nDeposit: $${deposit}\n\nIs it still available?`,
        roomPreview: {
          roomId: room.id,
          roomName: room.name,
          roomType: room.type,
          price: room.price,
          deposit,
          dormId,
          dormName
        },
        metadata: {
          source: 'room_card',
          dormId,
          roomId: room.id,
          isLegacy
        }
      }
    });
  };

  const handleBookTour = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUnavailable) return;
    setBookingModalOpen(true);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ 
        title: 'Sign in required', 
        description: 'Please sign in to save rooms',
        variant: 'destructive' 
      });
      navigate('/auth');
      return;
    }

    if (!room.id) return;

    if (isSaved) {
      await supabase
        .from('saved_rooms')
        .delete()
        .eq('student_id', user.id)
        .eq('room_id', room.id);
      
      setIsSaved(false);
      toast({ title: 'Removed from saved rooms' });
    } else {
      await supabase
        .from('saved_rooms')
        .insert({ 
          student_id: user.id, 
          room_id: room.id,
          dorm_id: dormId 
        });
      
      setIsSaved(true);
      toast({ title: 'Room saved!' });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/dorm/${dormId}${room.id ? `?room=${room.id}` : ''}`;
    const shareText = `Check out ${room.name} at ${dormName} - $${room.price}/month`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: room.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ 
        title: 'Link copied!', 
        description: 'Share link copied to clipboard' 
      });
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ 
          y: -8, 
          scale: 1.03,
          transition: { duration: 0.3, ease: 'easeOut' }
        }}
        className="relative h-full"
      >
    <Card 
      className={`overflow-hidden h-full min-h-[420px] shadow-lg transition-shadow duration-300 ${
        isUnavailable 
          ? 'opacity-60 grayscale pointer-events-none' 
          : 'hover:shadow-2xl cursor-pointer group'
      }`}
    >
          <CardContent className="p-0">
            {/* Wrapper for entire image section with absolute positioning */}
            <div className="relative">
              {/* Image Container */}
              <div className="relative overflow-hidden">
                {displayImages.length > 1 ? (
                  <Carousel className="w-full">
                    <CarouselContent>
                      {displayImages.slice(0, 10).map((img, idx) => (
                        <CarouselItem key={idx}>
                          <img
                            src={img}
                            alt={`${room.name} - Image ${idx + 1}`}
                            className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </Carousel>
                ) : (
                  <img
                    src={displayImages[0]}
                    alt={room.name}
                    className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                )}
              </div>

              {/* Save Button - OUTSIDE carousel but positioned over it */}
              {!isUnavailable && room.id && (
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleSave}
                  className="absolute top-3 right-3 z-50 h-10 w-10 rounded-full bg-white hover:bg-white shadow-2xl border-2 border-white/50 hover:scale-110 transition-all duration-200"
                >
                  <Heart 
                    className={`w-5 h-5 ${
                      isSaved 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-700'
                    }`} 
                  />
                </Button>
              )}

              {/* Availability Badge */}
              <div className="absolute top-3 left-3 z-40">
                <Badge 
                  variant={isUnavailable ? "secondary" : "default"}
                  className={isUnavailable ? "bg-muted" : "bg-primary text-primary-foreground"}
                >
                  {isUnavailable ? '🔒 Reserved' : '✓ Available'}
                </Badge>
              </div>

              {/* Quick Actions Overlay - Appears on Hover */}
              {!isUnavailable && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 z-20">
                  <div className="w-full flex gap-2">
                    <Button
                      onClick={handleBookTour}
                      size="sm"
                      className="flex-1 bg-white text-black hover:bg-white/90"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Tour
                    </Button>
                    <Button
                      onClick={handleShare}
                      size="sm"
                      variant="secondary"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isUnavailable 
                    ? 'bg-muted' 
                    : 'bg-gradient-to-br from-primary to-secondary'
                }`}>
                  <Home className={`w-5 h-5 ${isUnavailable ? 'text-muted-foreground' : 'text-white'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{room.name}</h3>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold gradient-text">${room.price}</div>
                <div className="text-xs text-foreground/60">per month</div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1 text-foreground/70">
                <span>Deposit: ${room.price}</span>
              </div>
              {room.capacity && (
                <div className="flex items-center gap-1 text-foreground/70">
                  <Users className="w-4 h-4" />
                  <span>{room.capacity} student{room.capacity > 1 ? 's' : ''}</span>
                </div>
              )}
              {room.area_m2 && (
                <div className="text-foreground/70 col-span-2">
                  Area: {room.area_m2}m²
                </div>
              )}
            </div>

            {/* Description */}
            {room.description && (
              <p className="text-sm text-foreground/70 line-clamp-2">
                {room.description}
              </p>
            )}

            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {room.amenities.slice(0, 3).map((amenity, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
                {room.amenities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{room.amenities.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleBookTour}
                disabled={isUnavailable}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Tour
              </Button>
              <Button
                onClick={handleContact}
                disabled={isUnavailable}
                size="sm"
                className="flex-1"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      <BookingRequestModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        dormId={dormId}
        dormName={`${dormName} - ${room.name}`}
        ownerId={ownerId}
      />
    </>
  );
}
