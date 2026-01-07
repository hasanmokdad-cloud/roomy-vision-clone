import { motion } from "framer-motion";
import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle, Zap, Bookmark, Star, Building2, Eye, Bed, DoorOpen, Share2 } from "lucide-react";
import { getAmenityIcon } from "@/utils/amenityIcons";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShareButton } from "@/components/shared/ShareButton";
import { ReviewFormModal } from "@/components/reviews/ReviewFormModal";
import { BuildingQuickLookModal } from "./BuildingQuickLookModal";

interface RoomType {
  type: string;
  capacity: number;
  price: number;
  amenities?: string[];
}

interface CinematicDormCardProps {
  dorm: {
    id: string;
    dorm_name: string;
    area: string;
    location?: string;
    monthly_price?: number;
    price?: number;
    verification_status?: string;
    cover_image?: string;
    image_url?: string;
    room_types_json?: any;
    amenities?: string[];
    shuttle?: boolean;
    address?: string;
    university?: string;
    gender_preference?: string;
    property_type?: string;
    apartment_count?: number;
    gallery_images?: string[];
  };
  index: number;
}

const CinematicDormCardComponent = ({ dorm, index }: CinematicDormCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [quickLookOpen, setQuickLookOpen] = useState(false);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Load user and check if dorm is saved
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      
      if (uid) {
        supabase
          .from("saved_items")
          .select("id")
          .eq("user_id", uid)
          .eq("item_id", dorm.id)
          .eq("item_type", "dorm")
          .maybeSingle()
          .then(({ data }) => {
            setIsSaved(!!data);
          });
      }
    });
  }, [dorm.id]);

  // Fetch average rating
  useEffect(() => {
    const fetchRating = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('rating')
        .eq('dorm_id', dorm.id)
        .eq('status', 'approved');
      
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setReviewCount(data.length);
      }
    };
    fetchRating();
  }, [dorm.id]);

  const roomTypes: RoomType[] = useMemo(() => dorm.room_types_json || [], [dorm.room_types_json]);
  const hasMultipleRooms = useMemo(() => roomTypes.length > 1, [roomTypes.length]);
  const isApartmentBuilding = dorm.property_type === 'apartment';

  // Memoized starting price calculation
  const startingPrice = useMemo(
    () => (roomTypes.length > 0 ? Math.min(...roomTypes.map((r) => r.price)) : dorm.monthly_price || dorm.price || 0),
    [roomTypes, dorm.monthly_price, dorm.price],
  );

  const dormImage = useMemo(
    () => dorm.cover_image || dorm.image_url || "/placeholder.svg",
    [dorm.cover_image, dorm.image_url],
  );

  const isVerified = useMemo(() => dorm.verification_status === "Verified", [dorm.verification_status]);

  // Amenities preview (max 4)
  const previewAmenities = useMemo(() => {
    return dorm.amenities?.slice(0, 4) || [];
  }, [dorm.amenities]);
  
  const remainingAmenities = useMemo(() => {
    return Math.max(0, (dorm.amenities?.length || 0) - 4);
  }, [dorm.amenities]);

  // Availability summary
  const roomCount = useMemo(() => roomTypes.length || 1, [roomTypes]);
  const bedCount = useMemo(() => {
    return roomTypes.reduce((sum, r) => sum + (r.capacity || 1), 0) || roomCount;
  }, [roomTypes, roomCount]);

  const handleViewBuilding = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(`/dorm/${dorm.id}`);
    },
    [navigate, dorm.id],
  );

  const handleQuickLook = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickLookOpen(true);
  }, []);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't navigate if clicking on interactive elements
    if (target.closest('.save-button') || target.closest('.share-button') || target.closest('button')) {
      return;
    }
    navigate(`/dorm/${dorm.id}`);
  }, [navigate, dorm.id]);

  const toggleSave = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!userId) {
      toast({
        title: "Sign in Required",
        description: "Please sign in to save dorms.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isSaved) {
        await supabase
          .from("saved_items")
          .delete()
          .eq("user_id", userId)
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
            user_id: userId,
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
  }, [userId, isSaved, dorm.id, toast]);

  const renderAmenityIcon = useCallback(
    (amenity: string) => {
      const IconComponent = getAmenityIcon(amenity);
      return <IconComponent className="w-3.5 h-3.5" />;
    },
    [],
  );

  const cardVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 40, scale: 0.97 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          delay: prefersReducedMotion ? 0 : index * 0.05,
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1],
        },
      },
    }),
    [prefersReducedMotion, index],
  );

  return (
    <>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative perspective-deep group cursor-pointer"
        onMouseEnter={() => {
          if (!isMobile && !prefersReducedMotion) {
            setIsFlipped(true);
          }
        }}
        onMouseLeave={() => {
          if (!isMobile && !prefersReducedMotion) {
            setIsFlipped(false);
          }
        }}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/dorm/${dorm.id}`);
          }
        }}
        role="article"
        tabIndex={0}
        aria-label={`${dorm.dorm_name} in ${dorm.area || dorm.location}${hasMultipleRooms ? `, ${roomTypes.length} room types available` : ``}, starting from $${startingPrice} per month`}
      >
        <motion.div
          animate={{
            rotateX: !prefersReducedMotion && !isMobile && isFlipped ? 180 : 0,
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full h-[360px] cursor-pointer"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front Face */}
          <div
            className="absolute inset-0 flip-card-3d rounded-2xl overflow-hidden border border-border bg-card shadow-md hover:shadow-xl transition-shadow duration-300"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Image - 16:10 aspect ratio approximation */}
            <div className="relative h-40 overflow-hidden">
              <img
                src={dormImage}
                alt={dorm.dorm_name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

              {/* Badges - Top left */}
              <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                {isVerified && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-background/80 backdrop-blur-sm">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {isApartmentBuilding && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 border-purple-500/30 backdrop-blur-sm">
                    <Building2 className="w-3 h-3 mr-1" />
                    Apartments
                  </Badge>
                )}
              </div>

              {/* Rating badge - Top right */}
              {averageRating && (
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-background/80 backdrop-blur-sm">
                    <Star className="w-3 h-3 mr-1 fill-primary text-primary" />
                    {averageRating}
                  </Badge>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
              {/* Name & Location */}
              <div>
                <h3 className="text-base font-semibold text-foreground line-clamp-1">{dorm.dorm_name}</h3>
                <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{dorm.area || dorm.location}</span>
                </div>
              </div>

              {/* Amenities Preview Row */}
              {previewAmenities.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {previewAmenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      {renderAmenityIcon(amenity)}
                    </div>
                  ))}
                  {remainingAmenities > 0 && (
                    <span className="text-xs text-muted-foreground">+{remainingAmenities}</span>
                  )}
                </div>
              )}

              {/* Price & Info Row */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-foreground">${startingPrice}<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <DoorOpen className="w-3 h-3" />
                    {roomCount}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Bed className="w-3 h-3" />
                    {bedCount}
                  </span>
                </div>
              </div>

              {/* Gender preference */}
              {dorm.gender_preference && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {dorm.gender_preference === 'Male' && '♂ Male'}
                  {dorm.gender_preference === 'Female' && '♀ Female'}
                  {dorm.gender_preference === 'Mixed' && '⚥ Co-ed'}
                </Badge>
              )}
            </div>
          </div>

          {/* Back Face */}
          <div
            className="absolute inset-0 flip-card-3d rounded-2xl overflow-hidden border border-border bg-card shadow-lg"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateX(180deg)",
            }}
          >
            <div className="flex flex-col h-full p-4">
              {/* Header with Actions */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground line-clamp-1">{dorm.dorm_name}</h3>
                  {dorm.university && <p className="text-xs text-muted-foreground">Near {dorm.university}</p>}
                </div>
                <div className="flex gap-1.5 ml-2">
                  <ShareButton 
                    dormId={dorm.id} 
                    dormName={dorm.dorm_name}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted"
                  />
                  <button
                    onClick={toggleSave}
                    className="save-button h-8 w-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                    aria-label={isSaved ? "Remove from favorites" : "Save to favorites"}
                  >
                    <Bookmark
                      className={`w-4 h-4 transition-colors ${
                        isSaved ? "fill-primary text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted">
                {/* Room Types */}
                {hasMultipleRooms && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Room Options</p>
                    <div className="flex flex-wrap gap-1">
                      {roomTypes.slice(0, 4).map((room, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                          {room.type} - ${room.price}
                        </Badge>
                      ))}
                      {roomTypes.length > 4 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{roomTypes.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Shuttle */}
                {dorm.shuttle && (
                  <Badge variant="secondary" className="text-xs w-fit">
                    <Zap className="w-3 h-3 mr-1" />
                    Shuttle Available
                  </Badge>
                )}

                {/* Address */}
                {dorm.address && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">Address</p>
                    <p className="text-xs text-foreground line-clamp-2">{dorm.address}</p>
                  </div>
                )}

                {/* Amenities */}
                {dorm.amenities && dorm.amenities.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Amenities</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {dorm.amenities.slice(0, 6).map((amenity, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                          {renderAmenityIcon(amenity)}
                          <span className="truncate">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons - Fixed at bottom */}
              <div className="pt-3 space-y-2 border-t border-border/50 mt-2">
                <Button
                  onClick={handleViewBuilding}
                  size="sm"
                  className="w-full h-9 text-xs bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  View Building
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={handleQuickLook}
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Quick Look
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReviewModalOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                  >
                    <Star className="w-3.5 h-3.5 mr-1.5" />
                    Review
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Quick Look Modal */}
      <BuildingQuickLookModal
        open={quickLookOpen}
        onOpenChange={setQuickLookOpen}
        building={dorm}
      />

      <ReviewFormModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        dormId={dorm.id}
        dormName={dorm.dorm_name}
        onSubmitSuccess={() => {
          toast({
            title: "Review Submitted",
            description: "Thank you for your feedback!"
          });
          // Refresh rating
          supabase
            .from('reviews')
            .select('rating')
            .eq('dorm_id', dorm.id)
            .eq('status', 'approved')
            .then(({ data }) => {
              if (data && data.length > 0) {
                const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
                setAverageRating(Math.round(avg * 10) / 10);
                setReviewCount(data.length);
              }
            });
        }}
      />
    </>
  );
};

export const CinematicDormCard = memo(CinematicDormCardComponent);
