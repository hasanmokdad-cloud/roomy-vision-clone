import { motion } from "framer-motion";
import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle, Wifi, Zap, Home, Navigation, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShareButton } from "@/components/shared/ShareButton";

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
  };
  index: number;
}

const CinematicDormCardComponent = ({ dorm, index }: CinematicDormCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Load user and check if dorm is saved
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      
      if (uid) {
        const { data } = await supabase
          .from("saved_items")
          .select("id")
          .eq("user_id", uid)
          .eq("item_id", dorm.id)
          .eq("item_type", "dorm")
          .maybeSingle();
        
        setIsSaved(!!data);
      }
    });
  }, [dorm.id]);

  // Memoized room types calculations
  const roomTypes: RoomType[] = useMemo(() => dorm.room_types_json || [], [dorm.room_types_json]);
  const hasMultipleRooms = useMemo(() => roomTypes.length > 1, [roomTypes.length]);

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

  const handleLearnMore = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(`/dorm/${dorm.id}`);
    },
    [navigate, dorm.id],
  );

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't navigate if clicking on save or share button
    if (target.closest('.save-button') || target.closest('.share-button')) {
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
        // Remove from saved
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
        // Add to saved
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

  const amenityIcons: Record<string, any> = useMemo(
    () => ({
      WiFi: Wifi,
      Internet: Wifi,
      Electricity: Zap,
      Furnished: Home,
    }),
    [],
  );

  const getAmenityIcon = useCallback(
    (amenity: string) => {
      const IconComponent = amenityIcons[amenity] || Navigation;
      return <IconComponent className="w-3 h-3" />;
    },
    [amenityIcons],
  );

  const cardVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 60, scale: 0.95 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          delay: prefersReducedMotion ? 0 : index * 0.1,
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
        },
      },
    }),
    [prefersReducedMotion, index],
  );

  return (
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
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full h-[420px] cursor-pointer"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front Face */}
          <div
            className="absolute inset-0 flip-card-3d glass-hover rounded-3xl overflow-hidden border border-border shadow-xl card-glow-hover"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Image */}
            <div className="relative h-56 overflow-hidden">
              <img
                src={dormImage}
                alt={dorm.dorm_name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                {isVerified && (
                  <Badge variant="secondary" className="neon-glow backdrop-blur-sm">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {hasMultipleRooms && (
                  <Badge variant="secondary" className="backdrop-blur-sm">
                    {roomTypes.length} Room Types
                  </Badge>
                )}
              </div>

            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-2xl font-black gradient-text mb-2 line-clamp-1">{dorm.dorm_name}</h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{dorm.area || dorm.location}</span>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    {hasMultipleRooms ? "Starting from" : "Monthly Price"}
                  </div>
                  <div className="text-3xl font-black gradient-text">${startingPrice}</div>
                </div>
                {hasMultipleRooms && (
                  <Badge variant="outline" className="text-xs">
                    Click to explore
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Back Face */}
          <div
            className="absolute inset-0 flip-card-3d glass-hover rounded-3xl overflow-visible border border-border shadow-xl"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateX(180deg)",
            }}
          >
            <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/30 p-6">
              {/* Share and Save Buttons */}
              <div className="flex justify-end gap-2 mb-4">
                <ShareButton 
                  dormId={dorm.id} 
                  dormName={dorm.dorm_name}
                  size="icon"
                  variant="ghost"
                  className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background"
                />
                <button
                  onClick={toggleSave}
                  className="save-button p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
                  aria-label={isSaved ? "Remove from favorites" : "Save to favorites"}
                >
                  <Bookmark
                    className={`w-5 h-5 transition-colors ${
                      isSaved ? "fill-primary text-primary" : "text-muted-foreground"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black gradient-text mb-2 line-clamp-2">{dorm.dorm_name}</h3>
                  {dorm.university && <p className="text-sm text-muted-foreground">Near {dorm.university}</p>}
                </div>

                {hasMultipleRooms && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Available Rooms:</p>
                    <div className="flex flex-wrap gap-1">
                      {roomTypes.map((room, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {room.type} - ${room.price}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {dorm.shuttle && (
                  <Badge variant="secondary" className="w-fit">
                    <Zap className="w-3 h-3 mr-1" />
                    Shuttle Available
                  </Badge>
                )}

                {dorm.address && (
                  <div className="text-sm text-foreground">
                    <p className="font-semibold mb-1">Address:</p>
                    <p className="text-muted-foreground line-clamp-2">{dorm.address}</p>
                  </div>
                )}

                {dorm.amenities && dorm.amenities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Amenities:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {dorm.amenities.slice(0, 6).map((amenity, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                          {getAmenityIcon(amenity)}
                          <span className="truncate">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleLearnMore}
                className="w-full mt-4"
                aria-label={
                  hasMultipleRooms
                    ? `View all ${roomTypes.length} room types for ${dorm.dorm_name}`
                    : `Learn more about ${dorm.dorm_name}`
                }
              >
                {hasMultipleRooms ? "View All Rooms" : "Learn More"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
  );
};

export const CinematicDormCard = memo(CinematicDormCardComponent);
