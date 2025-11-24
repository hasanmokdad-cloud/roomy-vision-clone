import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Home, TrendingUp, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface DormMatchCardProps {
  dorm: any;
  index: number;
}

export const DormMatchCard = ({ dorm, index }: DormMatchCardProps) => {
  const navigate = useNavigate();
  const matchScore = Math.round(dorm.score || 75);

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
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
            <div className="absolute top-3 right-3">
              <Badge className={`${getMatchColor(matchScore)} bg-background/90 backdrop-blur-sm px-3 py-1 font-bold`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {matchScore}% Match
              </Badge>
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

            {/* Price */}
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary">
                ${dorm.monthly_price}/month
              </span>
            </div>

            {/* Match Reasons */}
            {dorm.matchReasons && dorm.matchReasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {dorm.matchReasons.slice(0, 3).map((reason: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {reason}
                  </Badge>
                ))}
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
