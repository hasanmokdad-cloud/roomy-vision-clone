import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, TrendingUp, GraduationCap, MapPin, DollarSign, BarChart2, Crown, Lock, X, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MatchBreakdownModal } from "./MatchBreakdownModal";
import { CompatibilityScores } from "@/hooks/useCompatibilityMatch";
import { getMatchLabel, getBasicTierLabel } from "@/utils/matchLabels";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EnhancedCompatibilityRing } from "./EnhancedCompatibilityRing";
import { CategoryBreakdownBars } from "./CategoryBreakdownBars";
import { WhyThisMatch } from "./WhyThisMatch";
import { AddFriendButton } from "@/components/friends/AddFriendButton";

interface RoommateMatchCardProps {
  roommate: any;
  index: number;
  showCompatibilityScore?: boolean;
  isVip?: boolean;
  matchTier?: 'basic' | 'advanced' | 'vip';
  onDismiss?: (roommateId: string) => void;
  currentStudentId?: string | null;
}

export const RoommateMatchCard = ({ 
  roommate, 
  index,
  showCompatibilityScore = true,
  isVip = false,
  matchTier = 'basic',
  onDismiss,
  currentStudentId
}: RoommateMatchCardProps) => {
  const navigate = useNavigate();
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Debug logging for missing data
  useEffect(() => {
    if (!roommate.id) {
      console.warn('[RoommateMatchCard] Missing roommate.id:', roommate);
    }
    if (!roommate.full_name) {
      console.warn('[RoommateMatchCard] Missing roommate.full_name:', roommate);
    }
  }, [roommate]);
  
  const matchScore = roommate.matchScore || roommate.scores?.overallScore || 70;
  const hasPersonalityMatch = roommate.hasPersonalityMatch || roommate.scores !== undefined;
  const personalityScore = roommate.personalityMatchScore;
  
  // Room confirmation info
  const hasConfirmedRoom = roommate.room_confirmed && roommate.current_room_name;
  const currentRoomName = roommate.current_room_name;
  const currentDormName = roommate.current_dorm_name;
  
  // Get scores for breakdown modal
  const scores: CompatibilityScores = roommate.scores || {
    overallScore: matchScore,
    lifestyleScore: 0,
    studyScore: 0,
    personalityScore: 0,
    similarityScore: 0,
    advancedScore: null
  };

  // Get match label based on tier
  const matchLabel = matchTier === 'basic' 
    ? getBasicTierLabel()
    : getMatchLabel(matchScore);

  const getInitials = (name: string | undefined | null) => {
    if (!name || name.trim() === '') return 'U';
    return name
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(roommate.id);
    }
  };

  // Build category breakdown for VIP
  const categories = matchTier === 'vip' && roommate.subScores?.personality_breakdown ? [
    {
      label: 'Cleanliness',
      score: Math.round((roommate.subScores.personality_breakdown.cleanliness || 0) * 100),
      description: 'How well your cleaning habits and standards match'
    },
    {
      label: 'Sleep Schedule',
      score: Math.round((roommate.subScores.personality_breakdown.sleep_schedule || 0) * 100),
      description: 'Compatibility in sleep and wake times'
    },
    {
      label: 'Study Habits',
      score: Math.round((roommate.subScores.personality_breakdown.study || 0) * 100),
      description: 'Similarity in study environment preferences'
    },
    {
      label: 'Social Style',
      score: Math.round((roommate.subScores.personality_breakdown.social_style || 0) * 100),
      description: 'How well your social preferences align'
    },
    {
      label: 'Noise Tolerance',
      score: Math.round((roommate.subScores.personality_breakdown.noise_compatibility || 0) * 100),
      description: 'Agreement on acceptable noise levels'
    }
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
        <CardContent className="p-6 space-y-4">
          {/* Header with Avatar and Compatibility Ring */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                <AvatarImage src={roommate.profile_photo_url} alt={roommate.full_name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                  {getInitials(roommate.full_name)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg line-clamp-1">{roommate.full_name || 'Unknown Student'}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {roommate.age && <span>{roommate.age} years</span>}
                    {roommate.gender && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{roommate.gender}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Compatibility Ring */}
                {matchTier !== 'basic' && (
                  <div className="flex-shrink-0">
                    <EnhancedCompatibilityRing 
                      percentage={matchScore} 
                      size="small" 
                      showLabel={false}
                    />
                  </div>
                )}
              </div>
              
              {/* Tier Badge */}
              {matchTier !== 'basic' && (
                <Badge className={`${matchLabel.color} mt-2 text-xs`} variant="outline">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {matchLabel.label}
                </Badge>
              )}
              
              {isVip && matchScore >= 85 && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center gap-1 mt-1 w-fit">
                  <Crown className="w-3 h-3" />
                  VIP Pick
                </Badge>
              )}
            </div>

            {/* Dismiss Button */}
            {onDismiss && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={handleDismiss}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Not interested</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Confirmed Room Badge */}
          {hasConfirmedRoom && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1 w-fit bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Home className="w-3 h-3" />
              {currentRoomName} at {currentDormName}
            </Badge>
          )}

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

          {/* Why This Match */}
          {roommate.explanations && roommate.explanations.length > 0 && (
            <WhyThisMatch reasons={roommate.explanations} />
          )}

          {/* Personality Compatibility - Tier-Based Display */}
          {matchTier === 'basic' && (
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-dashed">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-help">
                      Personality matching locked
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Upgrade to Advanced or VIP to unlock personality compatibility
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* VIP Category Breakdown Bars */}
          {matchTier === 'vip' && categories.length > 0 && (
            <div className="space-y-3 p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <Crown className="w-4 h-4 text-amber-500" />
                  VIP Breakdown
                </h4>
                {roommate.subScores?.personality_score && (
                  <span className="text-sm font-bold text-amber-600">
                    {Math.round(roommate.subScores.personality_score)}%
                  </span>
                )}
              </div>
              <CategoryBreakdownBars categories={categories} />
              <Badge variant="outline" className="text-xs w-full justify-center mt-2">
                Powered by Gemini AI
              </Badge>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => navigate(`/student-profile/${roommate.user_id}`)}
              variant="default"
              size="sm"
              className="w-full"
            >
              View Profile
            </Button>
            <div className="flex gap-2">
              {showCompatibilityScore && hasPersonalityMatch && roommate.scores && (
                <Button 
                  onClick={() => setShowBreakdown(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <BarChart2 className="w-4 h-4 mr-1" />
                  Breakdown
                </Button>
              )}
              {currentStudentId && roommate.id && roommate.id !== currentStudentId && (
                <AddFriendButton 
                  currentStudentId={currentStudentId}
                  targetStudentId={roommate.id}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                />
              )}
            </div>
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
