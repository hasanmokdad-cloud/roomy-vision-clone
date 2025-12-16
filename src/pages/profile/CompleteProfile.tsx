import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, User, ChevronRight, Camera, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BottomNav from '@/components/BottomNav';
import { AboutProfileDrawer } from '@/components/profile/AboutProfileDrawer';
import { EditProfileDrawer } from '@/components/profile/EditProfileDrawer';

export type ProfileSection = 'personal' | 'academic' | 'housing' | null;

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { userId, isAuthenticated, isAuthReady, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [showAboutDrawer, setShowAboutDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [hasSeenAboutDrawer, setHasSeenAboutDrawer] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<ProfileSection>(null);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated || !userId || role !== 'student') {
      navigate('/profile');
      return;
    }

    // Check if user has seen the about drawer before
    const seenAbout = localStorage.getItem(`roomy_about_profile_${userId}`);
    setHasSeenAboutDrawer(!!seenAbout);

    loadProfile();
  }, [isAuthReady, isAuthenticated, userId, role]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        setProfilePhotoUrl(data.profile_photo_url);
        setUserName(data.full_name || '');
        setProfileData(data);

        // Show about drawer on first visit
        const seenAbout = localStorage.getItem(`roomy_about_profile_${userId}`);
        if (!seenAbout && !data.profile_photo_url && !data.full_name) {
          setShowAboutDrawer(true);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAboutDrawerClose = () => {
    setShowAboutDrawer(false);
    localStorage.setItem(`roomy_about_profile_${userId}`, 'true');
    setHasSeenAboutDrawer(true);
  };

  const handleCreateProfile = () => {
    setShowAboutDrawer(false);
    localStorage.setItem(`roomy_about_profile_${userId}`, 'true');
    setHasSeenAboutDrawer(true);
    setShowEditDrawer(true);
  };

  const handleProfileUpdated = () => {
    loadProfile();
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
      <div className="pt-6 px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center active:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditDrawer(true)}
              className="text-primary font-semibold"
            >
              Edit
            </Button>
          </div>

          {/* Profile Card */}
          <div className="flex flex-col items-center mb-8">
            <button
              onClick={() => setShowEditDrawer(true)}
              className="relative mb-4 group"
            >
              <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                <AvatarImage src={profilePhotoUrl || undefined} alt={userName} />
                <AvatarFallback className="bg-muted text-4xl">
                  {userName ? userName.charAt(0).toUpperCase() : <User className="w-16 h-16" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 border-background group-active:scale-95 transition-transform">
                <Camera className="w-5 h-5 text-primary-foreground" />
              </div>
            </button>
            <h2 className="text-2xl font-bold text-foreground">{userName || 'Your Name'}</h2>
            <p className="text-muted-foreground">Student</p>
          </div>

          {/* Complete Your Profile Section */}
          <div className="bg-card border border-border/40 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Complete your profile</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add more details to help us find you the perfect dorm and roommate matches
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                if (!hasSeenAboutDrawer) {
                  setShowAboutDrawer(true);
                } else {
                  setShowEditDrawer(true);
                }
              }}
              className="w-full bg-gradient-to-r from-primary to-secondary"
            >
              Get started
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Profile Sections Preview */}
          <div className="space-y-4">
            <ProfileSectionItem
              title="Personal Info"
              completed={!!(profileData?.full_name && profileData?.age && profileData?.gender)}
              onClick={() => { setActiveSection('personal'); setShowEditDrawer(true); }}
            />
            <ProfileSectionItem
              title="Academic Info"
              completed={!!(profileData?.university && profileData?.major)}
              onClick={() => { setActiveSection('academic'); setShowEditDrawer(true); }}
            />
            <ProfileSectionItem
              title="Housing Preferences"
              completed={!!(profileData?.budget && profileData?.preferred_housing_area)}
              onClick={() => { setActiveSection('housing'); setShowEditDrawer(true); }}
            />
            <ProfileSectionItem
              title="Personality Matching"
              completed={!!profileData?.personality_test_completed}
              onClick={() => navigate('/personality')}
            />
          </div>
        </motion.div>
      </div>

      {/* About Profile Drawer */}
      <AboutProfileDrawer
        open={showAboutDrawer}
        onClose={handleAboutDrawerClose}
        onCreateProfile={handleCreateProfile}
      />

      {/* Edit Profile Drawer */}
      <EditProfileDrawer
        open={showEditDrawer}
        onClose={() => { setShowEditDrawer(false); setActiveSection(null); }}
        userId={userId!}
        profileData={profileData}
        onProfileUpdated={handleProfileUpdated}
        initialSection={activeSection}
      />

      <BottomNav />
    </div>
  );
}

function ProfileSectionItem({ 
  title, 
  completed, 
  onClick 
}: { 
  title: string; 
  completed: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-card border border-border/40 rounded-xl active:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${completed ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
        <span className="font-medium text-foreground">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm ${completed ? 'text-green-500' : 'text-muted-foreground'}`}>
          {completed ? 'Complete' : 'Incomplete'}
        </span>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </button>
  );
}
