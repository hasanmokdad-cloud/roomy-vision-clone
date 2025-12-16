import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileHubHeader } from './ProfileHubHeader';
import { HousingMatchingCard } from './accordion/HousingMatchingCard';
import { AcademicInfoCard } from './accordion/AcademicInfoCard';
import { CurrentAccommodationCard } from './accordion/CurrentAccommodationCard';
import { AccountSecurityCard } from './accordion/AccountSecurityCard';
import { PersonalitySurveyDrawer } from './PersonalitySurveyDrawer';
import BottomNav from '@/components/BottomNav';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';

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
}

export function ProfileHub({ userId, onSignOut }: ProfileHubProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { count: unreadNotifications } = useUnreadNotificationsCount(userId);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [showSurveyDrawer, setShowSurveyDrawer] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = () => {
    // Check if preferences are set
    if (!profile?.preferred_housing_area || !profile?.room_type || !profile?.budget) {
      toast({
        title: 'Set your preferences first',
        description: 'Complete your housing preferences to find matches',
        variant: 'destructive',
      });
      navigate('/profile/preferences');
      return;
    }
    navigate('/ai-match');
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
          className="space-y-6"
        >
          {/* Header with notification bell */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Your Profile</h1>
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
          <ProfileHubHeader profile={profile} />

          {/* Quick Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleFindMatches}
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-primary to-secondary"
            >
              Find Matches
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/profile/preferences')}
              className="w-full py-6 text-lg font-semibold"
            >
              Edit Preferences
            </Button>
          </div>

          {/* Accordion Cards */}
          <div className="space-y-3">
            <HousingMatchingCard
              profile={profile}
              onEditPreferences={() => navigate('/profile/preferences')}
              onTakeSurvey={() => setShowSurveyDrawer(true)}
              onFindMatches={handleFindMatches}
            />
            
            <AcademicInfoCard
              profile={profile}
              userId={userId}
              onProfileUpdated={loadProfile}
            />
            
            <CurrentAccommodationCard
              profile={profile}
              userId={userId}
              onProfileUpdated={loadProfile}
            />
            
            <AccountSecurityCard
              profile={profile}
              userId={userId}
              onSignOut={onSignOut}
            />
          </div>
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
