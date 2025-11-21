// src/pages/dashboard/StudentDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bookmark, MessageSquare, Sparkles, User } from "lucide-react";
import { FavoritesRecommendations } from "@/components/dashboard/FavoritesRecommendations";
import { subscribeTo, unsubscribeFrom } from "@/lib/supabaseRealtime";

export default function StudentDashboard() {
  const { loading, userId } = useRoleGuard("student");
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [hasOnboardingPreferences, setHasOnboardingPreferences] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const loadProfileData = async () => {
      // Calculate profile completion
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        const totalFields = 8;
        const filledFields = Object.values(data).filter(
          (value) => value !== null && value !== ""
        ).length;
        setProfileCompletion(Math.round((filledFields / totalFields) * 100));
      }

      // Check if user has completed onboarding preferences
      const { data: prefsData } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      setHasOnboardingPreferences(!!prefsData);
    };

    loadProfileData();

    // Real-time subscriptions
    const preferencesChannel = subscribeTo("user_preferences", () => {
      loadProfileData();
    });

    const bookingsChannel = subscribeTo("bookings", () => {
      loadProfileData();
    });

    return () => {
      unsubscribeFrom(preferencesChannel);
      unsubscribeFrom(bookingsChannel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/60">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 md:px-12 py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold gradient-text">
              Welcome to Your Dashboard
            </h1>
            <p className="text-foreground/70 mt-2">
              Manage your dorm matches, favorites, and chat with Roomy AI.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 md:mt-0">
            {!hasOnboardingPreferences && (
              <Button
                onClick={() => navigate("/onboarding")}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform"
              >
                🎯 Start AI Onboarding
              </Button>
            )}
            <Button
              onClick={() => navigate("/ai-chat")}
              className="bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Chat with Roomy AI
            </Button>
          </div>
        </div>

        {/* Profile Completion Card */}
        <Card className="mb-10 shadow-lg border border-muted/40 bg-card/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Profile Strength
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/70 mb-2">
              Your profile is {profileCompletion}% complete.
            </p>
            <Progress value={profileCompletion} className="h-3" />
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => navigate("/profile")}
                variant="outline"
                className="flex-1"
              >
                Complete My Profile
              </Button>
              {!hasOnboardingPreferences && (
                <Button
                  onClick={() => navigate("/boost-profile")}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Boost Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Favorites & Recommendations */}
        {userId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-10"
          >
            <FavoritesRecommendations userId={userId} />
          </motion.div>
        )}

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          <Button
            onClick={() => navigate("/listings")}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white h-16 text-lg font-semibold shadow-md hover:scale-105 transition-transform"
          >
            <MessageSquare className="w-5 h-5 mr-2" /> Explore Dorms
          </Button>
          <Button
            onClick={() => navigate("/ai-match")}
            className="bg-gradient-to-r from-green-500 to-emerald-400 text-white h-16 text-lg font-semibold shadow-md hover:scale-105 transition-transform"
          >
            <Sparkles className="w-5 h-5 mr-2" /> AI Match
          </Button>
          <Button
            onClick={() => navigate("/ai-roommate-match")}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white h-16 text-lg font-semibold shadow-md hover:scale-105 transition-transform"
          >
            👥 Find Roommates
          </Button>
          <Button
            onClick={() => navigate("/ai-chat")}
            className="bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 text-white h-16 text-lg font-semibold shadow-md hover:scale-105 transition-transform"
          >
            💬 Chat Roomy
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
