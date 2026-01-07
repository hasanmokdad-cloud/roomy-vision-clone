import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, Sparkles, Images, Eye, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedRoomCard } from '@/components/listings/EnhancedRoomCard';
import { DormDetailSkeleton } from '@/components/skeletons/DormDetailSkeleton';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { BookTourModal } from '@/components/bookings/BookTourModal';
import { VirtualTourGallery } from '@/components/rooms/VirtualTourGallery';
import type { RoomType } from '@/types/RoomType';
import { logAnalyticsEvent } from '@/utils/analytics';
import { ThreeDViewer } from '@/components/rooms/ThreeDViewer';
import { ScrollToTopButton } from '@/components/listings/ScrollToTopButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { renderMarkdown } from '@/utils/markdownRenderer';
import { useAuth } from '@/contexts/AuthContext';
import { ApartmentListView } from '@/components/listings/ApartmentListView';

// New Building Components
import { BuildingHero } from '@/components/building/BuildingHero';
import { BuildingMetaHeader } from '@/components/building/BuildingMetaHeader';
import { BuildingAmenities } from '@/components/building/BuildingAmenities';
import { BuildingLocation } from '@/components/building/BuildingLocation';
import { BuildingReviews } from '@/components/building/BuildingReviews';

export default function DormDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const highlightedRoomId = searchParams.get('room');
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user, role, openAuthModal } = useAuth();
  const [dorm, setDorm] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [dormInsight, setDormInsight] = useState<string | null>(null);
  const roomRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll to highlighted room when navigating from AI Match
  useEffect(() => {
    if (highlightedRoomId && !loading && rooms.length > 0) {
      setTimeout(() => {
        const roomElement = roomRefs.current.get(highlightedRoomId);
        if (roomElement) {
          roomElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          roomElement.classList.add('ring-4', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
          setTimeout(() => {
            roomElement.classList.remove('ring-4', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
          }, 3000);
        }
      }, 500);
    }
  }, [highlightedRoomId, loading, rooms]);

  useEffect(() => {
    loadDorm();
  }, [id]);

  // Fetch AI insight for this dorm (only for students)
  useEffect(() => {
    if (user && dorm && role === 'student') {
      fetchDormInsight();
    }
  }, [user, dorm, role]);

  const fetchDormInsight = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('roomy-chat', {
        body: {
          message: `Briefly analyze how ${dorm.dorm_name || dorm.name} fits my preferences. One short sentence.`,
          userId: user.id,
          context: { dormId: dorm.id }
        }
      });
      
      if (!error && data?.response) {
        setDormInsight(data.response);
      }
    } catch (err) {
      console.log('AI insight unavailable');
    }
  };

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
    if (id && !loading) {
      logAnalyticsEvent({
        eventType: 'dorm_view',
        userId: user?.id,
        dormId: id,
        metadata: { page: 'dorm-detail' }
      });
    }
  }, [id, user, loading]);

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
      openAuthModal();
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {!isMobile && <RoomyNavbar />}
        <DormDetailSkeleton />
        <Footer />
      </div>
    );
  }

  if (!dorm) return null;

  const images = dorm.cover_image ? [dorm.cover_image] : (dorm.image_url ? [dorm.image_url] : []);
  if (dorm.gallery_images?.length) {
    images.push(...dorm.gallery_images);
  }
  const displayName = dorm.dorm_name || dorm.name;
  
  // Parse room types from JSON
  const roomTypes: RoomType[] = Array.isArray(dorm.room_types_json) ? dorm.room_types_json : [];
  const startingPrice = roomTypes.length > 0 
    ? Math.min(...roomTypes.map(r => r.price))
    : dorm.monthly_price || dorm.price || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!isMobile && <RoomyNavbar />}
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/listings')}
          className="mb-6 hover:bg-muted/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Listings
        </Button>

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Hero Section - Using new component */}
          <BuildingHero 
            images={images} 
            displayName={displayName}
            onImageClick={openGallery}
          />

          {/* Meta Header - Using new component */}
          <BuildingMetaHeader
            displayName={displayName}
            area={dorm.area}
            location={dorm.location}
            verificationStatus={dorm.verification_status}
            startingPrice={startingPrice}
            hasMultipleRoomTypes={roomTypes.length > 1}
            dormId={dorm.id}
            isSaved={isSaved}
            onToggleSave={toggleSave}
          />

          {/* AI Insight Card */}
          {dormInsight && (
            <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-300/30">
              <CardContent className="p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-foreground/80">{renderMarkdown(dormInsight)}</div>
              </CardContent>
            </Card>
          )}

          {/* Chat with Roomy AI - Only for students */}
          {user && role === 'student' && (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleChatWithRoomy}
                className="bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat with Roomy AI
              </Button>
            </div>
          )}

          {/* Description Section */}
          {dorm.description && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">About This Property</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {dorm.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Apartment Building View */}
          {dorm.property_type === 'apartment' && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">Available Apartments</h2>
                </div>
                <ApartmentListView
                  buildingId={dorm.id}
                  buildingName={displayName}
                  onReserve={(level, id, apartmentId) => {
                    toast({
                      title: 'Reservation',
                      description: `Reserve ${level}: ${id}`,
                    });
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Room Options - Only for non-apartment buildings */}
          {dorm.property_type !== 'apartment' && (rooms.length > 0 || roomTypes.length > 0) && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-6">Available Room Options</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {/* Database Rooms */}
                  {rooms.map((room, idx) => (
                    <div
                      key={`db-${room.id}`}
                      ref={(el) => el && room.id && roomRefs.current.set(room.id, el)}
                      className={`transition-all duration-500 rounded-xl ${
                        highlightedRoomId === room.id ? 'ring-4 ring-primary ring-offset-2 ring-offset-background' : ''
                      }`}
                    >
                      <EnhancedRoomCard
                        room={room}
                        dormId={dorm.id}
                        dormName={displayName}
                        ownerId={dorm.owner_id}
                        isLegacy={false}
                        index={idx}
                      />
                    </div>
                  ))}
                  
                  {/* Legacy room_types_json Rooms */}
                  {roomTypes.map((room, idx) => {
                    const legacyRoomId = `legacy-${dorm.id}-${room.type.toLowerCase().replace(/\s+/g, '-')}`;
                    
                    return (
                      <EnhancedRoomCard
                        key={`legacy-${idx}`}
                        room={{
                          id: legacyRoomId,
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
                    );
                  })}
                </div>
                
                {rooms.length === 0 && roomTypes.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No room options available yet. Contact the owner for more information.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Common Area & Facilities Gallery */}
          {dorm.gallery_images && dorm.gallery_images.length > 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Images className="w-6 h-6" />
                  Common Area & Facilities
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {dorm.gallery_images.map((img: string, idx: number) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                      onClick={() => openGallery(dorm.gallery_images, idx)}
                    >
                      <img
                        src={img}
                        alt={`${displayName} - Facility ${idx + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services & Amenities - Using new component */}
          <BuildingAmenities amenities={dorm.amenities} />

          {/* 3D Room Viewer */}
          {rooms.length > 0 && rooms.some(r => r.three_d_model_url) && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">3D Room Preview</h2>
                {rooms
                  .filter(r => r.three_d_model_url)
                  .map((room) => (
                    <div key={room.id} className="mb-4">
                      <h3 className="text-lg font-medium mb-2">{room.name}</h3>
                      <ThreeDViewer modelUrl={room.three_d_model_url} alt={`${room.name} 3D Model`} />
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Virtual Tour for Rooms */}
          {rooms.length > 0 && rooms.some(r => r.panorama_urls && r.panorama_urls.length > 0) && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">360° Virtual Tours</h2>
                {rooms
                  .filter(r => r.panorama_urls && r.panorama_urls.length > 0)
                  .map((room) => (
                    <div key={room.id} className="mb-4">
                      <h3 className="text-lg font-medium mb-2">{room.name}</h3>
                      <VirtualTourGallery
                        roomId={room.id}
                        panoramaUrls={room.panorama_urls}
                        editable={false}
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Location - Using new component */}
          <BuildingLocation area={dorm.area} address={dorm.address} />

          {/* Reviews & Ratings - Using new component */}
          <BuildingReviews dormId={id!} />
        </div>
      </main>

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
