import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileHubHeader } from './ProfileHubHeader';
import { QuickActionCards } from './QuickActionCards';
import { PersonalityMatchingCard } from './PersonalityMatchingCard';
import { MatchPlanSection } from './MatchPlanSection';
import { AccountSettingsSection } from './AccountSettingsSection';
import { PersonalitySurveyDrawer } from './PersonalitySurveyDrawer';
import BottomNav from '@/components/BottomNav';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import type { AiMatchPlan } from '@/utils/tierLogic';

interface ProfileHubProps {
  userId: string;
  onSignOut: () => void;
}

export interface StudentProfile {
  id: string;
  full_name: string | null;
  age: number | null;
  gender: string | null;
  university: string | null;
  major: string | null;
  year_of_study: number | null;
  budget: number | null;
  preferred_housing_area: string | null;
  room_type: string | null;
  accommodation_status: string | null;
  need_roommate: boolean | null;
  current_dorm_id: string | null;
  current_room_id: string | null;
  personality_test_completed: boolean | null;
  profile_photo_url: string | null;
  email?: string | null;
  email_verified?: boolean | null;
  enable_personality_matching: boolean | null;
  ai_match_plan?: AiMatchPlan;
}

export function ProfileHub({ userId, onSignOut }: ProfileHubProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { count: unreadNotifications } = useUnreadNotificationsCount(userId);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [showSurveyDrawer, setShowSurveyDrawer] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    loadProfile();
    loadSavedCount();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data as unknown as StudentProfile);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedCount = async () => {
    try {
      // Count saved rooms
      const { count: roomsCount } = await supabase
        .from('saved_rooms')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setSavedCount(roomsCount || 0);
    } catch (err) {
      console.error('Error loading saved count:', err);
      setSavedCount(0);
    }
  };

  const handlePlanChange = async (plan: AiMatchPlan) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ ai_match_plan: plan })
        .eq('user_id', userId);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ai_match_plan: plan } : null));
      toast({
        title: 'Plan updated',
        description: `You're now on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`,
      });
    } catch (err) {
      console.error('Error updating plan:', err);
      toast({
        title: 'Error',
        description: 'Could not update plan',
        variant: 'destructive',
      });
    }
  };

  const handleSurveyComplete = () => {
    setShowSurveyDrawer(false);
    loadProfile();
    toast({
      title: 'Survey complete!',
      description: 'Your personality preferences have been saved',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-6 px-4 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Header with notification bell */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative"
              onClick={() => navigate('/profile/notifications')}
            >
              <Bell className="w-6 h-6" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </Button>
          </div>

          {/* Profile Hub Header Card */}
          <ProfileHubHeader profile={profile} userId={userId} />

          {/* Quick Action Cards */}
          <QuickActionCards
            userId={userId}
            personalityCompleted={!!profile?.personality_test_completed}
            savedCount={savedCount}
            onPersonalityClick={() => setShowSurveyDrawer(true)}
          />

          {/* Personality Matching Card */}
          <PersonalityMatchingCard
            userId={userId}
            personalityCompleted={!!profile?.personality_test_completed}
            personalityEnabled={profile?.enable_personality_matching ?? true}
            onTakeSurvey={() => setShowSurveyDrawer(true)}
            onProfileUpdated={loadProfile}
          />

          {/* Match Plan Section */}
          <MatchPlanSection
            currentPlan={(profile?.ai_match_plan as AiMatchPlan) || 'basic'}
            studentId={profile?.id}
            onPlanChange={handlePlanChange}
          />

          {/* Wishlists Entry */}
          <button
            onClick={() => navigate('/wishlists')}
            className="w-full flex items-center gap-3 p-4 bg-gradient-to-br from-pink-500/5 to-red-500/5 rounded-2xl border border-border/40 hover:border-pink-500/30 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-foreground text-sm">Wishlists</h3>
              <p className="text-xs text-muted-foreground">{savedCount} saved items</p>
            </div>
          </button>

          {/* Account & Settings */}
          <AccountSettingsSection onSignOut={onSignOut} />
        </motion.div>
      </div>

      {/* Personality Survey Drawer */}
      <PersonalitySurveyDrawer
        open={showSurveyDrawer}
        onOpenChange={setShowSurveyDrawer}
        userId={userId}
        onComplete={handleSurveyComplete}
        existingAnswers={profile?.personality_test_completed ? profile : null}
      />

      <BottomNav />
    </div>
  );
}
