import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, Mail, Loader2 } from 'lucide-react';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';

const ownerProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone_number: z.string().optional(),
  email: z.string().email('Invalid email address'),
});

type OwnerProfile = z.infer<typeof ownerProfileSchema>;

interface OwnerProfileFormProps {
  userId: string;
  onComplete?: () => void;
  notifyEmail?: boolean;
  setNotifyEmail?: (value: boolean) => void;
  notifyWhatsapp?: boolean;
  setNotifyWhatsapp?: (value: boolean) => void;
  whatsappLanguage?: string;
  setWhatsappLanguage?: (value: string) => void;
}

export const OwnerProfileForm = ({ 
  userId, 
  onComplete,
  notifyEmail = true,
  setNotifyEmail,
  notifyWhatsapp = true,
  setNotifyWhatsapp,
  whatsappLanguage = 'EN',
  setWhatsappLanguage,
}: OwnerProfileFormProps) => {
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<OwnerProfile>({
    resolver: zodResolver(ownerProfileSchema),
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Get owner profile
      const { data: owner, error: ownerError } = await supabase
        .from('owners')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (ownerError) throw ownerError;

      if (owner) {
        setOwnerId(owner.id);
        setValue('full_name', owner.full_name);
        setValue('phone_number', owner.phone_number || '');
        setValue('email', owner.email);
        
        // Set profile photo if exists
        if (owner.profile_photo_url) {
          setProfilePhotoUrl(owner.profile_photo_url);
        } else {
          // Try to get first dorm's image as default
          const { data: dorms } = await supabase
            .from('dorms')
            .select('image_url, cover_image')
            .eq('owner_id', owner.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (dorms?.[0]) {
            const defaultPhoto = dorms[0].cover_image || dorms[0].image_url;
            setProfilePhotoUrl(defaultPhoto);
          }
        }
      }
    } catch (error) {
      console.error('Error loading owner profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: OwnerProfile) => {
    setIsSaving(true);
    try {
      if (!ownerId) throw new Error('Owner ID not found');

      const { error } = await supabase
        .from('owners')
        .update({
          full_name: data.full_name,
          phone_number: data.phone_number,
          email: data.email,
          notify_email: notifyEmail,
          notify_whatsapp: notifyWhatsapp,
          whatsapp_language: whatsappLanguage,
        })
        .eq('id', ownerId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      onComplete?.();
    } catch (error) {
      console.error('Profile save error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
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
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Profile Photo Section */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Photo
        </h3>
        <div className="flex justify-center">
          {ownerId && (
            <ProfilePhotoUpload
              userId={userId}
              currentUrl={profilePhotoUrl}
              onUploaded={handlePhotoUploaded}
              tableName="owners"
            />
          )}
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Information
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="full_name" className="text-foreground">Full Name *</Label>
            <Input
              id="full_name"
              {...register('full_name')}
              placeholder="Your full name"
              className="mt-2"
            />
            {errors.full_name && (
              <p className="text-destructive text-sm mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact
            </h4>

            <div>
              <Label htmlFor="phone_number" className="text-foreground">Phone Number</Label>
              <Input
                id="phone_number"
                {...register('phone_number')}
                placeholder="+1 (555) 123-4567"
                className="mt-2"
              />
              {errors.phone_number && (
                <p className="text-destructive text-sm mt-1">{errors.phone_number.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="your.email@example.com"
                className="mt-2"
              />
              {errors.email && (
                <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Email Notifications Section */}
      {setNotifyEmail && (
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Email Notifications</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex-1">
                    <Label htmlFor="notify-email" className="font-semibold text-foreground">
                      Email me about listing updates
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Receive emails when your listings are verified or edited by admins
                    </p>
                  </div>
                  <Switch
                    id="notify-email"
                    checked={notifyEmail}
                    onCheckedChange={setNotifyEmail}
                  />
                </div>

                <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl">
                  <p className="font-semibold text-foreground mb-2">What you'll receive:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>🎉 Verification confirmation when your listing goes live</li>
                    <li>📝 Update notifications when listing details are changed</li>
                    <li>⚡ Limited to 5 emails per hour (we respect your inbox!)</li>
                  </ul>
                </div>
              </div>
            </div>

            {setNotifyWhatsapp && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">WhatsApp Notifications</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div className="flex-1">
                      <Label htmlFor="notify-whatsapp" className="font-semibold text-foreground">
                        Receive WhatsApp alerts
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Get instant notifications via WhatsApp for verifications, updates, and inquiries
                      </p>
                    </div>
                    <Switch
                      id="notify-whatsapp"
                      checked={notifyWhatsapp}
                      onCheckedChange={setNotifyWhatsapp}
                    />
                  </div>

                  {notifyWhatsapp && setWhatsappLanguage && (
                    <div className="p-4 bg-muted/30 rounded-xl">
                      <Label htmlFor="whatsapp-language" className="font-semibold text-foreground mb-2 block">
                        Preferred Language / اللغة المفضلة
                      </Label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Choose the language for your WhatsApp notifications
                      </p>
                      <Select
                        value={whatsappLanguage}
                        onValueChange={setWhatsappLanguage}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EN">🇬🇧 English</SelectItem>
                          <SelectItem value="AR">🇱🇧 العربية (Arabic)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        {whatsappLanguage === 'AR' 
                          ? 'ستتلقى الرسائل باللغة العربية' 
                          : 'You will receive messages in English'}
                      </p>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl">
                    <p className="font-semibold text-foreground mb-2">WhatsApp benefits:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>📱 Instant alerts on your phone</li>
                      <li>🔔 Get notified about new student inquiries immediately</li>
                      <li>⚡ Limited to 3 WhatsApp messages per hour</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Update Profile Button at the bottom */}
      <Button 
        type="button"
        onClick={handleSubmit(onSubmit)} 
        disabled={isSaving}
        className="w-full py-6 text-lg font-bold bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] text-white rounded-xl"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Saving Profile...
          </>
        ) : (
          'Update Profile'
        )}
      </Button>
    </motion.div>
  );
};
