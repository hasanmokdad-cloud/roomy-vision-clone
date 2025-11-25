import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StudentProfileForm } from '@/components/StudentProfileForm';
import { OwnerProfileForm } from '@/components/OwnerProfileForm';
import { AdminProfileForm } from '@/components/AdminProfileForm';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Profile() {
  const isMobile = useIsMobile();
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUserId(session.user.id);

      // Get user role
      const { data: roleData } = await supabase.rpc('get_user_role', {
        p_user_id: session.user.id
      });

      setRole(roleData);

      // Get profile photo based on role
      if (roleData === 'student') {
        const { data: student } = await supabase
          .from('students')
          .select('profile_photo_url')
          .eq('user_id', session.user.id)
          .single();
        setProfilePhotoUrl(student?.profile_photo_url || null);
      } else if (roleData === 'owner') {
        const { data: owner } = await supabase
          .from('owners')
          .select('profile_photo_url')
          .eq('user_id', session.user.id)
          .single();
        setProfilePhotoUrl(owner?.profile_photo_url || null);
      } else if (roleData === 'admin') {
        const { data: admin } = await supabase
          .from('admins')
          .select('profile_photo_url')
          .eq('user_id', session.user.id)
          .maybeSingle();
        setProfilePhotoUrl(admin?.profile_photo_url || null);
      }

      setLoading(false);
    };

    loadUserData();
  }, [navigate]);

  const handlePhotoUploaded = (url: string) => {
    setProfilePhotoUrl(url);
  };

  if (!userId || loading) {
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
      {!isMobile && <Navbar />}
      
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
          <OwnerProfileForm 
            userId={userId}
          />
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
