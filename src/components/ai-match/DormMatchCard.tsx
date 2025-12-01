import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Home, TrendingUp, ExternalLink, Info, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getDormMatchLabel } from "@/utils/matchLabels";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DormMatchCardProps {
  dorm: any;
  index: number;
  onDismiss?: (dormId: string) => void;
}

export const DormMatchCard = ({ dorm, index, onDismiss }: DormMatchCardProps) => {
  const navigate = useNavigate();
  const matchScore = Math.round(dorm.score || 75);
  const matchLabel = getDormMatchLabel(matchScore);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(dorm.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer h-full">
        <CardContent className="p-0">
          {/* Image */}
          <div className="relative h-48 overflow-hidden bg-muted">
            {dorm.cover_image || dorm.image_url ? (
              <img 
                src={dorm.cover_image || dorm.image_url} 
                alt={dorm.dorm_name || dorm.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Home className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            
            {/* Match Score Badge */}
            <div className="absolute top-3 right-3 flex gap-2">
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
                      {matchLabel.label} • {matchScore}%
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{matchLabel.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on budget, location, and room type
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
              </div>
            </div>

            {/* Starting Price */}
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary">
                From ${dorm.monthly_price}/month
              </span>
            </div>

            {/* Match Reasons */}
            {dorm.reasoning && (
              <p className="text-sm text-muted-foreground italic">
                {dorm.reasoning}
              </p>
            )}
            
            {/* NEW: Why You Got This Match Explanations */}
            {dorm.explanations && dorm.explanations.length > 0 && (
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                <p className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Why this match?
                </p>
                <ul className="space-y-1">
                  {dorm.explanations.map((explanation: string, idx: number) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{explanation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Sub-scores for debug */}
            {dorm.subScores && (
              <div className="text-[10px] text-muted-foreground">
                Location: {dorm.subScores.location_score}% • Budget: {dorm.subScores.budget_score}% • Room: {dorm.subScores.room_type_score}%
              </div>
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
