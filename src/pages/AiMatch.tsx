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
import { TierSelector } from "@/components/ai-match/TierSelector";
import { AIStatusCard } from "@/components/ai-match/AIStatusCard";
import { FreeTierInfoCard } from "@/components/ai-match/FreeTierInfoCard";
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
type MatchMode = 'rooms' | 'roommates';
type ActiveMode = 'dorm' | 'roommate' | 'rooms' | 'combined';

const AiMatch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { isAuthReady, userId, isAuthenticated, openAuthModal } = useAuth();
  const [searchParams] = useSearchParams();
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('loading');
  const [matchMode, setMatchMode] = useState<MatchMode>('rooms');
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
  const [hasPendingClaim, setHasPendingClaim] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [lastMatchMode, setLastMatchMode] = useState<MatchMode | null>(null);
  
  // Race condition prevention: track current request ID
  const requestIdRef = useRef(0);
  
  // Loading safety timeout - prevent infinite loading states
  useEffect(() => {
    if (loading) {
      const safetyTimeout = setTimeout(() => {
        console.warn('[AiMatch] Safety timeout: forcing loading state to false after 35s');
        setLoading(false);
        if (matches.length === 0) {
          toast({
            title: "Request Timeout",
            description: "AI matching is taking too long. Please try again.",
            variant: "destructive"
          });
        }
      }, 35000); // 35 second max
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [loading, matches.length, toast]);

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
          
          // Check for pending room claim if student has accommodation
          if (data.accommodation_status === 'have_dorm' && data.current_room_id && !data.room_confirmed) {
            const { data: existingClaim } = await supabase
              .from('room_occupancy_claims')
              .select('id, status')
              .eq('room_id', data.current_room_id)
              .eq('status', 'pending')
              .maybeSingle();
            
            if (existingClaim) {
              setHasPendingClaim(true);
            }
          }
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
      setActiveMode('rooms');
      setMatchMode('rooms');
      return;
    }
    
    const needsDorm = profile.accommodation_status === 'need_dorm';
    const needsRoommateCurrentPlace = profile.needs_roommate_current_place === true;
    const needsRoommateNewDorm = profile.needs_roommate_new_dorm === true;
    const legacyNeedsRoommate = profile.need_roommate === true;
    
    if (needsDorm && needsRoommateNewDorm) {
      setActiveMode('combined');
      setMatchMode('rooms');
    } else if (needsDorm) {
      setActiveMode('rooms');
      setMatchMode('rooms');
    } else if (needsRoommateCurrentPlace || legacyNeedsRoommate) {
      setActiveMode('roommate');
      setMatchMode('roommates');
    } else {
      setActiveMode('rooms');
      setMatchMode('rooms');
    }
  };

  // Read mode from URL params or determine from profile
  useEffect(() => {
    if (!studentProfile) return;

    const urlMode = searchParams.get('mode');
    
    if (urlMode === 'dorm' || urlMode === 'rooms') {
      setActiveMode('rooms');
      setMatchMode('rooms');
    } else if (urlMode === 'roommate') {
      setActiveMode('roommate');
      setMatchMode('roommates');
    } else if (urlMode === 'combined') {
      setActiveMode('combined');
      setMatchMode('rooms'); // Default to rooms tab
    } else {
      // Fallback: determine from profile if no URL param
      determineMatchModeFromProfile(studentProfile);
    }
  }, [searchParams, studentProfile]);

  // Fetch matches when profile is complete
  useEffect(() => {
    if (profileStatus !== 'complete' || !userId || !studentProfile) return;
    
    // Only fetch if: first load, OR mode actually changed
    const modeChanged = lastMatchMode !== null && lastMatchMode !== matchMode;
    
    if (!hasInitiallyLoaded || modeChanged) {
      setLastMatchMode(matchMode);
      setHasInitiallyLoaded(true);
      fetchMatches();
    }
  }, [profileStatus, userId, studentProfile, activeMode, matchMode, hasInitiallyLoaded, lastMatchMode]);

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
    if (mode === 'rooms') return 'rooms';
    return 'roommate';
  };

  // Fetch matches using AI Core with timeout, retry, and race condition prevention
  const fetchMatches = async (excludeIds?: string[], retryCount = 0) => {
    // Increment request ID to track this specific request
    const currentRequestId = ++requestIdRef.current;
    console.log(`[AiMatch] Starting fetch request #${currentRequestId} for mode: ${matchMode}`);
    
    setLoading(true);
    if (retryCount === 0) {
      setAiInsights(''); // Clear stale insights on first attempt only
    }

    // Timeout promise for mobile reliability
    const timeoutMs = 25000; // 25s timeout
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });

    try {
      const backendMode = getBackendMode(matchMode);
      
      // Race between the actual request and timeout
      const { data, error } = await Promise.race([
        supabase.functions.invoke('roomy-ai-core', {
          body: {
            mode: backendMode,
            match_tier: selectedPlan,
            personality_enabled: studentProfile?.enable_personality_matching || false,
            limit: matchMode === 'rooms' ? 20 : undefined,
            context: {},
            exclude_ids: excludeIds
          }
        }),
        timeoutPromise
      ]);

      // Check if this request is still current (race condition prevention)
      if (requestIdRef.current !== currentRequestId) {
        console.log(`[AiMatch] Stale request #${currentRequestId} ignored (current: #${requestIdRef.current})`);
        return;
      }

      if (error) {
        // Retry once on transient errors
        if (retryCount < 1 && (error.message?.includes('FunctionsFetchError') || error.message?.includes('network'))) {
          console.log('[AiMatch] Retrying after transient error...');
          await new Promise(r => setTimeout(r, 1000));
          return fetchMatches(excludeIds, retryCount + 1);
        }
        throw error;
      }

      if (data?.matches) {
        // Filter matches to ensure correct type for current mode
        const expectedType = matchMode === 'rooms' ? 'room' : 'roommate';
        const filteredMatches = data.matches.filter((m: any) => m.type === expectedType);
        setMatches(filteredMatches);
        
        // Filter out placeholder insights text
        let insights = data.insights_banner || '';
        if (insights.toLowerCase().includes('looking for options') || 
            insights.toLowerCase().includes('searching for') ||
            insights.toLowerCase().includes('no data') ||
            insights.toLowerCase().includes('no matches')) {
          insights = '';
        }
        setAiInsights(insights);
      } else {
        setMatches([]);
        setAiInsights('');
      }

    } catch (error: any) {
      console.error('[AiMatch] Error fetching matches:', error);
      
      // Check if this request is still current before updating state
      if (requestIdRef.current !== currentRequestId) {
        console.log(`[AiMatch] Stale error for request #${currentRequestId} ignored`);
        return;
      }
      
      // Retry once on timeout if not already retried
      if (retryCount < 1 && error?.message?.includes('timeout')) {
        console.log('[AiMatch] Retrying after timeout...');
        await new Promise(r => setTimeout(r, 500));
        return fetchMatches(excludeIds, retryCount + 1);
      }
      
      // Don't leave stale state on error
      setMatches([]);
      setAiInsights('');
      
      const isTimeout = error?.message?.includes('timeout');
      const isNetwork = error?.message?.includes('FunctionsFetchError') || error?.message?.includes('network');
      
      toast({
        title: isTimeout ? "Request Timeout" : isNetwork ? "Connection Error" : "Error",
        description: isTimeout 
          ? "AI matching is taking too long. Please try again." 
          : isNetwork
            ? "Network issue detected. Check your connection and try again."
            : "Failed to load matches. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Only update loading state if this is still the current request
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
      }
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

  // Handle mode toggle - clear state when switching tabs
  const handleModeChange = (value: string) => {
    if (value && value !== matchMode) {
      console.log(`[AiMatch] Mode change: ${matchMode} -> ${value}`);
      // Clear current state when switching tabs to prevent stale data
      setMatches([]);
      setAiInsights('');
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
  const showRoommateTab = activeMode === 'roommate' || activeMode === 'combined';
  const showToggle = activeMode === 'combined';
  const showCompatibilityScores = shouldShowCompatibilityScore(userPlan);
  const isVip = isVipPlan(userPlan);

  // Dynamic header text
  const getHeaderTitle = () => {
    switch (matchMode) {
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

        {/* Pending Claim Warning for Roommates Tab */}
        {hasPendingClaim && matchMode === 'roommates' && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">Roommate Matching Unavailable</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Your room claim is pending owner confirmation. Roommate matching will be available after your dorm owner confirms your room.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mode Tabs - Always show for navigation */}
        <MatchModeTabs
          activeMode={matchMode}
          onModeChange={(mode) => {
            // Clear stale data before switching
            setMatches([]);
            setAiInsights('');
            setMatchMode(mode);
            // Update activeMode based on selected tab
            if (mode === 'rooms') setActiveMode('rooms');
            else setActiveMode('roommate');
          }}
          counts={{
            rooms: matchMode === 'rooms' ? matches.length : undefined,
            roommates: matchMode === 'roommates' ? matches.length : undefined
          }}
        />

        {/* AI Status Card - Always show */}
        <AIStatusCard 
          isLoading={loading} 
          matchCount={matches.length}
          matchMode={matchMode as any}
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
            
            {/* Free Tier Info Card */}
            {userPlan === 'basic' && matchMode === 'roommates' && !loading && (
              <FreeTierInfoCard 
                onUpgrade={() => {
                  // Scroll to tier selector
                  document.querySelector('[data-tier-selector]')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            )}
          </>
        )}

        {/* Loading State */}
        {loading && <LoadingState />}

        {/* Results */}
        {!loading && matches.length > 0 && (
          <>
            {/* AI Insights - Show skeleton when loading, hide when empty */}
            <AIInsightsCard insights={aiInsights} isLoading={loading} />

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
                        currentStudentId={studentProfile?.id}
                      />
                    ))}
                  </div>
                </>
              )}

              <h2 className="text-2xl font-bold mb-6">
                {matchMode === 'rooms'
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
                  matchMode === 'rooms' ? (
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
                      currentStudentId={studentProfile?.id}
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
