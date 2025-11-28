import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, TrendingUp, GraduationCap, MapPin, DollarSign, Brain, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MatchBreakdownModal } from "./MatchBreakdownModal";
import { CompatibilityScores } from "@/hooks/useCompatibilityMatch";

interface RoommateMatchCardProps {
  roommate: any;
  index: number;
}

export const RoommateMatchCard = ({ roommate, index }: RoommateMatchCardProps) => {
  const navigate = useNavigate();
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  const matchScore = roommate.matchScore || roommate.scores?.overallScore || 70;
  const hasPersonalityMatch = roommate.hasPersonalityMatch || roommate.scores !== undefined;
  const personalityScore = roommate.personalityMatchScore;
  
  // Get scores for breakdown modal
  const scores: CompatibilityScores = roommate.scores || {
    overallScore: matchScore,
    lifestyleScore: 0,
    studyScore: 0,
    personalityScore: 0,
    similarityScore: 0,
    advancedScore: null
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getPersonalityLabel = (score: number | null) => {
    if (score === null) return '';
    if (score >= 85) return 'Great fit';
    if (score >= 70) return 'Good fit';
    if (score >= 55) return 'Moderate fit';
    return 'Different styles';
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
            <div className="flex flex-col items-end gap-1">
              <Badge className={`${getMatchColor(matchScore)} bg-background border font-bold`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {matchScore}%
              </Badge>
              
              {hasPersonalityMatch ? (
                <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                  <Brain className="w-3 h-3 mr-1" />
                  {getPersonalityLabel(personalityScore)}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">
                  General match
                </span>
              )}
            </div>
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            {hasPersonalityMatch && roommate.scores && (
              <Button 
                onClick={() => setShowBreakdown(true)}
                variant="outline"
                className="flex-1"
              >
                <BarChart2 className="mr-2 w-4 h-4" />
                View Breakdown
              </Button>
            )}
            <Button 
              onClick={() => navigate(`/student-profile/${roommate.user_id}`)}
              className="flex-1"
              variant="default"
            >
              <MessageCircle className="mr-2 w-4 h-4" />
              View Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Modal */}
      {hasPersonalityMatch && roommate.scores && (
        <MatchBreakdownModal
          open={showBreakdown}
          onOpenChange={setShowBreakdown}
          scores={scores}
          matchReasons={roommate.matchReasons || []}
          studentName={roommate.full_name || roommate.fullName || 'this student'}
        />
      )}
    </motion.div>
  );
};
