import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';

const adminProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone_number: z.string().optional(),
  email: z.string().email('Invalid email address'),
});

type AdminProfile = z.infer<typeof adminProfileSchema>;

interface AdminProfileFormProps {
  userId: string;
  onComplete?: () => void;
}

export function AdminProfileForm({ userId, onComplete }: AdminProfileFormProps) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adminId, setAdminId] = useState<string>();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AdminProfile>({
    resolver: zodResolver(adminProfileSchema),
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (adminError) throw adminError;

      if (admin) {
        setAdminId(admin.id);
        setValue('full_name', admin.full_name || '');
        setValue('phone_number', admin.phone_number || '');
        setValue('email', admin.email || '');
        setProfilePhotoUrl(admin.profile_photo_url);
      }
    } catch (error) {
      console.error('Error loading admin profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AdminProfile) => {
    if (!adminId) {
      toast({
        title: 'Error',
        description: 'Admin profile not found',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('admins')
        .update({
          full_name: data.full_name,
          phone_number: data.phone_number,
          email: data.email,
        })
        .eq('id', adminId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUploaded = (url: string) => {
    setProfilePhotoUrl(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold mb-6 gradient-text">Admin Profile</h2>

        {/* Profile Photo Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-foreground mb-4">Profile Photo</h3>
          <div className="flex justify-center">
            <ProfilePhotoUpload
              userId={userId}
              currentUrl={profilePhotoUrl}
              onUploaded={handlePhotoUploaded}
              tableName="admins"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Full Name *
            </label>
            <Input
              {...register('full_name')}
              placeholder="Enter your full name"
              className="w-full"
            />
            {errors.full_name && (
              <p className="text-destructive text-sm mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Phone Number
            </label>
            <Input
              {...register('phone_number')}
              placeholder="Enter your phone number"
              className="w-full"
            />
            {errors.phone_number && (
              <p className="text-destructive text-sm mt-1">{errors.phone_number.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Email *
            </label>
            <Input
              {...register('email')}
              type="email"
              placeholder="Enter your email"
              className="w-full"
            />
            {errors.email && (
              <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-primary to-secondary"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
