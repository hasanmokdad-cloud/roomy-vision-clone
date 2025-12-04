import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { Loader2 } from 'lucide-react';
import { OwnerFormSkeleton } from '@/components/skeletons/OwnerSkeletons';
import { motion } from 'framer-motion';

export default function OwnerAccount() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [owner, setOwner] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    notify_email: true,
    notify_whatsapp: true,
    whatsapp_language: 'EN',
    profile_photo_url: null as string | null,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadOwnerData();
  }, []);

  const loadOwnerData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!error && data) {
      setOwner(data);
      setFormData({
        full_name: data.full_name || '',
        phone_number: data.phone_number || '',
        notify_email: data.notify_email ?? true,
        notify_whatsapp: data.notify_whatsapp ?? true,
        whatsapp_language: data.whatsapp_language || 'EN',
        profile_photo_url: data.profile_photo_url || null,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('owners')
        .update(formData)
        .eq('id', owner.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Account settings updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUploaded = async (url: string) => {
    setFormData({ ...formData, profile_photo_url: url });
    await loadOwnerData();
  };

  if (loading) {
    return <OwnerFormSkeleton />;
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-semibold text-gray-800">Account Settings</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your profile and notification preferences</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-6 space-y-6">
                {/* Profile Photo Section */}
                <div className="flex flex-col items-center pb-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-700 mb-6">Profile Photo</h2>
                  <ProfilePhotoUpload
                    userId={owner?.user_id}
                    currentUrl={formData.profile_photo_url}
                    onUploaded={handlePhotoUploaded}
                    tableName="owners"
                  />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Profile Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>

                    <div>
                      <Label>Email</Label>
                      <Input
                        value={owner?.email}
                        disabled
                        className="rounded-xl opacity-60"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="+961 XX XXX XXX"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Email Notifications</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <div className="flex-1">
                        <Label htmlFor="notify-email" className="font-semibold text-gray-700">
                          Email me about listing updates
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">
                          Receive emails when your listings are verified or edited by admins
                        </p>
                      </div>
                      <Switch
                        id="notify-email"
                        checked={formData.notify_email}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, notify_email: checked })
                        }
                      />
                    </div>

                    <div className="text-sm text-gray-500 p-4 bg-muted/30 rounded-xl">
                      <p className="font-semibold text-gray-700 mb-2">What you'll receive:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>🎉 Verification confirmation when your listing goes live</li>
                        <li>📝 Update notifications when listing details are changed</li>
                        <li>⚡ Limited to 5 emails per hour (we respect your inbox!)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">WhatsApp Notifications</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <div className="flex-1">
                        <Label htmlFor="notify-whatsapp" className="font-semibold text-gray-700">
                          Receive WhatsApp alerts
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">
                          Get instant notifications via WhatsApp for verifications, updates, and inquiries
                        </p>
                      </div>
                      <Switch
                        id="notify-whatsapp"
                        checked={formData.notify_whatsapp}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, notify_whatsapp: checked })
                        }
                      />
                    </div>

                    {formData.notify_whatsapp && (
                      <div className="p-4 bg-muted/30 rounded-xl">
                        <Label htmlFor="whatsapp-language" className="font-semibold text-gray-700 mb-2 block">
                          Preferred Language / اللغة المفضلة
                        </Label>
                        <p className="text-xs text-gray-500 mb-3">
                          Choose the language for your WhatsApp notifications
                        </p>
                        <Select
                          value={formData.whatsapp_language}
                          onValueChange={(value) => 
                            setFormData({ ...formData, whatsapp_language: value })
                          }
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EN">🇬🇧 English</SelectItem>
                            <SelectItem value="AR">🇱🇧 العربية (Arabic)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-2">
                          {formData.whatsapp_language === 'AR' 
                            ? 'ستتلقى الرسائل باللغة العربية' 
                            : 'You will receive messages in English'}
                        </p>
                      </div>
                    )}

                    <div className="text-sm text-gray-500 p-4 bg-muted/30 rounded-xl">
                      <p className="font-semibold text-gray-700 mb-2">WhatsApp benefits:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>📱 Instant alerts on your phone</li>
                        <li>🔔 Get notified about new student inquiries immediately</li>
                        <li>⚡ Limited to 3 WhatsApp messages per hour</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] text-white rounded-xl"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </OwnerLayout>
  );
}