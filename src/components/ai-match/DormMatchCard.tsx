import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Home, TrendingUp, ExternalLink, CheckCircle, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getDormMatchLabel } from "@/utils/matchLabels";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WhyThisMatch } from "./WhyThisMatch";

interface DormMatchCardProps {
  dorm: any;
  index: number;
  onDismiss?: (dormId: string) => void;
}

export const DormMatchCard = ({ dorm, index, onDismiss }: DormMatchCardProps) => {
  const navigate = useNavigate();
  const matchScore = Math.round(dorm.score || 75);
  const matchLabel = getDormMatchLabel(matchScore);
  const isVerified = dorm.verification_status === 'approved';

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(dorm.id);
    }
  };

  // Get gender badge
  const getGenderBadge = () => {
    if (!dorm.gender_preference) return null;
    const gender = dorm.gender_preference.toLowerCase();
    if (gender === 'female') return { label: 'Female Only', variant: 'pink' };
    if (gender === 'male') return { label: 'Male Only', variant: 'blue' };
    return { label: 'Mixed', variant: 'default' };
  };

  const genderBadge = getGenderBadge();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer h-full">
        <CardContent className="p-0">
          {/* Image with gradient overlay and badges */}
          <div className="relative h-48 overflow-hidden bg-muted">
            {dorm.cover_image || dorm.image_url ? (
              <>
                <img 
                  src={dorm.cover_image || dorm.image_url} 
                  alt={dorm.dorm_name || dorm.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Home className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            
            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {isVerified && (
                  <Badge className="bg-green-500/90 backdrop-blur-sm text-white border-0 font-semibold">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {genderBadge && (
                  <Badge 
                    variant="secondary" 
                    className="bg-background/90 backdrop-blur-sm border-0"
                  >
                    {genderBadge.label}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {onDismiss && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="w-8 h-8 bg-background/90 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                          onClick={handleDismiss}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Not interested</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className={`${matchLabel.color} bg-background/90 backdrop-blur-sm px-3 py-1 font-bold cursor-help`}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {matchScore}%
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs font-semibold">{matchLabel.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {matchLabel.description}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-lg line-clamp-1">
                {dorm.dorm_name || dorm.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />
                <span className="line-clamp-1">{dorm.area}</span>
                {/* Distance - TODO: Re-enable after distance algorithm implementation
                {dorm.distance && (
                  <>
                    <span>•</span>
                    <span>{dorm.distance}</span>
                  </>
                )}
                */}
              </div>
            </div>

            {/* Starting Price */}
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary">
                From ${dorm.monthly_price}/month
              </span>
            </div>

            {/* Available Rooms */}
            {dorm.available_rooms !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {dorm.available_rooms} rooms available
                </span>
              </div>
            )}

            {/* Budget Warning Badge */}
            {dorm.budgetWarning && (
              <Badge variant="outline" className="text-amber-600 border-amber-500 text-xs">
                ⚠️ {dorm.budgetWarning}
              </Badge>
            )}

            {/* Why This Match */}
            {dorm.explanations && dorm.explanations.length > 0 && (
              <WhyThisMatch reasons={dorm.explanations} />
            )}
            
            {/* Fallback to reasoning */}
            {!dorm.explanations && dorm.reasoning && (
              <p className="text-xs text-muted-foreground italic">
                {dorm.reasoning}
              </p>
            )}

            {/* View Button */}
            <Button 
              onClick={() => navigate(`/dorm/${dorm.id}`)}
              className="w-full"
              variant="default"
            >
              View Details
              <ExternalLink className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
