import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoomyNavbar } from "@/components/RoomyNavbar";
import Footer from "@/components/shared/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Users, MessageSquare, Eye, Filter, Sparkles } from "lucide-react";
import { MatchCardSkeleton } from "@/components/skeletons/MatchCardSkeleton";
import { useIsMobile } from "@/hooks/use-mobile";

interface StudentMatch {
  id: string;
  user_id: string;
  full_name: string;
  age: number | null;
  university: string | null;
  budget: number | null;
  room_type: string | null;
  residential_area: string | null;
  gender: string | null;
  preferences: any;
  matchScore: number;
  matchReasons: string[];
}

const universities = [
  "All Universities",
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

export default function StudentMatch() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { loading: authLoading, userId } = useAuthGuard();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentMatch[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentMatch[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filter states
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 2000]);
  const [selectedUniversity, setSelectedUniversity] = useState("All Universities");
  const [selectedRoomType, setSelectedRoomType] = useState("All");
  const [selectedPersonality, setSelectedPersonality] = useState("All");
  const [searchName, setSearchName] = useState("");

  useEffect(() => {
    if (userId) {
      loadStudents();
    }
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [students, budgetRange, selectedUniversity, selectedRoomType, selectedPersonality, searchName]);

  const calculateCompatibility = (otherStudent: any, userPrefs: any, currentUserData: any): number => {
    let score = 0;

    // Budget similarity (25 points)
    if (currentUserData.budget && otherStudent.budget) {
      const budgetDiff = Math.abs(currentUserData.budget - otherStudent.budget);
      const budgetScore = Math.max(0, 25 - (budgetDiff / 50));
      score += budgetScore;
    }

    // Room type match (15 points)
    if (currentUserData.room_type && otherStudent.room_type) {
      if (currentUserData.room_type === otherStudent.room_type) {
        score += 15;
      }
    }

    // University match (10 points)
    if (currentUserData.university && otherStudent.university) {
      if (currentUserData.university === otherStudent.university) {
        score += 10;
      }
    }

    // Basic personality traits from preferences (20 points)
    const otherPrefs = otherStudent.preferences || {};
    
    if (userPrefs && otherPrefs) {
      // Social vs Quiet preference
      if (userPrefs["Would you describe yourself as more Social or Quiet?"] === 
          otherPrefs["Would you describe yourself as more Social or Quiet?"]) {
        score += 10;
      }

      // Study habits
      if (userPrefs["Do you prefer to study alone or with others?"] === 
          otherPrefs["Do you prefer to study alone or with others?"]) {
        score += 5;
      }

      // Area preference
      if (userPrefs["Which area or campus would you prefer to live near?"] === 
          otherPrefs["Which area or campus would you prefer to live near?"]) {
        score += 5;
      }
    }

    // Boost Profile compatibility (30 points bonus if both have boost data)
    const userBoost = userPrefs?.boost_profile;
    const otherBoost = otherPrefs?.boost_profile;

    if (userBoost && otherBoost) {
      // Wake time compatibility (5 points)
      if (userBoost.wake_time === otherBoost.wake_time) {
        score += 5;
      }

      // Cleanliness level (5 points - closer values = higher score)
      if (userBoost.cleanliness && otherBoost.cleanliness) {
        const cleanDiff = Math.abs(userBoost.cleanliness - otherBoost.cleanliness);
        score += Math.max(0, 5 - cleanDiff / 2);
      }

      // Noise tolerance (5 points)
      if (userBoost.noise_tolerance && otherBoost.noise_tolerance) {
        const noiseDiff = Math.abs(userBoost.noise_tolerance - otherBoost.noise_tolerance);
        score += Math.max(0, 5 - noiseDiff / 2);
      }

      // Guest policy (3 points)
      if (userBoost.guest_policy === otherBoost.guest_policy) {
        score += 3;
      }

      // Cooking habits (3 points)
      if (userBoost.cooking_habits === otherBoost.cooking_habits) {
        score += 3;
      }

      // Social energy level (4 points)
      if (userBoost.social_energy && otherBoost.social_energy) {
        const socialDiff = Math.abs(userBoost.social_energy - otherBoost.social_energy);
        score += Math.max(0, 4 - socialDiff / 2.5);
      }

      // Organization style (3 points)
      if (userBoost.organization_style && otherBoost.organization_style) {
        const orgDiff = Math.abs(userBoost.organization_style - otherBoost.organization_style);
        score += Math.max(0, 3 - orgDiff / 3);
      }

      // Temperature preference (2 points)
      if (userBoost.temperature_preference === otherBoost.temperature_preference) {
        score += 2;
      }
    }

    return Math.min(100, Math.round(score));
  };

  const generateMatchReasons = (student: any, score: number, userPrefs: any, currentUserData: any): string[] => {
    const reasons: string[] = [];

    // Budget compatibility
    if (currentUserData.budget && student.budget) {
      const budgetDiff = Math.abs(currentUserData.budget - student.budget);
      if (budgetDiff < 100) {
        reasons.push("Very similar budget");
      } else if (budgetDiff < 200) {
        reasons.push("Compatible budget range");
      }
    }

    // Room type
    if (currentUserData.room_type === student.room_type) {
      reasons.push(`Both prefer ${student.room_type}`);
    }

    // University
    if (currentUserData.university === student.university) {
      reasons.push(`Same university: ${student.university}`);
    }

    // Personality match
    const otherPrefs = student.preferences || {};
    if (userPrefs && otherPrefs) {
      const userPersonality = userPrefs["Would you describe yourself as more Social or Quiet?"];
      const otherPersonality = otherPrefs["Would you describe yourself as more Social or Quiet?"];
      if (userPersonality === otherPersonality) {
        reasons.push(`Both ${userPersonality?.toLowerCase()}`);
      }
    }

    // High match score
    if (score >= 80) {
      reasons.push("Excellent compatibility!");
    }

    return reasons.slice(0, 3);
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      // Get current user's profile
      const { data: currentUserData } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", userId)
        .single();

      setCurrentUser(currentUserData);

      // Get current user's preferences
      const { data: userPrefsData } = await supabase
        .from("user_preferences")
        .select("preferences")
        .eq("user_id", userId)
        .maybeSingle();

      const userPrefs = userPrefsData?.preferences;

      // Get all other students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .neq("user_id", userId);

      if (studentsError) throw studentsError;

      // Get preferences for all students
      const studentUserIds = studentsData?.map((s) => s.user_id) || [];
      const { data: allPreferences } = await supabase
        .from("user_preferences")
        .select("user_id, preferences")
        .in("user_id", studentUserIds);

      // Create preferences map
      const prefsMap: Record<string, any> = {};
      (allPreferences || []).forEach((p) => {
        prefsMap[p.user_id] = p.preferences;
      });

      // Calculate compatibility and create matches
      const matches = (studentsData || []).map((student) => {
        const studentPrefs = prefsMap[student.user_id];
        const matchScore = calculateCompatibility(
          { ...student, preferences: studentPrefs },
          userPrefs,
          currentUserData
        );
        const matchReasons = generateMatchReasons(student, matchScore, userPrefs, currentUserData);

        return {
          ...student,
          preferences: studentPrefs,
          matchScore,
          matchReasons,
        };
      });

      // Sort by match score descending and take top 10
      const sortedMatches = matches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

      setStudents(sortedMatches);
    } catch (error) {
      console.error("Error loading students:", error);
      toast({
        title: "Error",
        description: "Failed to load potential roommates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    // Budget filter
    filtered = filtered.filter(
      (s) => !s.budget || (s.budget >= budgetRange[0] && s.budget <= budgetRange[1])
    );

    // University filter
    if (selectedUniversity !== "All Universities") {
      filtered = filtered.filter((s) => s.university === selectedUniversity);
    }

    // Room type filter
    if (selectedRoomType !== "All") {
      filtered = filtered.filter((s) => s.room_type === selectedRoomType);
    }

    // Personality filter
    if (selectedPersonality !== "All") {
      filtered = filtered.filter((s) => {
        const prefs = s.preferences || {};
        const personality = prefs["Would you describe yourself as more Social or Quiet?"];
        return personality === selectedPersonality;
      });
    }

    // Name search
    if (searchName.trim()) {
      filtered = filtered.filter((s) =>
        s.full_name?.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  };

  const handleViewProfile = (studentId: string, matchScore: number) => {
    navigate(`/student-profile/${studentId}`, {
      state: { matchScore },
    });
  };

  const handleMessage = (student: StudentMatch) => {
    navigate("/messages", {
      state: {
        openThreadWithUserId: student.user_id,
        initialMessage: `Hi ${student.full_name}! I found your profile through AI Roommate Match (${student.matchScore}% compatibility). I think we could be great roommates!`,
        matchProfile: student,
      },
    });
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-400";
    if (score >= 60) return "from-yellow-500 to-orange-400";
    return "from-orange-500 to-red-400";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
        {!isMobile && <RoomyNavbar />}
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-8 mt-20">
          <div className="space-y-6">
            <MatchCardSkeleton />
            <MatchCardSkeleton />
            <MatchCardSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      {!isMobile && <RoomyNavbar />}

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8 mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-700 via-blue-600 to-emerald-400 bg-clip-text text-transparent">
                Find Your Perfect Roommate
              </span>
            </h1>
            <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
              AI-powered matching based on budget, lifestyle, and personality compatibility
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground/60">
                Showing top {filteredStudents.length} matches
              </span>
            </div>

            {/* Boost Profile CTA */}
            {currentUser && !currentUser.preferences?.boost_profile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6"
              >
                <Card className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-emerald-500/10 border-primary/30">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <div className="text-left">
                          <p className="font-semibold">Boost Your Matches!</p>
                          <p className="text-sm text-foreground/60">
                            Answer 12 quick questions to improve compatibility by up to 30%
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate("/boost-profile")}
                        className="bg-gradient-to-r from-primary to-secondary text-white"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Boost Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Filters */}
          <Card className="mb-6 bg-card/80 backdrop-blur-md border-muted/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Filter Matches</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Budget Range */}
                <div className="space-y-2">
                  <Label className="text-sm">Budget Range</Label>
                  <div className="pt-2">
                    <Slider
                      min={0}
                      max={2000}
                      step={50}
                      value={budgetRange}
                      onValueChange={(value) => setBudgetRange(value as [number, number])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-foreground/60 mt-1">
                      <span>${budgetRange[0]}</span>
                      <span>${budgetRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* University */}
                <div className="space-y-2">
                  <Label className="text-sm">University</Label>
                  <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((uni) => (
                        <SelectItem key={uni} value={uni}>
                          {uni}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Room Type */}
                <div className="space-y-2">
                  <Label className="text-sm">Room Type</Label>
                  <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Types</SelectItem>
                      <SelectItem value="Private">Private</SelectItem>
                      <SelectItem value="Shared">Shared</SelectItem>
                      <SelectItem value="Studio">Studio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Personality */}
                <div className="space-y-2">
                  <Label className="text-sm">Personality</Label>
                  <Select value={selectedPersonality} onValueChange={setSelectedPersonality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Types</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Quiet">Quiet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Name Search */}
              <div className="mt-4">
                <Input
                  placeholder="Search by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="max-w-md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Matches */}
          {filteredStudents.length === 0 ? (
            <Card className="p-8 text-center bg-card/80 backdrop-blur-md border-muted/40">
              <Users className="w-12 h-12 mx-auto mb-4 text-foreground/40" />
              <h3 className="text-lg font-semibold mb-2">No matches found</h3>
              <p className="text-foreground/60">
                Try adjusting your filters to see more potential roommates
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredStudents.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-card/80 backdrop-blur-md border-muted/40">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-16 h-16 border-4 border-primary/20">
                          <AvatarFallback className={`text-xl bg-gradient-to-br ${getMatchColor(student.matchScore)} text-white`}>
                            {student.full_name?.charAt(0) || "S"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-lg">{student.full_name}</h3>
                            <Badge className={`bg-gradient-to-r ${getMatchColor(student.matchScore)} text-white`}>
                              {student.matchScore}% Match
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2 text-sm text-foreground/60 mb-3">
                            {student.age && <span>{student.age} years old</span>}
                            {student.university && <span>• {student.university}</span>}
                            {student.budget && <span>• ${student.budget}/mo</span>}
                          </div>

                          {/* Match Reasons */}
                          <div className="space-y-1 mb-4">
                            {student.matchReasons.map((reason, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <span className="text-foreground/80">{reason}</span>
                              </div>
                            ))}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProfile(student.id, student.matchScore)}
                              className="flex-1"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </Button>
                            <Button
                              onClick={() => handleMessage(student)}
                              className="flex-1 bg-gradient-to-r from-primary to-secondary text-white"
                              size="sm"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Message
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
