import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, TrendingUp, GraduationCap, MapPin, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface RoommateMatchCardProps {
  roommate: any;
  index: number;
}

export const RoommateMatchCard = ({ roommate, index }: RoommateMatchCardProps) => {
  const navigate = useNavigate();
  const matchScore = roommate.matchScore || 70;

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 ring-2 ring-primary/20">
              <AvatarImage src={roommate.profile_photo_url} alt={roommate.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {getInitials(roommate.full_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg line-clamp-1">{roommate.full_name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {roommate.age && <span>{roommate.age} years</span>}
                {roommate.gender && (
                  <>
                    <span>•</span>
                    <span>{roommate.gender}</span>
                  </>
                )}
              </div>
            </div>

            {/* Match Score */}
            <Badge className={`${getMatchColor(matchScore)} bg-background border font-bold`}>
              <TrendingUp className="w-3 h-3 mr-1" />
              {matchScore}%
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            {roommate.university && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="w-4 h-4" />
                <span className="line-clamp-1">{roommate.university}</span>
              </div>
            )}
            {roommate.preferred_university && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">Prefers: {roommate.preferred_university}</span>
              </div>
            )}
            {roommate.budget && (
              <div className="flex items-center gap-2 text-primary">
                <DollarSign className="w-4 h-4" />
                <span className="font-semibold">${roommate.budget}/month budget</span>
              </div>
            )}
          </div>

          {/* Match Reasons */}
          {roommate.matchReasons && roommate.matchReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {roommate.matchReasons.slice(0, 3).map((reason: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {reason}
                </Badge>
              ))}
            </div>
          )}

          {/* Connect Button */}
          <Button 
            onClick={() => navigate(`/student-profile/${roommate.user_id}`)}
            className="w-full"
            variant="default"
          >
            <MessageCircle className="mr-2 w-4 h-4" />
            View Profile
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
