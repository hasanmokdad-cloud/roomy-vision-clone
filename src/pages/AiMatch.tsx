import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { ProfileIncompleteCard } from "@/components/ai-match/ProfileIncompleteCard";
import { LoadingState } from "@/components/ai-match/LoadingState";
import { AIInsightsCard } from "@/components/ai-match/AIInsightsCard";
import { DormMatchCard } from "@/components/ai-match/DormMatchCard";
import { RoommateMatchCard } from "@/components/ai-match/RoommateMatchCard";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Home, Users } from "lucide-react";
import { rankDorms } from "@/ai-engine/recommendationModel";
import { useRoommateMatch } from "@/hooks/useRoommateMatch";

type ProfileStatus = 'loading' | 'incomplete' | 'complete';
type MatchMode = 'dorms' | 'roommates';

const AiMatch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('loading');
  const [matchMode, setMatchMode] = useState<MatchMode>('dorms');
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(crypto.randomUUID());
  const [showModeToggle, setShowModeToggle] = useState(false);

  // Get roommate matches using the hook
  const { loading: roommateLoading, matches: roommateMatches } = useRoommateMatch(
    matchMode === 'roommates' ? userId || undefined : undefined
  );

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
          determineMatchMode(data);
        }
      } catch (err) {
        console.error('Error in checkProfile:', err);
        setProfileStatus('incomplete');
      }
    };

    checkProfile();
  }, [userId, toast]);

  // Determine which match mode to show based on profile
  const determineMatchMode = (profile: any) => {
    const needsDorm = profile.accommodation_status === 'need_dorm';
    const needsRoommate = profile.need_roommate === true;

    // Show toggle if both conditions are true
    if (needsDorm && needsRoommate) {
      setShowModeToggle(true);
      setMatchMode('dorms'); // Default to dorms
    } else if (needsDorm) {
      setShowModeToggle(false);
      setMatchMode('dorms');
    } else if (needsRoommate) {
      setShowModeToggle(false);
      setMatchMode('roommates');
    } else {
      // Default to dorms if neither is set
      setShowModeToggle(false);
      setMatchMode('dorms');
    }
  };

  // Fetch matches when mode changes
  useEffect(() => {
    if (profileStatus === 'complete' && studentProfile) {
      if (matchMode === 'dorms') {
        findDormMatches(studentProfile);
      } else {
        // Roommate matches are handled by the hook
        if (roommateMatches.length > 0 && !roommateLoading) {
          setMatches(roommateMatches);
          fetchAIInsights(studentProfile, roommateMatches, 'roommates');
        }
      }
    }
  }, [matchMode, profileStatus, studentProfile, roommateMatches, roommateLoading]);

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

  // Find and rank dorm matches
  const findDormMatches = async (profile: any) => {
    setLoading(true);

    try {
      // 1. Fetch verified dorms
      const { data: dorms, error: dormsError } = await supabase
        .from('dorms')
        .select('*')
        .eq('verification_status', 'Verified')
        .eq('available', true);

      if (dormsError) throw dormsError;

      // 2. Fetch engagement signals
      const { data: signals } = await supabase
        .from('dorm_engagement_view')
        .select('*');

      const signalsMap = signals?.reduce((acc, s) => ({ ...acc, [s.dorm_id]: s }), {}) || {};

      // 3. Build user profile for ranking
      const userProfile = {
        budget: profile.budget,
        preferred_university: profile.university || profile.preferred_university,
        favorite_areas: profile.favorite_areas || (profile.preferred_housing_area ? [profile.preferred_housing_area] : []),
        preferred_room_types: profile.preferred_room_types || (profile.room_type ? [profile.room_type] : []),
        preferred_amenities: profile.preferred_amenities || [],
        ai_confidence_score: profile.ai_confidence_score || 75
      };

      // 4. Rank dorms using recommendation engine
      const ranked = rankDorms(dorms || [], userProfile, signalsMap);
      const top10 = ranked.slice(0, 10);

      // 5. Add match reasons to each dorm
      const withReasons = top10.map(dorm => ({
        ...dorm,
        matchReasons: generateDormMatchReasons(dorm, profile)
      }));

      setMatches(withReasons);

      // 6. Get AI insights
      await fetchAIInsights(profile, withReasons, 'dorms');

    } catch (error) {
      console.error('Error finding dorm matches:', error);
      toast({
        title: "Error",
        description: "Failed to load dorm matches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI insights from Gemini
  const fetchAIInsights = async (profile: any, matchList: any[], mode: MatchMode) => {
    try {
      let prompt = '';

      if (mode === 'dorms') {
        const topDorms = matchList.slice(0, 3).map(d => d.dorm_name || d.name).join(', ');
        prompt = `You are Roomy AI, a friendly Lebanese student housing assistant. Based on this student's profile:
- Budget: $${profile.budget || 'flexible'}/month
- University: ${profile.university || 'not specified'}
- Preferred area: ${profile.preferred_housing_area || profile.favorite_areas?.[0] || 'flexible'}
- Room type: ${profile.room_type || 'any'}

Top matches: ${topDorms}

In 2-3 friendly, conversational sentences, explain why these dorms are great fits for them. Be warm and encouraging.`;
      } else {
        const topRoommates = matchList.slice(0, 3).map(r => r.full_name).join(', ');
        prompt = `You are Roomy AI, a friendly Lebanese student housing assistant. Based on this student's profile and their top 3 roommate matches (${topRoommates}), explain in 2-3 friendly sentences why these people would be compatible roommates. Focus on shared universities, similar budgets, and compatible preferences.`;
      }

      const { data, error } = await supabase.functions.invoke('roomy-chat', {
        body: { message: prompt, userId, sessionId }
      });

      if (error) throw error;

      setAiInsights(data?.response || 'AI insights are currently unavailable, but we found great matches for you!');
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setAiInsights('We found great matches for you based on your preferences!');
    }
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
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (profileStatus === 'incomplete') {
    return (
      <div className="min-h-screen bg-background pt-24 md:pt-28">
        <Navbar />
        <ProfileIncompleteCard percentage={studentProfile?.profile_completion_score || 0} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 md:pt-28">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">
            AI-Powered {matchMode === 'dorms' ? 'Dorm' : 'Roommate'} Matching
          </h1>
          <p className="text-muted-foreground text-lg">
            Powered by Gemini AI, personalized just for you
          </p>
        </div>

        {/* Mode Toggle */}
        {showModeToggle && (
          <div className="flex justify-center">
            <ToggleGroup 
              type="single" 
              value={matchMode} 
              onValueChange={handleModeChange}
              className="bg-muted p-1 rounded-lg"
            >
              <ToggleGroupItem 
                value="dorms" 
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6 py-2"
              >
                <Home className="mr-2 w-4 h-4" />
                Find Dorms
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="roommates"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6 py-2"
              >
                <Users className="mr-2 w-4 h-4" />
                Find Roommates
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

        {/* Loading State */}
        {(loading || (matchMode === 'roommates' && roommateLoading)) && <LoadingState />}

        {/* Results */}
        {!loading && !(matchMode === 'roommates' && roommateLoading) && matches.length > 0 && (
          <>
            {/* AI Insights */}
            {aiInsights && (
              <AIInsightsCard insights={aiInsights} />
            )}

            {/* Matches Grid */}
            <div>
              <h2 className="text-2xl font-bold mb-6">
                {matchMode === 'dorms' ? 'Top Dorm Matches' : 'Compatible Roommates'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map((match, index) => (
                  matchMode === 'dorms' ? (
                    <DormMatchCard key={match.id} dorm={match} index={index} />
                  ) : (
                    <RoommateMatchCard key={match.user_id} roommate={match} index={index} />
                  )
                ))}
              </div>
            </div>
          </>
        )}

        {/* No Matches */}
        {!loading && !(matchMode === 'roommates' && roommateLoading) && matches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No matches found. Try updating your preferences in your profile.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AiMatch;
