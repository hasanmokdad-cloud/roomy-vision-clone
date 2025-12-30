import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StudentProfileForm } from '@/components/StudentProfileForm';
import { OwnerProfileForm } from '@/components/OwnerProfileForm';
import { AdminProfileForm } from '@/components/AdminProfileForm';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Bell, Globe, Settings, HelpCircle, Scale, Building2, User, LogOut, Heart, Sparkles, ChevronRight, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageModal } from '@/components/LanguageModal';

import { MobileMenuRow } from '@/components/mobile/MobileMenuRow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StudentOnboardingDrawer } from '@/components/student/mobile/StudentOnboardingDrawer';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { AccommodationStatusCard } from '@/components/profile/AccommodationStatusCard';
import { ProfileVisibilityNotice } from '@/components/profile/ProfileVisibilityNotice';



export default function Profile() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthReady, isRoleReady, userId, role, isAuthenticated, openAuthModal, signOut } = useAuth();
  const { setHideBottomNav } = useBottomNav();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [ownerData, setOwnerData] = useState<any>(null);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [whatsappLanguage, setWhatsappLanguage] = useState('EN');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(true); // Default true to hide button
  const [showOnboardingDrawer, setShowOnboardingDrawer] = useState(false);
  
  // Hide bottom nav when viewing profile form (sub-page)
  useEffect(() => {
    setHideBottomNav(showProfileForm);
    return () => setHideBottomNav(false);
  }, [showProfileForm, setHideBottomNav]);

  // Check for ?edit=true query param to auto-show profile form
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && isAuthenticated) {
      setShowProfileForm(true);
    }
  }, [searchParams, isAuthenticated]);

  useEffect(() => {
    // Wait for both auth AND role to be ready
    if (!isAuthReady || !isRoleReady) return;
    
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadProfileData = async () => {
      if (!userId) return;
      
      // Get profile photo and name based on role
      // Treat null role as student for new accounts
      if (role === 'student' || role === null) {
        const { data: student } = await supabase
          .from('students')
          .select('profile_photo_url, full_name, university, gender, governorate, district, accommodation_status, budget, room_type, personality_test_completed')
          .eq('user_id', userId)
          .maybeSingle(); // Use maybeSingle for new accounts that may not have a record
        
        if (student) {
          setProfilePhotoUrl(student.profile_photo_url || null);
          setUserName(student.full_name || '');
          
          // Check if profile is complete (has key fields filled)
          const profileComplete = !!(student.full_name && student.university && student.gender);
          setHasCompletedProfile(profileComplete);
        } else {
          // No student record yet - definitely needs onboarding
          setHasCompletedProfile(false);
        }
        
        // Fetch saved dorms count
        const { count } = await supabase
          .from('saved_rooms')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        setSavedCount(count || 0);
        
        // Fetch unread notifications count
        const { count: notifCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('read', false);
        setUnreadCount(notifCount || 0);
      } else if (role === 'owner') {
        const { data: owner } = await supabase
          .from('owners')
          .select('*')
          .eq('user_id', userId)
          .single();
        setProfilePhotoUrl(owner?.profile_photo_url || null);
        setUserName(owner?.full_name || '');
        if (owner) {
          setOwnerData(owner);
          setNotifyEmail(owner.notify_email ?? true);
          setNotifyWhatsapp(owner.notify_whatsapp ?? true);
          setWhatsappLanguage(owner.whatsapp_language || 'EN');
        }
      } else if (role === 'admin') {
        const { data: admin } = await supabase
          .from('admins')
          .select('profile_photo_url, full_name')
          .eq('user_id', userId)
          .maybeSingle();
        setProfilePhotoUrl(admin?.profile_photo_url || null);
        setUserName(admin?.full_name || '');
      }

      setLoading(false);
    };

    loadProfileData();
  }, [isAuthReady, isRoleReady, isAuthenticated, userId, role, navigate]);

  const reloadProfileData = async () => {
    if (!userId || (role !== 'student' && role !== null)) return;
    
    const { data: student } = await supabase
      .from('students')
      .select('profile_photo_url, full_name, university, gender, governorate, district, accommodation_status, budget, room_type, personality_test_completed')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (student) {
      setProfilePhotoUrl(student.profile_photo_url || null);
      setUserName(student.full_name || '');
      const profileComplete = !!(student.full_name && student.university && student.gender);
      setHasCompletedProfile(profileComplete);
    } else {
      setHasCompletedProfile(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboardingDrawer(false);
    reloadProfileData();
  };

  const handlePhotoUploaded = (url: string) => {
    setProfilePhotoUrl(url);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getRoleLabel = () => {
    if (role === 'student') return 'Student';
    if (role === 'owner') return 'Owner';
    if (role === 'admin') return 'Admin';
    return '';
  };

  // Mobile unauthenticated state - Airbnb style
  if (isAuthReady && !isAuthenticated && isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-6 px-6 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            
            <p className="text-muted-foreground">
              Log in to start planning your next dorm
            </p>

            <Button
              onClick={() => openAuthModal()}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-6 text-lg rounded-xl"
            >
              Log in or sign up
            </Button>

            {/* Menu Items - No Card wrappers */}
            <div className="pt-4 divide-y divide-border/20">
              <MobileMenuRow
                icon={<Settings className="w-6 h-6" />}
                label="Account settings"
                onClick={() => openAuthModal()}
              />
              <MobileMenuRow
                icon={<HelpCircle className="w-6 h-6" />}
                label="Get help"
                onClick={() => navigate('/contact')}
              />
              <MobileMenuRow
                icon={<Globe className="w-6 h-6" />}
                label="Language"
                onClick={() => setShowLanguageModal(true)}
              />
              <MobileMenuRow
                icon={<Scale className="w-6 h-6" />}
                label="Legal"
                onClick={() => navigate('/legal/terms')}
              />
            </div>
          </motion.div>
        </div>
        
        <LanguageModal open={showLanguageModal} onOpenChange={setShowLanguageModal} />
      </div>
    );
  }

  if (!isAuthReady || !isRoleReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect unauthenticated desktop users
  if (!isAuthenticated) {
    navigate('/listings');
    return null;
  }

  const getBackButtonText = () => {
    if (role === 'owner' || role === 'admin') return 'Back to Control Panel';
    return 'Back to Dorms';
  };

  const getBackButtonPath = () => {
    if (role === 'owner') return '/owner';
    if (role === 'admin') return '/admin';
    return '/listings';
  };

  // Mobile authenticated profile
  if (isMobile) {
    // For students, use clean Airbnb-style layout
    if (role === 'student' || role === null) {
      // Show profile form if editing
      if (showProfileForm) {
        return (
          <div className="min-h-screen bg-background">
            <div className="pt-6 px-6 pb-32">
              <button
                onClick={() => setShowProfileForm(false)}
                className="flex items-center gap-2 text-foreground mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-lg font-semibold">Personal info</span>
              </button>

              <StudentProfileForm
                userId={userId!} 
                onComplete={() => setShowProfileForm(false)}
              />
            </div>
          </div>
        );
      }

      // Main student profile view - Airbnb style
      return (
        <div className="min-h-screen bg-background">
          <div className="pt-6 px-6 pb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header with title and notification bell */}
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-foreground">Profile</h1>
                <button
                  onClick={() => navigate('/profile/notifications')}
                  className="relative p-2"
                >
                  <Bell className="w-6 h-6 text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Avatar Card */}
              <button
                onClick={() => setShowProfileForm(true)}
                className="flex flex-col items-center py-6 w-full"
              >
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage src={profilePhotoUrl || undefined} alt={userName} />
                  <AvatarFallback className="bg-muted text-2xl">
                    {userName ? userName.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold text-foreground">
                  {userName || 'Your Name'}
                </h2>
                <p className="text-muted-foreground text-sm">Student</p>
              </button>

              {/* Profile Visibility Notice */}
              <div className="px-2">
                <ProfileVisibilityNotice />
              </div>

              {/* Get Started Banner - only show if profile not complete */}
              {!hasCompletedProfile && (
                <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="bg-white/20 rounded-xl p-3">
                      <Rocket className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Complete Your Profile</h3>
                      <p className="text-sm text-white/80 mb-3">
                        Set up your profile to get personalized dorm matches
                      </p>
                      <Button
                        onClick={() => setShowOnboardingDrawer(true)}
                        variant="secondary"
                        className="bg-white text-primary hover:bg-white/90"
                      >
                        Get Started
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Accommodation Status Card */}
              {hasCompletedProfile && userId && (
                <AccommodationStatusCard 
                  userId={userId} 
                  onStatusChange={reloadProfileData}
                />
              )}

              {/* Feature Cards - 2 column grid */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/wishlists')}
                  className="bg-card border border-border rounded-2xl p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <Heart className="w-6 h-6 text-pink-500 mb-2" />
                  <p className="font-semibold text-foreground">Saved</p>
                  <p className="text-sm text-muted-foreground">{savedCount} items</p>
                </button>
                <button
                  onClick={() => navigate('/ai-match')}
                  className="bg-card border border-border rounded-2xl p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <Sparkles className="w-6 h-6 text-primary mb-2" />
                  <p className="font-semibold text-foreground">AI Match</p>
                  <p className="text-sm text-muted-foreground">Find your fit</p>
                </button>
              </div>

              {/* Become an Owner Banner */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-xl p-3">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Become an Owner</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      List your property and start earning
                    </p>
                    <button
                      onClick={() => navigate('/become-owner')}
                      className="text-sm font-medium text-primary flex items-center gap-1"
                    >
                      Switch to hosting
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="divide-y divide-border/20">
                <MobileMenuRow
                  icon={<Settings className="w-6 h-6" />}
                  label="Account settings"
                  onClick={() => navigate('/settings')}
                />
              <MobileMenuRow
                icon={<HelpCircle className="w-6 h-6" />}
                label="Help Center"
                onClick={() => navigate('/help')}
              />
                <MobileMenuRow
                  icon={<User className="w-6 h-6" />}
                  label="View profile"
                  onClick={() => setShowProfileForm(true)}
                />
                <MobileMenuRow
                  icon={<Globe className="w-6 h-6" />}
                  label="Language"
                  onClick={() => setShowLanguageModal(true)}
                />
              </div>

              <div className="h-px bg-border/30" />

              <div className="divide-y divide-border/20">
                <MobileMenuRow
                  icon={<Scale className="w-6 h-6" />}
                  label="Legal"
                  onClick={() => navigate('/legal/terms')}
                />
                <MobileMenuRow
                  icon={<LogOut className="w-6 h-6" />}
                  label="Log out"
                  onClick={handleSignOut}
                  showChevron={false}
                  destructive
                />
              </div>
            </motion.div>
          </div>
          
          <LanguageModal open={showLanguageModal} onOpenChange={setShowLanguageModal} />
          <StudentOnboardingDrawer 
            open={showOnboardingDrawer} 
            onOpenChange={setShowOnboardingDrawer}
            onComplete={handleOnboardingComplete}
          />
        </div>
      );
    }

    // For owners/admins, keep the existing profile form view
    if (showProfileForm) {
      return (
        <div className="min-h-screen bg-background">
          <div className="pt-6 px-6 pb-32">
            <button
              onClick={() => setShowProfileForm(false)}
              className="flex items-center gap-2 text-foreground mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-lg font-semibold">Personal info</span>
            </button>

            <div className="flex justify-center mb-6">
              <ProfilePhotoUpload
                userId={userId!}
                currentUrl={profilePhotoUrl}
                onUploaded={handlePhotoUploaded}
                tableName={role === 'owner' ? 'owners' : 'admins'}
              />
            </div>

            {role === 'owner' && (
              <OwnerProfileForm 
                userId={userId!}
                notifyEmail={notifyEmail}
                setNotifyEmail={setNotifyEmail}
                notifyWhatsapp={notifyWhatsapp}
                setNotifyWhatsapp={setNotifyWhatsapp}
                whatsappLanguage={whatsappLanguage}
                setWhatsappLanguage={setWhatsappLanguage}
              />
            )}

            {role === 'admin' && (
              <AdminProfileForm userId={userId!} />
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="pt-6 px-6 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            </div>

            <button
              onClick={() => setShowProfileForm(true)}
              className="flex flex-col items-center py-6 w-full"
            >
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={profilePhotoUrl || undefined} alt={userName} />
                <AvatarFallback className="bg-muted text-2xl">
                  {userName ? userName.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-foreground">
                {userName || 'Your Name'}
              </h2>
              <p className="text-muted-foreground text-sm">{getRoleLabel()}</p>
            </button>

            <div className="divide-y divide-border/20">
              <MobileMenuRow
                icon={<Settings className="w-6 h-6" />}
                label="Account settings"
                onClick={() => navigate('/settings')}
              />
              <MobileMenuRow
                icon={<User className="w-6 h-6" />}
                label="View profile"
                onClick={() => setShowProfileForm(true)}
              />
              <MobileMenuRow
                icon={<Globe className="w-6 h-6" />}
                label="Language"
                onClick={() => setShowLanguageModal(true)}
              />
            </div>

            <div className="h-px bg-border/30" />

            <div className="divide-y divide-border/20">
              <MobileMenuRow
                icon={<Scale className="w-6 h-6" />}
                label="Legal"
                onClick={() => navigate('/legal/terms')}
              />
              <MobileMenuRow
                icon={<LogOut className="w-6 h-6" />}
                label="Log out"
                onClick={handleSignOut}
                showChevron={false}
                destructive
              />
            </div>
          </motion.div>
        </div>
        
        <LanguageModal open={showLanguageModal} onOpenChange={setShowLanguageModal} />
        
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen relative bg-background">
      <RoomyNavbar />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 md:px-6 py-24 md:py-32 mt-16 md:mt-0"
      >
        <Button
          variant="ghost"
          onClick={() => navigate(getBackButtonPath())}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {getBackButtonText()}
        </Button>

        {(role === 'student' || role === null) && (
          <>
            {/* Get Started Banner - only show if profile not complete */}
            {!hasCompletedProfile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="max-w-2xl mx-auto mb-6"
              >
                <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 rounded-xl p-3">
                      <Rocket className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">Complete Your Profile</h3>
                      <p className="text-white/80 mb-4">
                        Set up your profile to get personalized dorm matches and find the perfect roommate
                      </p>
                      <Button
                        onClick={() => navigate('/onboarding/student')}
                        variant="secondary"
                        size="lg"
                        className="bg-white text-primary hover:bg-white/90"
                      >
                        <Rocket className="w-4 h-4 mr-2" />
                        Get Started
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}


            {/* Student Profile Form - only show if profile is complete */}
            {/* Note: StudentProfileForm handles preventing redirect to /ai-match when pending claim exists */}
            {hasCompletedProfile && (
              <StudentProfileForm 
                userId={userId!} 
                onComplete={() => navigate('/ai-match')}
              />
            )}
          </>
        )}

        {role === 'owner' && (
          <>
            <OwnerProfileForm 
              userId={userId!}
              notifyEmail={notifyEmail}
              setNotifyEmail={setNotifyEmail}
              notifyWhatsapp={notifyWhatsapp}
              setNotifyWhatsapp={setNotifyWhatsapp}
              whatsappLanguage={whatsappLanguage}
              setWhatsappLanguage={setWhatsappLanguage}
            />
          </>
        )}

        {role === 'admin' && (
          <AdminProfileForm 
            userId={userId!}
          />
        )}
      </motion.div>

      <Footer />
    </div>
  );
}
