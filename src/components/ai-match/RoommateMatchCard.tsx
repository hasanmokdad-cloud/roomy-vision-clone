import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, TrendingUp, GraduationCap, MapPin, DollarSign, Brain, BarChart2, Crown, Info, Lock, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MatchBreakdownModal } from "./MatchBreakdownModal";
import { CompatibilityScores } from "@/hooks/useCompatibilityMatch";
import { getMatchLabel, getBasicTierLabel } from "@/utils/matchLabels";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RoommateMatchCardProps {
  roommate: any;
  index: number;
  showCompatibilityScore?: boolean;
  isVip?: boolean;
  matchTier?: 'basic' | 'advanced' | 'vip';
  onDismiss?: (roommateId: string) => void;
}

export const RoommateMatchCard = ({ 
  roommate, 
  index,
  showCompatibilityScore = true,
  isVip = false,
  matchTier = 'basic',
  onDismiss
}: RoommateMatchCardProps) => {
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

  // Get match label based on tier
  const matchLabel = matchTier === 'basic' 
    ? getBasicTierLabel()
    : getMatchLabel(matchScore);

  const getInitials = (name: string | undefined | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(roommate.id);
    }
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

            {/* Match Score & Label */}
            <div className="flex flex-col items-end gap-1">
              {onDismiss && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 hover:bg-destructive hover:text-destructive-foreground -mt-1 -mr-1"
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Badge className={`${matchLabel.color} bg-background border font-bold`}>
                        {matchTier === 'basic' ? (
                          matchLabel.label
                        ) : (
                          <>
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {matchLabel.label} • {matchScore}%
                          </>
                        )}
                      </Badge>
                      {matchTier !== 'basic' && (
                        <Info className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{matchLabel.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {isVip && matchScore >= 85 && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  VIP Recommended
                </Badge>
              )}
              
              {/* Sub-scores for debug */}
              {roommate.subScores && matchTier !== 'basic' && (
                <div className="text-[10px] text-muted-foreground text-right">
                  L:{roommate.subScores.lifestyle_score} C:{roommate.subScores.cleanliness_score} S:{roommate.subScores.study_focus_score}
                </div>
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
            
            {/* NEW: Why You Got This Match Explanations */}
            {roommate.explanations && roommate.explanations.length > 0 && (
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                <p className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Why this match?
                </p>
                <ul className="space-y-1">
                  {roommate.explanations.map((explanation: string, idx: number) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{explanation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Personality Compatibility - Tier-Based Display */}
          {matchTier === 'basic' && (
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-dashed">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground">
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

          {matchTier === 'advanced' && roommate.subScores?.personality_score !== undefined && roommate.subScores.personality_score !== null && (
            <div className="space-y-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-1">
                  <Brain className="w-4 h-4 text-blue-500" />
                  Personality Match
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {Math.round(roommate.subScores.personality_score)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${roommate.subScores.personality_score}%` }}
                />
              </div>
            </div>
          )}

          {matchTier === 'vip' && roommate.subScores?.personality_breakdown && (
            <div className="space-y-3 p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  VIP Compatibility Breakdown
                </h4>
                {roommate.subScores.personality_score && (
                  <span className="text-sm font-bold text-amber-600">
                    {Math.round(roommate.subScores.personality_score)}%
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Sleep schedule:</span>
                  <span className="font-semibold">{Math.round((roommate.subScores.personality_breakdown.sleep_schedule || 0) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Cleanliness:</span>
                  <span className="font-semibold">{Math.round((roommate.subScores.personality_breakdown.cleanliness || 0) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Study habits:</span>
                  <span className="font-semibold">{Math.round((roommate.subScores.personality_breakdown.study || 0) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Social style:</span>
                  <span className="font-semibold">{Math.round((roommate.subScores.personality_breakdown.social_style || 0) * 100)}%</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span>Noise tolerance:</span>
                  <span className="font-semibold">{Math.round((roommate.subScores.personality_breakdown.noise_compatibility || 0) * 100)}%</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Powered by Gemini AI Personality Engine
              </Badge>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {showCompatibilityScore && hasPersonalityMatch && roommate.scores && (
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
