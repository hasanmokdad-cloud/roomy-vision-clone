import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, DollarSign, Users, CheckCircle, Phone, Mail, Globe, MessageSquare, Home, Video, Bookmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedRoomCard } from '@/components/listings/EnhancedRoomCard';
import { DormDetailSkeleton } from '@/components/skeletons/DormDetailSkeleton';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { BookTourModal } from '@/components/bookings/BookTourModal';
import { BookingCalendar } from '@/components/bookings/BookingCalendar';
import { VirtualTourGallery } from '@/components/rooms/VirtualTourGallery';
import { ReviewList } from '@/components/reviews/ReviewList';
import type { RoomType } from '@/types/RoomType';
import { logAnalyticsEvent } from '@/utils/analytics';
import { ThreeDViewer } from '@/components/rooms/ThreeDViewer';
import { ScrollToTopButton } from '@/components/listings/ScrollToTopButton';
import { ShareButton } from '@/components/shared/ShareButton';

export default function DormDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dorm, setDorm] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadDorm();
    checkAuth();
  }, [id]);

  // Check if dorm is saved
  useEffect(() => {
    if (user?.id && dorm?.id) {
      supabase
        .from("saved_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", dorm.id)
        .eq("item_type", "dorm")
        .maybeSingle()
        .then(({ data }) => {
          setIsSaved(!!data);
        });
    }
  }, [user, dorm?.id]);

  useEffect(() => {
    // Log dorm view when component mounts and user is loaded
    if (id && !loading) {
      logAnalyticsEvent({
        eventType: 'dorm_view',
        userId: user?.id,
        dormId: id,
        metadata: { page: 'dorm-detail' }
      });
    }
  }, [id, user, loading]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  const loadDorm = async () => {
    const { data, error } = await supabase
      .from('dorms')
      .select('*, owner_id')
      .eq('id', id)
      .eq('verification_status', 'Verified')
      .maybeSingle();

    if (error || !data) {
      toast({
        title: 'Error',
        description: 'Dorm not found or not available',
        variant: 'destructive'
      });
      navigate('/listings');
      return;
    }

    setDorm(data);

    // Fetch rooms for this dorm
    const { data: roomsData } = await supabase
      .from('rooms')
      .select('*')
      .eq('dorm_id', id)
      .order('price', { ascending: true });

    setRooms(roomsData || []);
    setLoading(false);
  };

  const handleChatWithRoomy = () => {
    // Dispatch custom event to open chatbot
    window.dispatchEvent(new CustomEvent('openRoomyChatbot', {
      detail: { 
        dormContext: {
          dormId: dorm.id,
          dormName: displayName,
          initialPrompt: `Tell me about ${displayName}` 
        }
      }
    }));
  };

  const toggleSave = async () => {
    if (!user) {
      toast({
        title: "Sign in Required",
        description: "Please sign in to save dorms.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    try {
      if (isSaved) {
        await supabase
          .from("saved_items")
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", dorm.id);
        
        setIsSaved(false);
        toast({
          title: "Removed",
          description: "Dorm removed from favorites.",
        });
      } else {
        await supabase
          .from("saved_items")
          .insert({
            user_id: user.id,
            item_id: dorm.id,
            item_type: "dorm",
          });
        
        setIsSaved(true);
        toast({
          title: "Saved",
          description: "Dorm added to favorites!",
        });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites.",
        variant: "destructive",
      });
    }
  };

  const openGallery = (images: string[], startIndex: number = 0) => {
    setGalleryImages(images);
    setGalleryStartIndex(startIndex);
    setGalleryOpen(true);
  };

  const getAllRoomImages = () => {
    const allImages: string[] = [];
    // Get images from rooms table
    rooms.forEach(room => {
      if (room.images && Array.isArray(room.images)) {
        allImages.push(...room.images);
      }
    });
    // Also get images from legacy room_types_json
    roomTypes.forEach(room => {
      if (room.images && Array.isArray(room.images)) {
        allImages.push(...room.images);
      }
    });
    return allImages;
  };

  const handleContactOwner = (room: any) => {
    if (!room.available) return;
    
    navigate('/messages', {
      state: {
        openThreadWithUserId: dorm.owner_id,
        initialMessage: `Hello! I am interested in ${room.name} at ${displayName}.`,
        roomPreview: room,
        metadata: {
          dormId: dorm.id,
          dormName: displayName,
          roomId: room.id,
          roomName: room.name,
          price: room.price
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <DormDetailSkeleton />
        <Footer />
      </div>
    );
  }

  if (!dorm) return null;

  const images = dorm.image_url ? [dorm.image_url] : [];
  const displayName = dorm.dorm_name || dorm.name;
  
  // Parse room types from JSON
  const roomTypes: RoomType[] = Array.isArray(dorm.room_types_json) ? dorm.room_types_json : [];
  const startingPrice = roomTypes.length > 0 
    ? Math.min(...roomTypes.map(r => r.price))
    : dorm.monthly_price || dorm.price || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <Button
          variant="ghost"
          onClick={() => navigate('/listings')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Listings
        </Button>

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {displayName}
                </h1>
                <div className="flex items-center gap-2 text-foreground/70">
                  <MapPin className="w-5 h-5" />
                  <span>{dorm.area || dorm.location}</span>
                  {dorm.verification_status === 'Verified' && (
                    <Badge variant="secondary" className="ml-2">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold gradient-text">
                  ${startingPrice}
                </div>
                <div className="text-sm text-foreground/60">
                  {roomTypes.length > 1 ? 'starting from' : 'per month'}
                </div>
              </div>
            </div>
            
            {/* Share and Save Buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <ShareButton 
                dormId={dorm.id} 
                dormName={displayName}
                size="lg"
                variant="outline"
              />
              <button
                onClick={toggleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
                aria-label={isSaved ? "Remove from favorites" : "Save to favorites"}
              >
                <Bookmark
                  className={`w-5 h-5 transition-colors ${
                    isSaved ? "fill-primary text-primary" : "text-muted-foreground"
                  }`}
                />
                <span className="text-sm font-medium">
                  {isSaved ? "Saved" : "Save"}
                </span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-8 flex flex-wrap gap-3 animate-fade-in">
            <Button
              onClick={handleChatWithRoomy}
              className="bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat with Roomy AI
            </Button>
          </div>

          {/* Image Carousel */}
          {images.length > 0 ? (
            <div className="mb-8 animate-fade-in">
              <Carousel className="w-full">
                <CarouselContent>
                  {images.map((img, idx) => (
                    <CarouselItem key={idx}>
                      <Card className="border-0 overflow-hidden">
                        <CardContent className="p-0">
                          <img
                            src={img}
                            alt={`${displayName} - Image ${idx + 1}`}
                            loading="lazy"
                            className="w-full h-[400px] md:h-[500px] object-cover"
                          />
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {images.length > 1 && (
                  <>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                  </>
                )}
              </Carousel>
            </div>
          ) : (
            <div className="mb-8 animate-fade-in">
              <Card className="border-0 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                <CardContent className="p-0 h-[400px] md:h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold gradient-text mb-4">
                      {displayName.charAt(0)}
                    </div>
                    <p className="text-xl text-foreground/60">{displayName}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Key Details */}
              <Card className="glass-hover">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Key Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-foreground/60">Room Type</div>
                        <div className="font-semibold">{dorm.room_types || 'Not specified'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-foreground/60">University</div>
                        <div className="font-semibold">{dorm.university || 'Various'}</div>
                      </div>
                    </div>
                    {dorm.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <div>
                          <div className="text-sm text-foreground/60">Capacity</div>
                          <div className="font-semibold">{dorm.capacity} students</div>
                        </div>
                      </div>
                    )}
                    {dorm.gender_preference && (
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <div>
                          <div className="text-sm text-foreground/60">Gender Preference</div>
                          <div className="font-semibold">{dorm.gender_preference}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {dorm.description && (
                <Card className="glass-hover">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-4">About This Dorm</h2>
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                      {dorm.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Available Room Options - Merged Section */}
              {(rooms.length > 0 || roomTypes.length > 0) && (
                <Card className="glass-hover">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Available Room Options</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Database Rooms */}
                      {rooms.map((room, idx) => (
                        <EnhancedRoomCard
                          key={`db-${room.id}`}
                          room={room}
                          dormId={dorm.id}
                          dormName={displayName}
                          ownerId={dorm.owner_id}
                          isLegacy={false}
                          index={idx}
                        />
                      ))}
                      
                      {/* Legacy room_types_json Rooms */}
                      {roomTypes.map((room, idx) => (
                        <EnhancedRoomCard
                          key={`legacy-${idx}`}
                          room={{
                            name: room.type,
                            type: room.type,
                            price: room.price,
                            capacity: room.capacity,
                            available: room.available !== false,
                            images: room.images || [],
                            amenities: room.amenities || []
                          }}
                          dormId={dorm.id}
                          dormName={displayName}
                          ownerId={dorm.owner_id}
                          isLegacy={true}
                          index={rooms.length + idx}
                        />
                      ))}
                    </div>
                    
                    {rooms.length === 0 && roomTypes.length === 0 && (
                      <p className="text-center text-foreground/60 py-8">
                        No room options available yet. Contact the owner for more information.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Amenities & Services */}
              {dorm.services_amenities && (
                <Card className="glass-hover">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Amenities & Services</h2>
                    <p className="text-foreground/80 whitespace-pre-line">
                      {dorm.services_amenities}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 3D Room Viewer */}
              {rooms.length > 0 && rooms.some(r => r.three_d_model_url) && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-4">3D Room Preview</h2>
                  {rooms
                    .filter(r => r.three_d_model_url)
                    .map((room) => (
                      <div key={room.id} className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">{room.name}</h3>
                        <ThreeDViewer modelUrl={room.three_d_model_url} alt={`${room.name} 3D Model`} />
                      </div>
                    ))}
                </div>
              )}

              {/* Virtual Tour for Rooms from Database */}
              {rooms.length > 0 && rooms.some(r => r.panorama_urls && r.panorama_urls.length > 0) && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-4">360° Virtual Tours</h2>
                  {rooms
                    .filter(r => r.panorama_urls && r.panorama_urls.length > 0)
                    .map((room) => (
                      <div key={room.id} className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">{room.name}</h3>
                        <VirtualTourGallery
                          roomId={room.id}
                          panoramaUrls={room.panorama_urls}
                          editable={false}
                        />
                      </div>
                    ))}
                </div>
              )}


              {/* Location */}
              {dorm.address && (
                <Card className="glass-hover">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Location</h2>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold">{dorm.area}</p>
                        <p className="text-foreground/70">{dorm.address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Ask Roomy AI */}
              <Card className="glass-hover border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 gradient-text">
                    Need Help Deciding?
                  </h3>
                  <p className="text-sm text-foreground/70 mb-4">
                    Ask Roomy AI anything about this dorm and get instant answers!
                  </p>
                  <Button
                    onClick={handleChatWithRoomy}
                    className="w-full bg-gradient-to-r from-primary to-secondary"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask Roomy AI
                  </Button>
                </CardContent>
              </Card>

              {/* Booking Calendar */}
              {user && (
                <BookingCalendar
                  dormId={dorm.id}
                  dormName={displayName}
                  ownerId={dorm.owner_id}
                  onSuccess={() => {
                    toast({
                      title: "Success!",
                      description: "Your viewing request has been sent",
                    });
                  }}
                />
              )}

              {/* Contact Information */}
              {user && (
                <Card className="glass-hover">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">Contact Owner</h3>
                    <div className="space-y-3">
                      {dorm.phone_number && (
                        <a
                          href={`tel:${dorm.phone_number}`}
                          className="flex items-center gap-2 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                        >
                          <Phone className="w-5 h-5 text-primary" />
                          <span className="text-sm">{dorm.phone_number}</span>
                        </a>
                      )}
                      {dorm.email && (
                        <a
                          href={`mailto:${dorm.email}`}
                          className="flex items-center gap-2 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                        >
                          <Mail className="w-5 h-5 text-primary" />
                          <span className="text-sm">{dorm.email}</span>
                        </a>
                      )}
                      {dorm.website && (
                        <a
                          href={dorm.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                        >
                          <Globe className="w-5 h-5 text-primary" />
                          <span className="text-sm">Visit Website</span>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!user && (
                <Card className="glass-hover border-primary/30">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3">Want to Contact?</h3>
                    <p className="text-sm text-foreground/70 mb-4">
                      Sign in to view owner contact details and send inquiries.
                    </p>
                    <Button
                      onClick={() => navigate('/auth')}
                      className="w-full bg-gradient-to-r from-primary to-secondary"
                    >
                      Sign In to Contact
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Price Breakdown */}
              <Card className="glass-hover">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Pricing</h3>
                  <div className="space-y-2">
                    {roomTypes.length > 0 ? (
                      <>
                        <div className="flex justify-between items-center pb-2 border-b border-white/10">
                          <span className="text-foreground/70">Starting from</span>
                          <span className="font-bold text-xl gradient-text">
                            ${startingPrice}
                          </span>
                        </div>
                        <div className="text-sm text-foreground/60 pt-2">
                          {roomTypes.length} room {roomTypes.length === 1 ? 'option' : 'options'} available
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-foreground/70">Monthly Rent</span>
                        <span className="font-bold text-xl gradient-text">
                          ${dorm.monthly_price}
                        </span>
                      </div>
                    )}
                    {dorm.shuttle && (
                      <div className="pt-2 border-t border-white/10">
                        <Badge variant="secondary">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Shuttle Service Included
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Reviews & Ratings Section */}
      <div className="container mx-auto px-4 pb-12 max-w-6xl">
        <Card className="glass-hover">
          <CardContent className="p-6">
            <h2 className="text-3xl font-bold mb-6">Reviews & Ratings</h2>
            <ReviewList dormId={id!} />
          </CardContent>
        </Card>
      </div>

      <ImageGallery
        images={galleryImages}
        initialIndex={galleryStartIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      <BookTourModal
        open={tourModalOpen}
        onOpenChange={setTourModalOpen}
        dormId={dorm.id}
        dormName={displayName}
        ownerId={dorm.owner_id}
      />

      <ScrollToTopButton />
      <Footer />
    </div>
  );
}
