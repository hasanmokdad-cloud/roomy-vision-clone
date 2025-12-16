import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StudentProfileForm } from '@/components/StudentProfileForm';
import { OwnerProfileForm } from '@/components/OwnerProfileForm';
import { AdminProfileForm } from '@/components/AdminProfileForm';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Bell, Globe, Settings, HelpCircle, Scale, Building2, User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageModal } from '@/components/LanguageModal';
import BottomNav from '@/components/BottomNav';
import { MobileMenuRow } from '@/components/mobile/MobileMenuRow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';

export default function Profile() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthReady, userId, role, isAuthenticated, openAuthModal, signOut } = useAuth();
  const { count: unreadNotifications } = useUnreadNotificationsCount(userId || undefined);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [ownerData, setOwnerData] = useState<any>(null);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [whatsappLanguage, setWhatsappLanguage] = useState('EN');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  // Check for ?edit=true query param to auto-show profile form
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && isAuthenticated) {
      setShowProfileForm(true);
    }
  }, [searchParams, isAuthenticated]);

  useEffect(() => {
    if (!isAuthReady) return;
    
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadProfileData = async () => {
      if (!userId) return;
      
      // Get profile photo and name based on role
      if (role === 'student') {
        const { data: student } = await supabase
          .from('students')
          .select('profile_photo_url, full_name')
          .eq('user_id', userId)
          .single();
        setProfilePhotoUrl(student?.profile_photo_url || null);
        setUserName(student?.full_name || '');
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
  }, [isAuthReady, isAuthenticated, userId, role, navigate]);

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
        <BottomNav />
      </div>
    );
  }

  if (!isAuthReady || loading) {
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

  // Mobile authenticated profile - Airbnb style hub
  if (isMobile) {
    // If showing profile form, render it full screen
    if (showProfileForm) {
      return (
        <div className="min-h-screen bg-background">
          <div className="pt-6 px-6 pb-32">
            {/* Back button */}
            <button
              onClick={() => setShowProfileForm(false)}
              className="flex items-center gap-2 text-foreground mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-lg font-semibold">Personal info</span>
            </button>

            {/* Profile Photo */}
            <div className="flex justify-center mb-6">
              <ProfilePhotoUpload
                userId={userId!}
                currentUrl={profilePhotoUrl}
                onUploaded={handlePhotoUploaded}
                tableName={role === 'student' ? 'students' : role === 'owner' ? 'owners' : 'admins'}
              />
            </div>

            {/* Profile Form */}
            {role === 'student' && (
              <StudentProfileForm 
                userId={userId!} 
                onComplete={() => setShowProfileForm(false)}
              />
            )}

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
          <BottomNav />
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
            {/* Header with notification bell */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-foreground">Profile</h1>
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

            {/* Profile Avatar Section - Clickable */}
            <button
              onClick={() => role === 'student' ? navigate('/profile/complete') : setShowProfileForm(true)}
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

            {/* Become an Owner Banner - Only for students */}
            {role === 'student' && (
              <button
                onClick={() => navigate('/become-owner')}
                className="w-full p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl flex items-center gap-4 active:bg-primary/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-foreground">Become an Owner</p>
                  <p className="text-sm text-muted-foreground">List your dorm and earn</p>
                </div>
              </button>
            )}

            {/* Menu Items - No Card wrappers, just clean rows */}
            <div className="divide-y divide-border/20">
              <MobileMenuRow
                icon={<Settings className="w-6 h-6" />}
                label="Account settings"
                onClick={() => navigate('/settings')}
              />
              <MobileMenuRow
                icon={<HelpCircle className="w-6 h-6" />}
                label="Get help"
                onClick={() => navigate('/contact')}
              />
              <MobileMenuRow
                icon={<User className="w-6 h-6" />}
                label="View profile"
                onClick={() => role === 'student' ? navigate('/profile/complete') : setShowProfileForm(true)}
              />
              <MobileMenuRow
                icon={<Globe className="w-6 h-6" />}
                label="Language"
                onClick={() => setShowLanguageModal(true)}
              />
            </div>

            {/* Separator */}
            <div className="h-px bg-border/30" />

            {/* Secondary Menu Items */}
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
        <BottomNav />
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

        {role === 'student' && (
          <>
            {/* Profile Photo Section for Students */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="max-w-2xl mx-auto mb-6"
            >
              <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-foreground mb-4">Profile Photo</h3>
                <div className="flex justify-center">
                  <ProfilePhotoUpload
                    userId={userId!}
                    currentUrl={profilePhotoUrl}
                    onUploaded={handlePhotoUploaded}
                    tableName="students"
                  />
                </div>
              </div>
            </motion.div>

            <StudentProfileForm 
              userId={userId!} 
              onComplete={() => navigate('/ai-match')}
            />
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
