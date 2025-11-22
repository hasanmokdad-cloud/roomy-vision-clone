import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Bell, Globe, Brain, Save, Trash2, Lock, Heart, CheckCircle, XCircle, Shield, Key } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import { settingsManager, type UserSettings } from '@/utils/settings';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading, userId } = useAuthGuard();
  const { role } = useRoleGuard();
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>(settingsManager.load());
  const [saving, setSaving] = useState(false);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && userId) {
      settingsManager.loadFromSupabase(userId).then((loadedSettings) => {
        setSettings(loadedSettings);
      });

      // Load saved items
      supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .then(({ data }) => setSavedItems(data || []));

      // Check verification status
      supabase.auth.getUser().then(({ data: { user } }) => {
        setEmailVerified(!!user?.email_confirmed_at);
      });

      supabase
        .from('students')
        .select('phone_verified, profile_photo_url')
        .eq('user_id', userId)
        .maybeSingle()
        .then(({ data }) => {
          setPhoneVerified(data?.phone_verified || false);
          setProfilePhotoUrl(data?.profile_photo_url || null);
        });
    }
  }, [loading, userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      settingsManager.save(settings);
      await settingsManager.syncWithSupabase(userId || undefined);
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setSettings((prev) => ({ ...prev, theme: newTheme }));
    toast({
      title: `${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`,
      description: 'Your theme preference has been saved.',
    });
  };

  const handleClearAIMemory = async () => {
    if (!userId) return;
    
    try {
      await fetch('/api/reset-ai-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      toast({
        title: 'AI Memory Cleared',
        description: 'Your AI preferences have been reset.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear AI memory.',
        variant: 'destructive',
      });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });
      
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEnable2FA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });
      
      if (error) throw error;
      
      setQrCode(data.totp.qr_code);
      setFactorId(data.id);
      setShow2FASetup(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-[#0F1624] to-[#15203B]">
      <Navbar />

      <div className="container mx-auto px-6 py-32 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-white/70 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-2 gradient-text">Settings</h1>
          <p className="text-white/60 mb-8">Manage your account preferences and personalization</p>

          <div className="space-y-6">
            {/* Profile Photo (Students Only) */}
            {role === 'student' && userId && (
              <Card className="glass p-6 border-white/20">
                <h3 className="text-lg font-semibold text-foreground mb-4">Profile Photo</h3>
                <ProfilePhotoUpload
                  userId={userId}
                  currentUrl={profilePhotoUrl}
                  onUploaded={(url) => setProfilePhotoUrl(url)}
                />
              </Card>
            )}

            {/* Theme */}
            <Card className="glass p-6 border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    key={theme}
                    initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
                  >
                    {theme === 'dark' ? (
                      <Moon className="w-5 h-5 text-primary" />
                    ) : (
                      <Sun className="w-5 h-5 text-primary" />
                    )}
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Theme</h3>
                    <p className="text-sm text-muted-foreground">
                      Current: {theme === 'dark' ? 'Dark' : 'Light'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={handleThemeToggle}
                />
              </div>
            </Card>

            {/* Notifications */}
            <Card className="glass p-6 border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Bell className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Notifications</h3>
                    <p className="text-sm text-white/60">
                      {role === 'owner' ? 'Receive updates about new bookings and inquiries' : 
                       role === 'admin' ? 'Receive platform-wide updates and alerts' :
                       'Receive updates about new dorms'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, notifications: checked }))
                  }
                />
              </div>
            </Card>

            {/* Saved / Favorites - Only show for students */}
            {role === 'student' && (
              <Card className="glass p-6 border-white/20">
                <div className="flex items-center gap-4 mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Saved Dorms</h3>
                    <p className="text-sm text-white/60">
                      {savedItems.length} {savedItems.length === 1 ? 'item' : 'items'} saved
                    </p>
                  </div>
                </div>
                 <Button
                   variant="outline"
                   className="w-full"
                   onClick={() => navigate('/profile')}
                 >
                   View Saved Items
                 </Button>
               </Card>
             )}

            {/* Password & Security */}
            <Card className="glass p-6 border-white/20">
              <div className="flex items-center gap-4 mb-6">
                <Lock className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Password & Security</h3>
                  <p className="text-sm text-white/60">Manage your account security</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    {emailVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-white">Email Verification</span>
                  </div>
                  <Badge variant={emailVerified ? "default" : "destructive"}>
                    {emailVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>

                  <p className="text-sm text-white/60">
                    Owners should contact Roomy support for dorm assignment
                  </p>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change Password
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleEnable2FA}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Enable 2FA
                </Button>
              </div>
            </Card>

            {/* Keep Signed In (Mobile) */}
            {isMobile && (
              <Card className="glass p-6 border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Keep me signed in</h3>
                    <p className="text-sm text-white/60">Stay logged in on this device</p>
                  </div>
                  <Switch
                    checked={keepSignedIn}
                    onCheckedChange={setKeepSignedIn}
                  />
                </div>
              </Card>
            )}
            <Card className="glass p-6 border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Globe className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Language</h3>
                    <p className="text-sm text-white/60">
                      Current: {settings.language.toUpperCase()}
                    </p>
                  </div>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      language: e.target.value as 'en' | 'ar' | 'fr',
                    }))
                  }
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white backdrop-blur-md"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </Card>

            {/* AI Memory */}
            <Card className="glass p-6 border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Brain className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">AI Memory</h3>
                    <p className="text-sm text-white/60">
                      Allow AI to remember your preferences
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.aiMemory}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, aiMemory: checked }))
                  }
                />
              </div>
              {settings.aiMemory && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <Button
                    onClick={handleClearAIMemory}
                    variant="outline"
                    size="sm"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear AI Memory
                  </Button>
                </div>
              )}
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="border-white/20 text-white/70 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className="gradient-text">Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password" className="text-white">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="bg-black/20 border-white/10"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-white">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-black/20 border-white/10"
              />
            </div>
            <Button 
              onClick={handleChangePassword} 
              className="w-full bg-gradient-to-r from-primary to-secondary"
            >
              Update Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Modal */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className="gradient-text">Enable Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-white/70">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
            <Button 
              onClick={() => {
                setShow2FASetup(false);
                toast({
                  title: 'Success',
                  description: '2FA has been enabled for your account',
                });
              }}
              className="w-full bg-gradient-to-r from-primary to-secondary"
            >
              I've Scanned the Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isMobile && <BottomNav />}
      <Footer />
    </div>
  );
}
