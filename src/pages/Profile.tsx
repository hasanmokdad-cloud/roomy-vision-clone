import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StudentProfileForm } from '@/components/StudentProfileForm';
import { OwnerProfileForm } from '@/components/OwnerProfileForm';
import { AdminProfileForm } from '@/components/AdminProfileForm';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAuthReady, userId, role, isAuthenticated } = useAuth();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerData, setOwnerData] = useState<any>(null);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [whatsappLanguage, setWhatsappLanguage] = useState('EN');

  useEffect(() => {
    if (!isAuthReady) return;
    
    if (!isAuthenticated) {
      navigate('/listings');
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

  if (!isAuthReady || !userId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
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

  return (
    <div className="min-h-screen relative bg-background">
      {!isMobile && <RoomyNavbar />}
      
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
                    userId={userId}
                    currentUrl={profilePhotoUrl}
                    onUploaded={handlePhotoUploaded}
                    tableName="students"
                  />
                </div>
              </div>
            </motion.div>

            <StudentProfileForm 
              userId={userId} 
              onComplete={() => navigate('/ai-match')}
            />
          </>
        )}

        {role === 'owner' && (
          <>
            <OwnerProfileForm 
              userId={userId}
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
            userId={userId}
          />
        )}
      </motion.div>

      <Footer />
    </div>
  );
}
