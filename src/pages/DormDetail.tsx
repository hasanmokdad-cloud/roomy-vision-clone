import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, DollarSign, Users, CheckCircle, Phone, Mail, Globe, MessageSquare, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RoomContactCard from '@/components/listings/RoomContactCard';
import { DormDetailSkeleton } from '@/components/skeletons/DormDetailSkeleton';
import RoomContactCard from '@/components/listings/RoomContactCard';

export default function DormDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dorm, setDorm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadDorm();
    checkAuth();
  }, [id]);

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
    setLoading(false);
  };

  const handleChatWithRoomy = () => {
    // Open chatbot with pre-context about this dorm
    toast({
      title: 'Opening Roomy AI',
      description: `Let me help you learn more about ${dorm.dorm_name || dorm.name}`,
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
  const roomTypes: RoomType[] = dorm.room_types_json || [];
  const startingPrice = roomTypes.length > 0 
    ? Math.min(...roomTypes.map(r => r.price))
    : dorm.monthly_price;

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

              {/* Room Options */}
              {roomTypes.length > 0 && (
                <Card className="glass-hover">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Available Room Options</h2>
                    <div className="grid gap-4">
                      {roomTypes.map((room, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                              <Home className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{room.type}</h3>
                              <p className="text-sm text-foreground/60">
                                Capacity: {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold gradient-text">${room.price}</div>
                            <div className="text-xs text-foreground/60">per month</div>
                          </div>
                        </div>
                      ))}
                    </div>
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

      <Footer />
    </div>
  );
}
