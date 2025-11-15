import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MatchCard } from "@/components/ai-match/MatchCard";
import { AIAvatar } from "@/components/ai-match/AIAvatar";
import { mockMatches } from "@/data/mockMatches";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useAuthGuard, useProfileCompletion } from "@/hooks/useAuthGuard";
import { MatchCardSkeleton } from "@/components/skeletons/MatchCardSkeleton";
import ErrorBoundary from "@/components/ErrorBoundary";
import { generateReasonText } from "@/utils/aiLogic";

const universities = [
  "LAU (Byblos)",
  "LAU (Beirut)",
  "AUB",
  "USEK",
  "USJ",
  "LU (Hadat)",
  "Balamand (Dekwaneh)",
  "Balamand (ALBA)",
  "BAU",
  "Haigazian",
];

export default function AiMatch() {
  const { loading: authLoading, userId } = useAuthGuard();
  const { checkingProfile } = useProfileCompletion(userId);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    age: "",
    gender: "",
    university: "",
    residential_area: "",
  });

  const [preferences, setPreferences] = useState({
    room_type: "",
    roommate_needed: false,
    budget: 1000,
    preferred_university: "",
    distance_preference: "No preference",
  });

  // 🧠 AI-related state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasContext, setHasContext] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Initialize session ID on mount
  useEffect(() => {
    if (!sessionId) {
      setSessionId(crypto.randomUUID());
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      const { data } = await supabase.from("students").select("*").eq("user_id", userId).maybeSingle();

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          age: data.age?.toString() || "",
          gender: data.gender || "",
          university: data.university || "",
          residential_area: data.residential_area || "",
        });
        setPreferences({
          room_type: data.room_type || "",
          roommate_needed: data.roommate_needed || false,
          budget: data.budget || 1000,
          preferred_university: data.preferred_university || "",
          distance_preference: data.distance_preference || "No preference",
        });
      }
    };

    loadProfile();
  }, [userId]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile.full_name || !profile.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Upsert student profile
    const studentData = {
      user_id: userId,
      full_name: profile.full_name,
      email: profile.email,
      age: profile.age ? parseInt(profile.age) : null,
      gender: profile.gender,
      university: profile.university,
      residential_area: profile.residential_area,
    };

    const { error } = await supabase.from("students").upsert(studentData, { onConflict: userId ? "user_id" : "email" });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Update student preferences
    const { error } = await supabase
      .from("students")
      .update({
        room_type: preferences.room_type,
        roommate_needed: preferences.roommate_needed,
        budget: preferences.budget,
        preferred_university: preferences.preferred_university,
        distance_preference: preferences.distance_preference,
      })
      .eq("email", profile.email);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
      return;
    }

    setStep(3);
    findMatches();
  };

  // 🔮 Call Roomy Gemini backend for a natural-language summary
  const fetchAiSummary = async (userProfile: any, rankedDorms: any[]) => {
    try {
      setAiLoading(true);
      setAiSummary(null);

      const topDormNames =
        rankedDorms
          .slice(0, 3)
          .map((d) => d.dorm_name || d.name)
          .filter(Boolean)
          .join(", ") || "a few suitable dorms";

      const prompt = `
You are Roomy, an AI assistant helping Lebanese university students find dorms.

User preferences:
- Budget: $${userProfile.budget} / month
- Preferred university: ${userProfile.preferred_university || "None specified"}
- Preferred room types: ${userProfile.preferred_room_types?.join(", ") || "Not specified"}
- Distance preference: ${userProfile.distance_preference || "Not specified"}

We have identified these candidate dorms: ${topDormNames}.

In 3 short bullet points, explain why these dorms fit the user and what tradeoffs they should consider.
Keep it conversational, concrete, and under 120 words.
      `.trim();

      const { data, error } = await supabase.functions.invoke("roomy-chat", {
        body: {
          message: prompt,
          userId: userId || "anonymous",
          sessionId,
        },
      });

      if (error) {
        console.error("Roomy AI summary error:", error);
        toast({
          title: "AI Error",
          description: "Roomy AI could not summarize your matches. Matches are still shown below.",
          variant: "destructive",
        });
        return;
      }

      const responseText = (data as any)?.response || "Roomy AI could not generate a summary at the moment.";

      // Handle session data from backend
      if ((data as any)?.sessionId && (data as any).sessionId !== sessionId) {
        setSessionId((data as any).sessionId);
      }
      if (typeof (data as any)?.hasContext === "boolean") {
        setHasContext((data as any).hasContext);
      }
      if ((data as any)?.sessionReset) {
        setSessionId(null);
        setHasContext(false);
      }

      setAiSummary(responseText);
    } catch (err) {
      console.error("Roomy AI summary unexpected error:", err);
      toast({
        title: "AI Error",
        description: "Something went wrong while talking to Roomy AI.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  // 🔄 Reset AI Memory
  const handleResetMemory = async () => {
    if (!sessionId || !userId) return;
    
    try {
      await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId);
      
      // Generate new session ID
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      setHasContext(false);
      setAiSummary(null);
      
      toast({
        title: "Memory Reset",
        description: "Roomy AI's memory has been cleared. Starting fresh!",
      });
    } catch (err) {
      console.error("Error resetting AI memory:", err);
      toast({
        title: "Error",
        description: "Failed to reset AI memory. Please try again.",
        variant: "destructive",
      });
    }
  };

  const findMatches = async () => {
    setLoading(true);
    setAiSummary(null);
    setAiLoading(false);

    try {
      // Load all verified dorms
      const { data: dorms, error: dormsError } = await supabase
        .from("dorms_public")
        .select("*")
        .eq("verification_status", "Verified");

      if (dormsError) throw dormsError;

      // Load engagement signals
      const { data: signals } = await supabase
        .from("dorm_engagement_view")
        .select("dorm_id, views, favorites, inquiries");

      const signalsMap: Record<string, any> = {};
      (signals ?? []).forEach((s: any) => (signalsMap[s.dorm_id] = s));

      // Build user profile for recommendation engine
      const userProfile = {
        budget: preferences.budget,
        preferred_university: preferences.preferred_university || null,
        favorite_areas: [], // Could be enhanced with area preferences
        preferred_room_types: preferences.room_type ? [preferences.room_type] : [],
        preferred_amenities: [], // Could be enhanced with amenity preferences
        ai_confidence_score: 85, // Default confidence
        distance_preference: preferences.distance_preference,
      };

      // Use recommendation engine to rank dorms
      const { rankDorms } = await import("@/ai-engine/recommendationModel");
      const rankedDorms = rankDorms(dorms ?? [], userProfile, signalsMap);

      // Take top 8 matches
      const topMatches = rankedDorms.slice(0, 8).map((dorm: any) => ({
        ...dorm,
        matchScore: dorm.matchScore,
        matchReasons: generateMatchReasons(dorm, userProfile),
      }));

      setMatches(topMatches);

      // 🔮 Ask Roomy AI (Gemini) for a natural-language explanation
      if (topMatches.length > 0) {
        await fetchAiSummary(userProfile, topMatches);
      }
    } catch (error) {
      console.error("Error finding matches:", error);
      toast({
        title: "Error",
        description: "Failed to find matches. Please try again.",
        variant: "destructive",
      });
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate human-readable match reasons
  const generateMatchReasons = (dorm: any, userProfile: any): string[] => {
    const reasons: string[] = [];

    // Budget fit
    if (userProfile.budget && dorm.monthly_price <= userProfile.budget) {
      const savings = userProfile.budget - dorm.monthly_price;
      if (savings > 100) {
        reasons.push(`Within budget - saves you $${savings}/month`);
      } else {
        reasons.push("Perfectly within your budget");
      }
    }

    // University match
    if (userProfile.preferred_university && dorm.university) {
      if (dorm.university.toLowerCase().includes(userProfile.preferred_university.toLowerCase())) {
        reasons.push(`Close to ${userProfile.preferred_university}`);
      }
    }

    // Room type match
    if (userProfile.preferred_room_types?.length && dorm.room_types) {
      const hasMatch = userProfile.preferred_room_types.some((t: string) =>
        dorm.room_types.toLowerCase().includes(t.toLowerCase()),
      );
      if (hasMatch) {
        reasons.push(`Has your preferred room type`);
      }
    }

    // Verification status
    if (dorm.verification_status === "Verified") {
      reasons.push("Verified and trusted");
    }

    // Popular choice
    if (dorm.matchScore && dorm.matchScore > 70) {
      reasons.push("Highly recommended for you");
    }

    return reasons.slice(0, 3); // Max 3 reasons
  };

  const restart = () => {
    setStep(1);
    setMatches([]);
    setAiSummary(null);
    setSessionId(null);
    setHasContext(false);
  };

  if (authLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen flex flex-col relative bg-background">
      <Navbar />
      {step === 3 && <AIAvatar userName={profile.full_name.split(" ")[0] || "there"} />}

      <main className="flex-1 container mx-auto px-4 py-4 md:py-8 mt-16 md:mt-24 mb-20 md:mb-0">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-4 md:mb-8"
          >
            <Badge variant="secondary" className="mb-4 neon-glow">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Matching
            </Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black gradient-text mb-3 md:mb-6">
              Find Your Perfect Dorm
            </h1>
            <p className="text-base md:text-xl text-foreground/80">
              Answer a few quick questions and let AI do the work
            </p>
          </motion.div>

          <Progress value={progress} className="mb-4 md:mb-8" />

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-10 shadow-2xl"
            >
              <h2 className="text-xl md:text-3xl font-black mb-4 md:mb-8 gradient-text">
                Step 1 — Create your profile
              </h2>
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      required
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className="bg-background/40 border border-white/10 text-foreground placeholder:text-foreground/40"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      required
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="bg-background/40 border border-white/10 text-foreground placeholder:text-foreground/40"
                    />
                  </div>
                  <div>
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={profile.age}
                      onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                      className="bg-background/40 border border-white/10 text-foreground placeholder:text-foreground/40"
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={profile.gender} onValueChange={(v) => setProfile({ ...profile, gender: v })}>
                      <SelectTrigger className="bg-background/40 border border-white/10 text-foreground">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-white/10">
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>University</Label>
                    <Select value={profile.university} onValueChange={(v) => setProfile({ ...profile, university: v })}>
                      <SelectTrigger className="bg-background/40 border border-white/10 text-foreground">
                        <SelectValue placeholder="Select university" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-white/10">
                        {universities.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Residential Area</Label>
                    <Input
                      value={profile.residential_area}
                      onChange={(e) => setProfile({ ...profile, residential_area: e.target.value })}
                      className="bg-background/40 border border-white/10 text-foreground placeholder:text-foreground/40"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-10 shadow-2xl"
            >
              <h2 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 gradient-text">
                Step 2 — Set your preferences
              </h2>
              <form onSubmit={handleStep2Submit} className="space-y-6">
                <div>
                  <Label>Room Type</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {["Private Room", "Shared Room", "Studio Apartment"].map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={preferences.room_type === type ? "default" : "outline"}
                        onClick={() => setPreferences({ ...preferences, room_type: type })}
                        className="h-auto py-3 text-sm"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-background/40 rounded-xl border border-white/10">
                  <div>
                    <Label>Roommate Needed?</Label>
                    <p className="text-sm text-foreground/60">Looking for a compatible roommate</p>
                  </div>
                  <Switch
                    checked={preferences.roommate_needed}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, roommate_needed: checked })}
                  />
                </div>

                <div>
                  <Label>Budget: ${preferences.budget} / month</Label>
                  <Slider
                    value={[preferences.budget]}
                    onValueChange={([v]) => setPreferences({ ...preferences, budget: v })}
                    min={0}
                    max={2000}
                    step={50}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Preferred University</Label>
                  <Select
                    value={preferences.preferred_university}
                    onValueChange={(v) => setPreferences({ ...preferences, preferred_university: v })}
                  >
                    <SelectTrigger className="bg-background/40 border border-white/10 text-foreground">
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-white/10">
                      {universities.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Distance Preference</Label>
                  <Select
                    value={preferences.distance_preference}
                    onValueChange={(v) => setPreferences({ ...preferences, distance_preference: v })}
                  >
                    <SelectTrigger className="bg-background/40 border border-white/10 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-white/10">
                      <SelectItem value="Walking distance">Walking distance</SelectItem>
                      <SelectItem value="Shuttle OK">Shuttle OK</SelectItem>
                      <SelectItem value="No preference">No preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-secondary">
                    Find Matches <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <div className="space-y-6 md:space-y-8 mb-20 md:mb-0">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <Badge variant="secondary" className="mb-4 neon-glow">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-Powered Results
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 gradient-text">
                  {loading ? "Analyzing your preferences..." : "Your Perfect Matches"}
                </h2>
                <p className="text-base md:text-lg text-foreground/70">
                  Personalized recommendations based on your profile
                </p>
              </motion.div>

              {/* 🔮 Roomy AI (Gemini) Summary Card */}
              {aiLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-background/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    <h3 className="text-lg md:text-xl font-semibold">Roomy AI is analyzing...</h3>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Gemini 2.5 Flash
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/70">
                    Generating personalized insights based on your preferences.
                  </p>
                </motion.div>
              )}

              {aiSummary && !aiLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-primary/10 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 md:p-6 shadow-[0_0_30px_rgba(129,140,248,0.35)]"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h3 className="text-lg md:text-xl font-bold">Roomy AI Insight</h3>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Gemini 2.5 Flash
                        </Badge>
                        {hasContext && (
                          <Badge variant="outline" className="text-xs">
                            Context Memory Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {aiSummary}
                  </div>
                </motion.div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <MatchCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <>
                  <ErrorBoundary>
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: {
                          transition: {
                            staggerChildren: 0.15,
                            delayChildren: 0.15,
                          },
                        },
                      }}
                    >
                      {matches.map((match, idx) => (
                        <motion.div
                          key={match.id || idx}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-6 hover:shadow-xl hover:border-primary/40 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-2xl font-bold text-foreground">{match.dorm_name || match.name}</h3>
                            <Badge
                              variant={
                                match.matchScore >= 80 ? "default" : match.matchScore >= 60 ? "secondary" : "outline"
                              }
                              className="ml-2"
                            >
                              {match.matchScore}% match
                            </Badge>
                          </div>

                          {/* Match reasons */}
                          {match.matchReasons && match.matchReasons.length > 0 && (
                            <div className="space-y-1 mb-4">
                              {match.matchReasons.map((reason: string, i: number) => (
                                <div key={i} className="flex items-center text-sm text-foreground/70">
                                  <span className="text-primary mr-2">✓</span>
                                  {reason}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-2 text-sm text-foreground/70 mb-4">
                            <p>📍 {match.area || match.location}</p>
                            <p>💰 ${match.monthly_price}/month</p>
                            <p>🛏️ {match.room_types || "Various types"}</p>
                            {match.amenities && match.amenities.length > 0 && (
                              <p>✨ {match.amenities.slice(0, 3).join(", ")}</p>
                            )}
                          </div>

                          <Button
                            onClick={() => navigate(`/dorm/${match.id}`)}
                            className="w-full mt-4 bg-gradient-to-r from-primary to-secondary"
                          >
                            View Details
                          </Button>
                        </motion.div>
                      ))}
                    </motion.div>
                  </ErrorBoundary>

                  {matches.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12"
                    >
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                      <h3 className="text-xl font-bold text-foreground mb-2">No Perfect Match Yet</h3>
                      <p className="text-foreground/70 text-lg mb-4">
                        We couldn't find dorms that match all your criteria.
                      </p>
                      <p className="text-foreground/60 text-sm">
                        Try adjusting your budget or location preferences and search again.
                      </p>
                    </motion.div>
                  )}
                </>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap gap-3 justify-center mt-8"
              >
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="bg-white/10 border-white/20 hover:bg.white/20 text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Adjust Preferences
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetMemory}
                  disabled={!hasContext}
                  className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                  title={hasContext ? "Clear Roomy AI's memory" : "No memory to reset"}
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset AI Memory
                </Button>
                <Button
                  variant="outline"
                  onClick={restart}
                  className="bg-white/10 border-white/20 hover:bg-white/20 text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Start Over
                </Button>
                <Button
                  onClick={() => navigate("/listings")}
                  className="bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                >
                  Browse All Dorms
                </Button>
                <Button
                  onClick={() => navigate("/ai-chat")}
                  className="bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all hover:scale-105"
                >
                  💬 Chat with Roomy AI
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
