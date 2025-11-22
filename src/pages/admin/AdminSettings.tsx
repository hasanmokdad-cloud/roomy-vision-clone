import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { useToast } from '@/hooks/use-toast';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function AdminSettings() {
  const { userId } = useRoleGuard('admin');
  const [loading, setLoading] = useState(true);
  const [ownerData, setOwnerData] = useState<any>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;
    loadAdminData();
  }, [userId]);

  const loadAdminData = async () => {
    // Check if admin has an owner profile (admins can also be owners)
    const { data: owner } = await supabase
      .from('owners')
      .select('*, profile_photo_url')
      .eq('user_id', userId)
      .maybeSingle();

    if (owner) {
      setOwnerData(owner);
      setProfilePhotoUrl(owner.profile_photo_url);
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

      {ownerData && (
        <div className="glass-hover rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6 text-center">Profile Photo</h2>
          <ProfilePhotoUpload
            userId={userId!}
            currentUrl={profilePhotoUrl}
            onUploaded={handlePhotoUploaded}
            tableName="owners"
          />
        </div>
      )}

      <div className="glass-hover rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Platform Configuration</h2>
        <p className="text-foreground/60">
          {ownerData 
            ? 'Additional admin settings coming soon...' 
            : 'Profile photo upload requires an owner profile. Contact support to set up your admin-owner account.'}
        </p>
      </div>
    </div>
  );
}
