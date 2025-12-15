import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RoomyNavbar } from "@/components/RoomyNavbar";
import Footer from "@/components/shared/Footer";
import { ProfileIncompleteCard } from "@/components/ai-match/ProfileIncompleteCard";
import { LoadingState } from "@/components/ai-match/LoadingState";
import { AIInsightsCard } from "@/components/ai-match/AIInsightsCard";
import { DormMatchCard } from "@/components/ai-match/DormMatchCard";
import { RoomMatchCard } from "@/components/ai-match/RoomMatchCard";
import { RoommateMatchCard } from "@/components/ai-match/RoommateMatchCard";
import { RoommateComparison } from "@/components/ai-match/RoommateComparison";
import { DormComparison } from "@/components/listings/DormComparison";
import { TierSelector } from "@/components/ai-match/TierSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Bug, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { shouldShowCompatibilityScore, isVipPlan, type AiMatchPlan } from "@/utils/tierLogic";
import { EmptyMatchState } from "@/components/ai-match/EmptyMatchState";
import { MatchModeTabs } from "@/components/ai-match/MatchModeTabs";
import { useMatchTier } from "@/hooks/useMatchTier";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

type ProfileStatus = 'loading' | 'incomplete' | 'complete';
type MatchMode = 'apartments' | 'rooms' | 'roommates';
type ActiveMode = 'dorm' | 'roommate' | 'rooms' | 'combined';

const AiMatch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { isAuthReady, userId, isAuthenticated, openAuthModal } = useAuth();
  const [searchParams] = useSearchParams();
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('loading');
  const [matchMode, setMatchMode] = useState<MatchMode>('apartments');
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

  // Check authentication - show Airbnb-style login prompt for unauthenticated users
  useEffect(() => {
    if (!isAuthReady || !isAuthenticated || !userId) return;

    // Check if admin
    const checkAdmin = async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*, roles(*)')
        .eq('user_id', userId);
      
      const adminRole = roles?.some(r => r.roles?.name === 'admin');
      setIsAdmin(!!adminRole);

      // Check for debug param
      const urlParams = new URLSearchParams(window.location.search);
      setShowDebug(urlParams.get('ai_debug') === '1' && !!adminRole);
    };

    checkAdmin();
  }, [isAuthReady, isAuthenticated, userId]);

  // Unauthenticated state - Airbnb style (both mobile and desktop)
  if (isAuthReady && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {!isMobile && <RoomyNavbar />}
        
        <div className={`${isMobile ? 'pt-20 px-6 pb-32' : 'pt-32 px-6 pb-16'}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center space-y-6"
          >
            <h1 className="text-3xl font-bold text-foreground">AI Match</h1>
            
            <div className="py-12">
              <Sparkles className="w-16 h-16 mx-auto text-muted-foreground/30 mb-6" />
              <h2 className="text-xl font-semibold mb-2">Log in to find your perfect match</h2>
              <p className="text-muted-foreground">
                Get AI-powered recommendations for dorms and roommates.
              </p>
            </div>

            <Button
              onClick={() => openAuthModal()}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-6 text-lg rounded-xl"
            >
              Log in
            </Button>
          </motion.div>
        </div>
        
        {isMobile && <BottomNav />}
      </div>
    );
  }

  // Check if admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!userId) return;
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*, roles(*)')
        .eq('user_id', userId);
      
      const adminRole = roles?.some(r => r.roles?.name === 'admin');
      setIsAdmin(!!adminRole);

      // Check for debug param
      const urlParams = new URLSearchParams(window.location.search);
      setShowDebug(urlParams.get('ai_debug') === '1' && !!adminRole);
    };

    checkAdmin();
  }, [userId]);

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
      setMatchMode('apartments');
      return;
    }
    
    const needsDorm = profile.accommodation_status === 'need_dorm';
    const needsRoommateCurrentPlace = profile.needs_roommate_current_place === true;
    const needsRoommateNewDorm = profile.needs_roommate_new_dorm === true;
    const legacyNeedsRoommate = profile.need_roommate === true;
    
    if (needsDorm && needsRoommateNewDorm) {
      setActiveMode('combined');
      setMatchMode('apartments');
    } else if (needsDorm) {
      setActiveMode('dorm');
      setMatchMode('apartments');
    } else if (needsRoommateCurrentPlace || legacyNeedsRoommate) {
      setActiveMode('roommate');
      setMatchMode('roommates');
    } else {
      setActiveMode('dorm');
      setMatchMode('apartments');
    }
  };

  // Read mode from URL params or determine from profile
  useEffect(() => {
    if (!studentProfile) return;

    const urlMode = searchParams.get('mode');
    
    if (urlMode === 'dorm' || urlMode === 'apartments') {
      setActiveMode('dorm');
      setMatchMode('apartments');
    } else if (urlMode === 'rooms') {
      setActiveMode('rooms');
      setMatchMode('rooms');
    } else if (urlMode === 'roommate') {
      setActiveMode('roommate');
      setMatchMode('roommates');
    } else if (urlMode === 'combined') {
      setActiveMode('combined');
      setMatchMode('apartments'); // Default to apartments tab
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

  // Map frontend mode to backend mode
  const getBackendMode = (mode: MatchMode): string => {
    if (mode === 'apartments') return 'dorm';
    if (mode === 'rooms') return 'rooms';
    return 'roommate';
  };

  // Fetch matches using AI Core with timeout
  const fetchMatches = async (excludeIds?: string[]) => {
    setLoading(true);
    setAiInsights(''); // Clear stale insights immediately

    // Create timeout for request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      const backendMode = getBackendMode(matchMode);
      const { data, error } = await supabase.functions.invoke('roomy-ai-core', {
        body: {
          mode: backendMode,
          match_tier: selectedPlan,
          personality_enabled: studentProfile?.enable_personality_matching || false,
          limit: matchMode === 'apartments' ? 10 : matchMode === 'rooms' ? 20 : undefined,
          context: {},
          exclude_ids: excludeIds
        }
      });

      clearTimeout(timeoutId);

      if (error) throw error;

      if (data.matches) {
        // Filter matches to ensure correct type for current mode
        const expectedType = matchMode === 'apartments' ? 'dorm' : matchMode === 'rooms' ? 'room' : 'roommate';
        const filteredMatches = data.matches.filter((m: any) => m.type === expectedType);
        setMatches(filteredMatches);
        setAiInsights(data.insights_banner || '');
      } else {
        setMatches([]);
        setAiInsights('');
      }

    } catch (error: any) {
      console.error('Error fetching matches:', error);
      clearTimeout(timeoutId);
      
      // Don't leave stale state on error
      setMatches([]);
      setAiInsights('');
      
      const isTimeout = error?.name === 'AbortError' || error?.message?.includes('timeout');
      toast({
        title: isTimeout ? "Request Timeout" : "Error",
        description: isTimeout 
          ? "AI matching is taking too long. Please try again." 
          : "Failed to load matches. Please try again.",
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

  // Ref for scrolling to matches section
  const matchesSectionRef = useRef<HTMLDivElement>(null);

  // Handle tier upgrade (triggers payment flow)
  const handleUpgrade = async (plan: AiMatchPlan) => {
    setSelectedPlan(plan);
    // Payment flow handled by useMatchTier
  };

  // Handle tier downgrade
  const handleDowngrade = async (plan: AiMatchPlan) => {
    setSelectedPlan(plan);
    setUserPlan(plan);
    
    if (userId) {
      await supabase
        .from('students')
        .update({ ai_match_plan: plan })
        .eq('user_id', userId);
    }
    
    // Re-fetch matches with new tier
    await fetchMatches();
    
    // Auto-scroll to results
    matchesSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        {!isMobile && <RoomyNavbar />}
        <div className="container mx-auto px-4 py-8">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (profileStatus === 'incomplete') {
    return (
      <div className="min-h-screen bg-background pt-24 md:pt-28">
        {!isMobile && <RoomyNavbar />}
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
    switch (matchMode) {
      case 'apartments':
        return 'AI-Powered Apartment Matching';
      case 'rooms':
        return 'AI-Powered Room Matching';
      case 'roommates':
        return 'AI-Powered Roommate Matching';
      default:
        return 'AI-Powered Matching';
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 md:pt-28">
      {!isMobile && <RoomyNavbar />}
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Gradient Header */}
        <div className="text-center space-y-3 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-2xl blur-3xl -z-10" />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              {getHeaderTitle()}
            </h1>
            <p className="text-muted-foreground text-lg flex items-center justify-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Powered by Gemini AI
            </p>
          </motion.div>
        </div>

        {/* Mode Tabs - Always show for navigation */}
        <MatchModeTabs
          activeMode={matchMode}
          onModeChange={(mode) => {
            // Clear stale data before switching
            setMatches([]);
            setAiInsights('');
            setMatchMode(mode);
            // Update activeMode based on selected tab
            if (mode === 'apartments') setActiveMode('dorm');
            else if (mode === 'rooms') setActiveMode('rooms');
            else setActiveMode('roommate');
          }}
          counts={{
            apartments: matchMode === 'apartments' ? matches.length : undefined,
            rooms: matchMode === 'rooms' ? matches.length : undefined,
            roommates: matchMode === 'roommates' ? matches.length : undefined
          }}
        />

        {/* Tier Selection - Show only on roommate views */}
        {(activeMode === 'roommate' || (activeMode === 'combined' && matchMode === 'roommates')) && (
          <>
            <TierSelector 
              currentTier={userPlan}
              onUpgrade={handleUpgrade}
              onDowngrade={handleDowngrade}
              isLoading={loading}
              studentId={studentProfile?.id}
            />
            
            {/* Basic Tier Messaging */}
            {userPlan === 'basic' && matchMode === 'roommates' && (
              <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
                <CardContent className="p-4">
                  <p className="text-sm">
                    🎯 <strong>Basic Match</strong>: You're seeing random compatible roommates. 
                    Upgrade to <strong>Advanced</strong> or <strong>VIP</strong> for personality-based matching!
                  </p>
                </CardContent>
              </Card>
            )}
          </>
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

            {/* Apartment/Dorm Comparison (only show for apartments mode) */}
            {matchMode === 'apartments' && matches.length > 0 && (
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
            <div ref={matchesSectionRef} id="matches-section">
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
                {matchMode === 'apartments' 
                  ? 'Top Apartment Matches' 
                  : matchMode === 'rooms'
                    ? 'Top Room Matches'
                    : matches.some(m => m.hasPersonalityMatch) 
                      ? 'Other Compatible Roommates' 
                      : 'Compatible Roommates'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(matchMode === 'roommates' 
                  ? matches.filter(m => !m.hasPersonalityMatch)
                  : matches
                ).map((match, index) => (
                  matchMode === 'apartments' ? (
                    <DormMatchCard 
                      key={match.id} 
                      dorm={match} 
                      index={index}
                      onDismiss={(id) => handleDismissMatch(id, 'dorm')}
                    />
                  ) : matchMode === 'rooms' ? (
                    <RoomMatchCard 
                      key={match.id} 
                      room={match} 
                      index={index}
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

        {/* No Matches - Empty State */}
        {!loading && matches.length === 0 && (
          <EmptyMatchState 
            type={matchMode}
            hasPersonalityTest={studentProfile?.personality_test_completed || false}
          />
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
