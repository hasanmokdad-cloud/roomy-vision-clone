import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StudentProfileForm } from '@/components/StudentProfileForm';
import { OwnerProfileForm } from '@/components/OwnerProfileForm';
import { AdminProfileForm } from '@/components/AdminProfileForm';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Bell, Globe, Settings, ChevronRight, HelpCircle, Scale, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageModal } from '@/components/LanguageModal';
import BottomNav from '@/components/BottomNav';

export default function Profile() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAuthReady, userId, role, isAuthenticated, openAuthModal } = useAuth();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerData, setOwnerData] = useState<any>(null);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [whatsappLanguage, setWhatsappLanguage] = useState('EN');
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    if (!isAuthReady) return;
    
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadProfileData = async () => {
      if (!userId) return;
      
      // Get profile photo based on role
      if (role === 'student') {
        const { data: student } = await supabase
          .from('students')
          .select('profile_photo_url')
          .eq('user_id', userId)
          .single();
        setProfilePhotoUrl(student?.profile_photo_url || null);
      } else if (role === 'owner') {
        const { data: owner } = await supabase
          .from('owners')
          .select('*')
          .eq('user_id', userId)
          .single();
        setProfilePhotoUrl(owner?.profile_photo_url || null);
        if (owner) {
          setOwnerData(owner);
          setNotifyEmail(owner.notify_email ?? true);
          setNotifyWhatsapp(owner.notify_whatsapp ?? true);
          setWhatsappLanguage(owner.whatsapp_language || 'EN');
        }
      } else if (role === 'admin') {
        const { data: admin } = await supabase
          .from('admins')
          .select('profile_photo_url')
          .eq('user_id', userId)
          .maybeSingle();
        setProfilePhotoUrl(admin?.profile_photo_url || null);
      }

      setLoading(false);
    };

    loadProfileData();
  }, [isAuthReady, isAuthenticated, userId, role, navigate]);

  const handlePhotoUploaded = (url: string) => {
    setProfilePhotoUrl(url);
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

            {/* Settings Options */}
            <div className="pt-6 space-y-2">
              <Card 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => openAuthModal()}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-foreground">Settings</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setShowLanguageModal(true)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">Language</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate('/contact')}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">Get help</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate('/legal/terms')}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Scale className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">Legal</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
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

  // Mobile authenticated profile with extra options
  if (isMobile) {
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
                onClick={() => navigate('/settings')}
              >
                <Bell className="w-6 h-6" />
              </Button>
            </div>

            {/* Profile Form */}
            {role === 'student' && (
              <>
                <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
                  <div className="flex justify-center mb-4">
                    <ProfilePhotoUpload
                      userId={userId!}
                      currentUrl={profilePhotoUrl}
                      onUploaded={handlePhotoUploaded}
                      tableName="students"
                    />
                  </div>
                </div>

                <StudentProfileForm 
                  userId={userId!} 
                  onComplete={() => navigate('/ai-match')}
                />
              </>
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

            {/* Quick Actions for Students */}
            {role === 'student' && (
              <div className="space-y-3 pt-4">
                <Card 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate('/become-owner')}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-primary" />
                      <span className="text-foreground font-medium">Become an Owner</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate('/settings')}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">Settings</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setShowLanguageModal(true)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">Language</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </div>
            )}
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
