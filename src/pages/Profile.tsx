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
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const isMobile = useIsMobile();
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [ownerData, setOwnerData] = useState<any>(null);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [whatsappLanguage, setWhatsappLanguage] = useState('EN');
  const navigate = useNavigate();
  const { toast } = useToast();

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
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        setProfilePhotoUrl(owner?.profile_photo_url || null);
        if (owner) {
          setOwnerData(owner);
          setNotifyEmail(owner.notify_email ?? true);
          setNotifyWhatsapp(owner.notify_whatsapp ?? true);
          setWhatsappLanguage(owner.whatsapp_language || 'EN');
        }
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

  const handleSaveNotifications = async () => {
    if (!ownerData) return;
    setSavingNotifications(true);
    try {
      const { error } = await supabase
        .from('owners')
        .update({
          notify_email: notifyEmail,
          notify_whatsapp: notifyWhatsapp,
          whatsapp_language: whatsappLanguage,
        })
        .eq('id', ownerData.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Notification settings updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setSavingNotifications(false);
    }
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
          <>
            <OwnerProfileForm 
              userId={userId}
            />

            {/* Email Notifications Section - Owners Only */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="max-w-2xl mx-auto mt-6"
            >
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

                      {notifyWhatsapp && (
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

                  <Button
                    onClick={handleSaveNotifications}
                    disabled={savingNotifications}
                    className="w-full bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] text-white rounded-xl"
                  >
                    {savingNotifications ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Notification Settings'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
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
