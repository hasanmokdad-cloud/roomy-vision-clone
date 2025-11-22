import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Calendar, MessageSquare, Home, Users, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BookingRequestModal } from '@/components/bookings/BookingRequestModal';

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
  const isUnavailable = room.available === false;

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

  return (
    <>
      <Card 
        className={`overflow-hidden transition-all duration-300 ${
          isUnavailable 
            ? 'opacity-60 grayscale pointer-events-none' 
            : 'hover:shadow-lg hover:scale-[1.02] cursor-pointer'
        }`}
      >
        <CardContent className="p-0">
          {/* Image Carousel */}
          <div className="relative">
            {displayImages.length > 1 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {displayImages.slice(0, 10).map((img, idx) => (
                    <CarouselItem key={idx}>
                      <img
                        src={img}
                        alt={`${room.name} - Image ${idx + 1}`}
                        className="w-full h-48 object-cover"
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
                className="w-full h-48 object-cover"
                loading="lazy"
              />
            )}
            
            {/* Availability Badge */}
            <div className="absolute top-2 right-2">
              <Badge 
                variant={isUnavailable ? "secondary" : "default"}
                className={isUnavailable ? "bg-muted" : "bg-primary text-primary-foreground"}
              >
                {isUnavailable ? '🔒 Reserved' : '✓ Available'}
              </Badge>
            </div>
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
                  <p className="text-sm text-foreground/60">{room.type}</p>
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
                <DollarSign className="w-4 h-4" />
                <span>Deposit: ${room.price}</span>
              </div>
              {room.capacity && (
                <div className="flex items-center gap-1 text-foreground/70">
                  <Users className="w-4 h-4" />
                  <span>{room.capacity} person{room.capacity > 1 ? 's' : ''}</span>
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
