import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { ProfileIncompleteCard } from "@/components/ai-match/ProfileIncompleteCard";
import { LoadingState } from "@/components/ai-match/LoadingState";
import { AIInsightsCard } from "@/components/ai-match/AIInsightsCard";
import { DormMatchCard } from "@/components/ai-match/DormMatchCard";
import { RoommateMatchCard } from "@/components/ai-match/RoommateMatchCard";
import { RoommateComparison } from "@/components/ai-match/RoommateComparison";
import { DormComparison } from "@/components/listings/DormComparison";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Home, Users, Brain, Bug } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { shouldShowCompatibilityScore, isVipPlan, type AiMatchPlan } from "@/utils/tierLogic";
import { TierSelectionCard } from "@/components/ai-match/TierSelectionCard";
import { Card, CardContent } from "@/components/ui/card";

type ProfileStatus = 'loading' | 'incomplete' | 'complete';
type MatchMode = 'dorms' | 'roommates';
type ActiveMode = 'dorm' | 'roommate' | 'combined';

const AiMatch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('loading');
  const [matchMode, setMatchMode] = useState<MatchMode>('dorms');
  const [activeMode, setActiveMode] = useState<ActiveMode>('dorm');
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<AiMatchPlan>('basic');
  const [selectedPlan, setSelectedPlan] = useState<AiMatchPlan>('basic');
  const [matches, setMatches] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Check authentication and load profile
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use AI Match",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }
      setUserId(user.id);

      // Check if admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*, roles(*)')
        .eq('user_id', user.id);
      
      const adminRole = roles?.some(r => r.roles?.name === 'admin');
      setIsAdmin(!!adminRole);

      // Check for debug param
      const urlParams = new URLSearchParams(window.location.search);
      setShowDebug(urlParams.get('ai_debug') === '1' && !!adminRole);
    };

    checkAuth();
  }, [navigate, toast]);

  // Load and check profile completion
  useEffect(() => {
    if (!userId) return;

    const checkProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
          toast({
            title: "Error",
            description: "Failed to load your profile",
            variant: "destructive"
          });
          return;
        }

        if (!data) {
          setProfileStatus('incomplete');
          return;
        }

        const completionScore = data.profile_completion_score || 0;
        
        if (completionScore < 80) {
          setProfileStatus('incomplete');
          setStudentProfile({ ...data, profile_completion_score: completionScore });
        } else {
          setProfileStatus('complete');
          setStudentProfile(data);
          const plan = (data.ai_match_plan || 'basic') as AiMatchPlan;
          setUserPlan(plan);
          setSelectedPlan(plan);
        }
      } catch (err) {
        console.error('Error in checkProfile:', err);
        setProfileStatus('incomplete');
      }
    };

    checkProfile();
  }, [userId, toast]);

  // Determine which match mode to show based on profile (fallback for legacy)
  const determineMatchModeFromProfile = (profile: any) => {
    if (!profile) {
      setActiveMode('dorm');
      setMatchMode('dorms');
      return;
    }
    
    const needsDorm = profile.accommodation_status === 'need_dorm';
    const needsRoommateCurrentPlace = profile.needs_roommate_current_place === true;
    const needsRoommateNewDorm = profile.needs_roommate_new_dorm === true;
    const legacyNeedsRoommate = profile.need_roommate === true;
    
    if (needsDorm && needsRoommateNewDorm) {
      setActiveMode('combined');
      setMatchMode('dorms');
    } else if (needsDorm) {
      setActiveMode('dorm');
      setMatchMode('dorms');
    } else if (needsRoommateCurrentPlace || legacyNeedsRoommate) {
      setActiveMode('roommate');
      setMatchMode('roommates');
    } else {
      setActiveMode('dorm');
      setMatchMode('dorms');
    }
  };

  // Read mode from URL params or determine from profile
  useEffect(() => {
    if (!studentProfile) return;

    const urlMode = searchParams.get('mode');
    
    if (urlMode === 'dorm') {
      setActiveMode('dorm');
      setMatchMode('dorms');
    } else if (urlMode === 'roommate') {
      setActiveMode('roommate');
      setMatchMode('roommates');
    } else if (urlMode === 'combined') {
      setActiveMode('combined');
      setMatchMode('dorms'); // Default to dorms tab
    } else {
      // Fallback: determine from profile if no URL param
      determineMatchModeFromProfile(studentProfile);
    }
  }, [searchParams, studentProfile]);

  // Fetch matches when profile is complete
  useEffect(() => {
    if (profileStatus !== 'complete' || !userId || !studentProfile) return;
    fetchMatches();
  }, [profileStatus, userId, studentProfile, activeMode, matchMode]);

  // Generate match reasons for dorms
  const generateDormMatchReasons = (dorm: any, profile: any): string[] => {
    const reasons: string[] = [];

    if (profile.budget && dorm.monthly_price && Math.abs(profile.budget - dorm.monthly_price) < 100) {
      reasons.push(`Budget-friendly at $${dorm.monthly_price}`);
    }

    if (profile.university && dorm.university && 
        profile.university.toLowerCase() === dorm.university.toLowerCase()) {
      reasons.push('Near your university');
    }

    if (profile.preferred_housing_area && dorm.area &&
        profile.preferred_housing_area.toLowerCase() === dorm.area.toLowerCase()) {
      reasons.push('Preferred location');
    }

    if (dorm.amenities && profile.preferred_amenities) {
      const matchedAmenities = dorm.amenities.filter((a: string) => 
        profile.preferred_amenities.includes(a)
      );
      if (matchedAmenities.length > 0) {
        reasons.push(`${matchedAmenities.length} amenities match`);
      }
    }

    if (reasons.length === 0) {
      reasons.push('Verified listing', 'Great location');
    }

    return reasons.slice(0, 3);
  };

  // Fetch matches using AI Core
  const fetchMatches = async (excludeIds?: string[]) => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('roomy-ai-core', {
        body: {
          mode: activeMode,
          match_tier: selectedPlan,
          personality_enabled: studentProfile?.enable_personality_matching || false,
          limit: matchMode === 'dorms' ? 10 : undefined,
          context: {},
          exclude_ids: excludeIds
        }
      });

      if (error) throw error;

      if (data.matches) {
        setMatches(data.matches);
        setAiInsights(data.insights_banner || '');
      }

    } catch (error) {
      console.error('Error fetching matches:', error);
      setAiInsights('Roomy AI is temporarily unavailable. Showing cached results.');
      toast({
        title: "Error",
        description: "Failed to load matches. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle match dismissal
  const handleDismissMatch = async (matchId: string, matchType: 'dorm' | 'roommate') => {
    // Log negative feedback
    try {
      if (userId) {
        await supabase.from('ai_feedback').insert({
          user_id: userId,
          ai_action: matchType === 'dorm' ? 'match_dorm' : 'match_roommate',
          target_id: matchId,
          helpful_score: 2, // Low score for dismissal
          context: { dismissed: true, tier: selectedPlan, mode: activeMode }
        });
      }
    } catch (error) {
      console.error('Error logging feedback:', error);
    }

    // Update dismissed IDs and remove from current matches
    const newDismissedIds = [...dismissedIds, matchId];
    setDismissedIds(newDismissedIds);
    setMatches(prev => prev.filter(m => m.id !== matchId));

    // Fetch alternative suggestions
    toast({
      title: "Finding alternatives...",
      description: "Looking for other matches you might like",
    });
    
    await fetchMatches(newDismissedIds);
  };

  // Update plan and re-fetch matches
  const handlePlanChange = async (plan: AiMatchPlan) => {
    setSelectedPlan(plan);
    setUserPlan(plan);
    
    if (userId) {
      await supabase
        .from('students')
        .update({ ai_match_plan: plan })
        .eq('user_id', userId);
    }
    
    // Re-fetch matches with new tier
    fetchMatches();
  };

  // Handle mode toggle
  const handleModeChange = (value: string) => {
    if (value) {
      setMatchMode(value as MatchMode);
    }
  };

  if (profileStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background pt-24 md:pt-28">
        {!isMobile && <Navbar />}
        <div className="container mx-auto px-4 py-8">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (profileStatus === 'incomplete') {
    return (
      <div className="min-h-screen bg-background pt-24 md:pt-28">
        {!isMobile && <Navbar />}
        <ProfileIncompleteCard percentage={studentProfile?.profile_completion_score || 0} />
        <Footer />
      </div>
    );
  }

  // Determine tab visibility
  const showDormTab = activeMode === 'dorm' || activeMode === 'combined';
  const showRoommateTab = activeMode === 'roommate' || activeMode === 'combined';
  const showToggle = activeMode === 'combined';
  const showCompatibilityScores = shouldShowCompatibilityScore(userPlan);
  const isVip = isVipPlan(userPlan);

  // Dynamic header text
  const getHeaderTitle = () => {
    switch (activeMode) {
      case 'dorm':
        return 'AI-Powered Dorm Matching';
      case 'roommate':
        return 'AI-Powered Roommate Matching';
      case 'combined':
        return 'AI-Powered Dorm & Roommate Matching';
      default:
        return 'AI-Powered Matching';
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 md:pt-28">
      {!isMobile && <Navbar />}
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">
            {getHeaderTitle()}
          </h1>
          <p className="text-muted-foreground text-lg">
            Powered by Gemini AI, personalized just for you
          </p>
        </div>

        {/* Mode Toggle */}
        {showToggle && (
          <div className="flex justify-center">
            <ToggleGroup 
              type="single" 
              value={matchMode} 
              onValueChange={handleModeChange}
              className="bg-muted p-1 rounded-lg"
            >
              {showDormTab && (
                <ToggleGroupItem 
                  value="dorms" 
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6 py-2"
                >
                  <Home className="mr-2 w-4 h-4" />
                  Find Dorms
                </ToggleGroupItem>
              )}
              {showRoommateTab && (
                <ToggleGroupItem 
                  value="roommates"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6 py-2"
                >
                  <Users className="mr-2 w-4 h-4" />
                  Find Roommates
                </ToggleGroupItem>
              )}
            </ToggleGroup>
          </div>
        )}

        {/* Tier Selection - Show only on roommate views */}
        {(activeMode === 'roommate' || (activeMode === 'combined' && matchMode === 'roommates')) && (
          <TierSelectionCard 
            selectedPlan={selectedPlan}
            onPlanChange={handlePlanChange}
          />
        )}

        {/* Loading State */}
        {loading && <LoadingState />}

        {/* Results */}
        {!loading && matches.length > 0 && (
          <>
            {/* AI Insights */}
            {aiInsights && (
              <AIInsightsCard insights={aiInsights} />
            )}

            {/* Dorm Comparison (only show for dorm mode) */}
            {matchMode === 'dorms' && matches.length > 0 && (
              <DormComparison 
                dorms={matches}
                userId={userId}
              />
            )}

            {/* Roommate Comparison (only show for roommate mode) */}
            {matchMode === 'roommates' && matches.length > 0 && (
              <RoommateComparison 
                roommates={matches} 
                matchTier={selectedPlan}
              />
            )}

            {/* Matches Grid */}
            <div>
              {matchMode === 'roommates' && matches.some(m => m.hasPersonalityMatch) && (
                <>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-500" />
                    Top Personality Matches
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                     {matches.filter(m => m.hasPersonalityMatch).map((match, index) => (
                      <RoommateMatchCard 
                        key={match.user_id} 
                        roommate={match} 
                        index={index}
                        showCompatibilityScore={shouldShowCompatibilityScore(userPlan)}
                        isVip={isVipPlan(userPlan)}
                      />
                    ))}
                  </div>
                </>
              )}

              <h2 className="text-2xl font-bold mb-6">
                {matchMode === 'dorms' 
                  ? 'Top Dorm Matches' 
                  : matches.some(m => m.hasPersonalityMatch) 
                    ? 'Other Compatible Roommates' 
                    : 'Compatible Roommates'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(matchMode === 'roommates' 
                  ? matches.filter(m => !m.hasPersonalityMatch)
                  : matches
                ).map((match, index) => (
                  matchMode === 'dorms' ? (
                    <DormMatchCard 
                      key={match.id} 
                      dorm={match} 
                      index={index}
                      onDismiss={(id) => handleDismissMatch(id, 'dorm')}
                    />
                  ) : (
                      <RoommateMatchCard 
                        key={match.user_id} 
                        roommate={match} 
                        index={index}
                        showCompatibilityScore={shouldShowCompatibilityScore(userPlan)}
                        isVip={isVipPlan(userPlan)}
                        matchTier={selectedPlan}
                        onDismiss={(id) => handleDismissMatch(id, 'roommate')}
                      />
                  )
                ))}
              </div>
            </div>
          </>
        )}

        {/* No Matches */}
        {!loading && matches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No matches found. Try updating your preferences in your profile.
            </p>
          </div>
        )}
      </div>

      {/* Admin Debug Overlay */}
      {isAdmin && showDebug && matches.length > 0 && (
        <Card className="fixed bottom-4 right-4 bg-background/95 backdrop-blur-sm border-2 border-amber-500 rounded-lg shadow-2xl max-w-md z-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bug className="w-5 h-5 text-amber-500" />
              <h4 className="font-bold text-sm">🔧 AI Debug Panel</h4>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-muted-foreground">Mode:</span>
                <span className="font-semibold">{activeMode}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-muted-foreground">Tier:</span>
                <span className="font-semibold uppercase">{selectedPlan}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-muted-foreground">Personality:</span>
                <span className="font-semibold">
                  {studentProfile?.enable_personality_matching ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              <div>
                <div className="text-muted-foreground mb-2 font-semibold">Top 3 Matches:</div>
                {matches.slice(0, 3).map((m, i) => (
                  <div key={i} className="mb-2 p-2 bg-muted/30 rounded">
                    <div className="font-medium">
                      {m.type === 'dorm' ? m.dorm_name || m.name : m.full_name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Overall: {Math.round(m.score)}%
                    </div>
                    {m.subScores && (
                      <div className="text-[10px] text-muted-foreground">
                        {m.type === 'dorm' ? (
                          <>Loc:{m.subScores.location_score} • Bud:{m.subScores.budget_score} • Room:{m.subScores.room_type_score}</>
                        ) : (
                          <>Life:{m.subScores.lifestyle_score} • Clean:{m.subScores.cleanliness_score} • Study:{m.subScores.study_focus_score}</>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Footer />
    </div>
  );
};

export default AiMatch;
