import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { useToast } from '@/hooks/use-toast';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function AdminSettings() {
  const { userId } = useRoleGuard('admin');
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;
    loadAdminData();
  }, [userId]);

  const loadAdminData = async () => {
    // Fetch admin profile from admins table
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin profile',
        variant: 'destructive'
      });
    }

    if (admin) {
      setAdminData(admin);
      setProfilePhotoUrl(admin.profile_photo_url);
    } else {
      // Admin profile doesn't exist, might need to create it
      console.warn('Admin profile not found for user:', userId);
    }
    
    setLoading(false);
  };

  const handlePhotoUploaded = async (url: string) => {
    setProfilePhotoUrl(url);
    await loadAdminData();
    toast({
      title: 'Success',
      description: 'Profile photo updated successfully',
    });
  };

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Admin Settings</h1>
        <p className="text-foreground/60 mt-2">Manage your admin account preferences</p>
      </div>

      {/* Profile Photo Section - Always show for admins */}
      <div className="glass-hover rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6 text-center">Profile Photo</h2>
        {adminData ? (
          <ProfilePhotoUpload
            userId={userId!}
            currentUrl={profilePhotoUrl}
            onUploaded={handlePhotoUploaded}
            tableName="admins"
          />
        ) : (
          <div className="text-center text-foreground/60">
            <p>Admin profile not found. Please contact support.</p>
          </div>
        )}
      </div>

      <div className="glass-hover rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Platform Configuration</h2>
        <p className="text-foreground/60">
          Additional admin settings coming soon...
        </p>
      </div>
    </div>
  );
}
