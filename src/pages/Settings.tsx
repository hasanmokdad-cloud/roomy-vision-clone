import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Bell, Globe, Brain, Save, Trash2, Lock, Heart, CheckCircle, XCircle, Shield, Key, Home, Share2, Copy } from 'lucide-react';
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

import { useTranslation } from 'react-i18next';

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading, userId } = useAuthGuard();
  const { role } = useRoleGuard();
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const [settings, setSettings] = useState<UserSettings>(settingsManager.load());
  const [saving, setSaving] = useState(false);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [savedRooms, setSavedRooms] = useState<any[]>([]);
  const [sharedCollections, setSharedCollections] = useState<any[]>([]);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [factorId, setFactorId] = useState('');
  

  useEffect(() => {
    if (!loading && userId) {
      settingsManager.loadFromSupabase(userId).then((loadedSettings) => {
        setSettings(loadedSettings);
      });

      // Load saved items (dorms)
      supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .then(({ data }) => setSavedItems(data || []));

      // Load saved rooms
      supabase
        .from('saved_rooms')
        .select('*')
        .eq('user_id', userId)
        .then(({ data }) => setSavedRooms(data || []));

      // Load shared collections
      supabase
        .from('shared_collections')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .then(({ data }) => setSharedCollections(data || []));

      // Check verification status
      supabase.auth.getUser().then(({ data: { user } }) => {
        setEmailVerified(!!user?.email_confirmed_at);
      });

      // Load phone verification based on role
      if (role === 'student') {
        supabase
          .from('students')
          .select('phone_verified')
          .eq('user_id', userId)
          .maybeSingle()
          .then(({ data }) => {
            setPhoneVerified(data?.phone_verified || false);
          });
      } else if (role === 'owner') {
        supabase
          .from('owners')
          .select('phone_verified')
          .eq('user_id', userId)
          .maybeSingle()
          .then(({ data }) => {
            setPhoneVerified(data?.phone_verified || false);
          });
      } else if (role === 'admin') {
        supabase
          .from('admins')
          .select('phone_verified')
          .eq('user_id', userId)
          .maybeSingle()
          .then(({ data }) => {
            setPhoneVerified(data?.phone_verified || false);
          });
      }
    }
  }, [loading, userId, role]);

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
    <div className="min-h-screen relative bg-gradient-to-b from-background to-muted/20">
      {!isMobile && <Navbar />}

      <div className="container mx-auto px-6 py-32 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => {
            if (role === 'admin') navigate('/admin');
            else if (role === 'owner') navigate('/owner');
            else navigate('/listings');
          }}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {(role === 'admin' || role === 'owner') ? 'Back to Control Panel' : 'Back to Dorms'}
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-2 gradient-text">Settings</h1>
          <p className="text-foreground/60 mb-8">Manage your account preferences and personalization</p>

        <div className="space-y-6">
          {/* Theme */}
            <Card className="glass p-6 border border-border/40">
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
            <Card className="glass p-6 border border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Bell className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
                    <p className="text-sm text-foreground/60">
                      {role === 'owner' 
                        ? (currentLang === 'ar' 
                            ? 'استقبل إشعارات عن الحجوزات الجديدة' 
                            : 'Receive updates about new bookings')
                        : (currentLang === 'ar'
                            ? 'استقبل إشعارات عن السكن الجديد'
                            : 'Receive updates about new dorms')}
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

            {/* Saved Items - For students and admins */}
            {(role === 'student' || role === 'admin') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Saved Dorms */}
                <Card className="glass p-6 border border-border/40">
                  <div className="flex items-center gap-4 mb-4">
                    <Heart className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Saved Dorms</h3>
                      <p className="text-sm text-foreground/60">
                        {savedItems.length} {savedItems.length === 1 ? 'dorm' : 'dorms'} saved
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/saved-dorms')}
                  >
                    View Saved Dorms
                  </Button>
                </Card>

                {/* Saved Rooms */}
                <Card className="glass p-6 border border-border/40">
                  <div className="flex items-center gap-4 mb-4">
                    <Home className="w-6 h-6 text-secondary" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Saved Rooms</h3>
                      <p className="text-sm text-foreground/60">
                        {savedRooms.length} {savedRooms.length === 1 ? 'room' : 'rooms'} saved
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/saved-rooms')}
                  >
                    View Saved Rooms
                  </Button>
                </Card>

                {/* Shared Collections */}
                <Card className="glass p-6 border border-border/40">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Share2 className="w-6 h-6 text-accent" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Shared Collections</h3>
                        <p className="text-sm text-foreground/60">
                          Manage your shareable room collections
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {sharedCollections.length === 0 ? (
                    <p className="text-foreground/50 text-sm mb-4">
                      No shared collections yet. Share your saved rooms to create one!
                    </p>
                  ) : (
                    <div className="space-y-3 mb-4">
                      {sharedCollections.map((collection: any) => (
                        <div key={collection.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                          <div className="flex-1">
                            <p className="text-foreground font-medium">{collection.title || 'Untitled Collection'}</p>
                            <p className="text-foreground/50 text-xs">
                              {collection.view_count} views • Created {new Date(collection.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/shared/${collection.share_code}`);
                              toast({ title: 'Link copied!' });
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/saved-rooms')}
                  >
                    Go to Saved Rooms
                  </Button>
                </Card>
              </div>
            )}

            {/* Password & Security */}
            <Card className="glass p-6 border border-border/40">
              <div className="flex items-center gap-4 mb-6">
                <Lock className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Password & Security</h3>
                  <p className="text-sm text-foreground/60">Manage your account security</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div className="flex items-center gap-3">
                    {emailVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-foreground">Email Verification</span>
                  </div>
                  <Badge variant={emailVerified ? "default" : "destructive"}>
                    {emailVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>

                  <p className="text-sm text-foreground/60">
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
              <Card className="glass p-6 border border-border/40">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Keep me signed in</h3>
                    <p className="text-sm text-foreground/60">Stay logged in on this device</p>
                  </div>
                  <Switch
                    checked={keepSignedIn}
                    onCheckedChange={setKeepSignedIn}
                  />
                </div>
              </Card>
            )}
            <Card className="glass p-6 border border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Globe className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Language</h3>
                    <p className="text-sm text-foreground/60">
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
                  className="bg-muted/10 border border-border/40 rounded-lg px-4 py-2 text-foreground backdrop-blur-md"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </Card>

            {/* AI Memory */}
            <Card className="glass p-6 border border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Brain className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">AI Memory</h3>
                    <p className="text-sm text-foreground/60">
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
                <div className="mt-4 pt-4 border-t border-border/10">
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
                onClick={() => navigate(role === 'student' ? '/listings' : '/dashboard')}
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
        <DialogContent className="bg-card/95 backdrop-blur-xl border border-border/40">
          <DialogHeader>
            <DialogTitle className="gradient-text">Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password" className="text-foreground">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="bg-muted/20 border-border/40"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-foreground">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-muted/20 border-border/40"
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
        <DialogContent className="bg-card/95 backdrop-blur-xl border border-border/40">
          <DialogHeader>
            <DialogTitle className="gradient-text">Enable Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-foreground/70">
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
