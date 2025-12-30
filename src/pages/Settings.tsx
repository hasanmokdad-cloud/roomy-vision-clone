import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Moon, Sun, Bell, Brain, Trash2, Lock, Heart, 
  CheckCircle, XCircle, Shield, Home, Share2, Copy, CreditCard, 
  Receipt, Smartphone, User, Palette, Ban 
} from 'lucide-react';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import { SubPageHeader } from '@/components/mobile/SubPageHeader';
import { SwipeableSubPage } from '@/components/mobile/SwipeableSubPage';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
import { MobileMenuRow } from '@/components/mobile/MobileMenuRow';
import { LanguageModal } from '@/components/LanguageModal';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsFooter } from '@/components/settings/SettingsFooter';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { loading, userId } = useAuthGuard();
  const { role } = useRoleGuard();
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const { isSubscribed, subscribe, unsubscribe, loading: pushLoading } = usePushNotifications();
  const currentLang = i18n.language;
  const [settings, setSettings] = useState<UserSettings>(settingsManager.load());
  const [saving, setSaving] = useState(false);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [savedRooms, setSavedRooms] = useState<any[]>([]);
  const [sharedCollections, setSharedCollections] = useState<any[]>([]);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProfile, setPaymentProfile] = useState<any>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    if (!loading && userId) {
      settingsManager.loadFromSupabase(userId).then((loadedSettings) => {
        setSettings(loadedSettings);
      });

      supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .then(({ data }) => setSavedItems(data || []));

      supabase
        .from('saved_rooms')
        .select('*')
        .eq('user_id', userId)
        .then(({ data }) => setSavedRooms(data || []));

      supabase
        .from('shared_collections')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .then(({ data }) => setSharedCollections(data || []));

      supabase.auth.getUser().then(({ data: { user } }) => {
        setEmailVerified(!!user?.email_confirmed_at);
      });

      supabase
        .from('user_payment_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
        .then(({ data }) => setPaymentProfile(data));

      const navState = location.state as { openPaymentModal?: boolean } | null;
      if (navState?.openPaymentModal) {
        setShowPaymentModal(true);
      }
    }
  }, [loading, userId, role, location]);

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

  const handleThemeToggle = (checked?: boolean) => {
    const newTheme = checked !== undefined ? (checked ? 'dark' : 'light') : (theme === 'dark' ? 'light' : 'dark');
    setTheme(newTheme);
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

  const handleCancel = () => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'owner') navigate('/owner');
    else navigate('/listings');
  };

  if (loading) return null;

  // Mobile layout
  if (isMobile) {
    return (
      <SwipeableSubPage>
        <div className="min-h-screen bg-background">
          <SubPageHeader title="Account settings" onBack={() => navigate('/profile')} />
          <div className="pt-20 px-6 pb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="space-y-6">
                {/* Account Section */}
                <div>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-0">
                    Account
                  </h2>
                  <div className="divide-y divide-border/20">
                    <MobileMenuRow
                      icon={<User className="w-6 h-6" />}
                      label="Personal information"
                      subtitle="Edit your profile details"
                      onClick={() => navigate('/settings/personal-info')}
                    />
                    <MobileMenuRow
                      icon={<Lock className="w-6 h-6" />}
                      label="Login & security"
                      subtitle="Password, 2FA, devices"
                      onClick={() => navigate('/settings/security')}
                    />
                  </div>
                </div>

                {/* Payments - Only for students */}
                {role === 'student' && (
                  <div>
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-0">
                      Payments
                    </h2>
                    <div className="divide-y divide-border/20">
                      <MobileMenuRow
                        icon={<CreditCard className="w-6 h-6" />}
                        label="My Wallet"
                        subtitle="Manage your payment methods"
                        onClick={() => navigate('/wallet')}
                      />
                      <MobileMenuRow
                        icon={<Receipt className="w-6 h-6" />}
                        label="Billing history"
                        onClick={() => navigate('/billing-history')}
                      />
                      <MobileMenuRow
                        icon={<Home className="w-6 h-6" />}
                        label="Room reservations"
                        onClick={() => navigate('/student/payments')}
                      />
                    </div>
                  </div>
                )}

                {/* Preferences */}
                <div>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-0">
                    Preferences
                  </h2>
                  <div className="divide-y divide-border/20">
                    <MobileMenuRow
                      icon={<Bell className="w-6 h-6" />}
                      label="Notifications"
                      subtitle={isSubscribed ? 'Enabled' : 'Manage'}
                      onClick={() => navigate('/settings/notifications')}
                    />
                    <MobileMenuRow
                      icon={<Palette className="w-6 h-6" />}
                      label="Appearance"
                      subtitle={theme === 'dark' ? 'Dark mode' : 'Light mode'}
                      onClick={() => handleThemeToggle()}
                      showChevron={false}
                      rightElement={
                        <Switch
                          checked={theme === 'dark'}
                          onCheckedChange={(checked) => handleThemeToggle(checked)}
                        />
                      }
                    />
                  </div>
                </div>

                {/* AI Memory - Only for students and admins */}
                {role !== 'owner' && (
                  <div>
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-0">
                      AI
                    </h2>
                    <div className="divide-y divide-border/20">
                      <MobileMenuRow
                        icon={<Brain className="w-6 h-6" />}
                        label="AI Memory"
                        subtitle="Remember your preferences"
                        onClick={() => {
                          setSettings(prev => ({ ...prev, aiMemory: !prev.aiMemory }));
                        }}
                        showChevron={false}
                        rightElement={
                          <Switch
                            checked={settings.aiMemory}
                            onCheckedChange={(checked) => {
                              setSettings(prev => ({ ...prev, aiMemory: checked }));
                            }}
                          />
                        }
                      />
                      {settings.aiMemory && (
                        <MobileMenuRow
                          icon={<Trash2 className="w-6 h-6" />}
                          label="Clear AI memory"
                          onClick={handleClearAIMemory}
                          destructive
                          showChevron={false}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* App Info */}
                <div className="pt-8 text-center">
                  <p className="text-sm text-muted-foreground">Version 1.0.0</p>
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

          <LanguageModal open={showLanguageModal} onOpenChange={setShowLanguageModal} />
        </div>
      </SwipeableSubPage>
    );
  }

  // Desktop layout - Clean flat list design
  return (
    <div className="min-h-screen bg-background">
      <RoomyNavbar />

      <div className="container mx-auto px-6 py-32 pb-40 max-w-3xl">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {(role === 'admin' || role === 'owner') ? 'Back to Control Panel' : 'Back to Dorms'}
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold mb-1 text-foreground">Settings</h1>
          <p className="text-muted-foreground mb-8">Manage your account preferences</p>

          <div className="space-y-8">
            {/* Account Section */}
            <SettingsSection title="Account">
              <SettingsRow
                icon={<User className="w-5 h-5" />}
                label="Personal information"
                subtitle="Name, email, phone"
                onClick={() => navigate('/settings/personal-info')}
              />
              <SettingsRow
                icon={<Lock className="w-5 h-5" />}
                label="Login & security"
                subtitle="Password, 2FA, devices"
                onClick={() => navigate('/settings/security')}
              />
              <SettingsRow
                icon={<Ban className="w-5 h-5" />}
                label="Blocked users"
                subtitle="Manage blocked accounts"
                onClick={() => navigate('/settings/blocked-users')}
              />
            </SettingsSection>

            {/* Preferences Section */}
            <SettingsSection title="Preferences">
              <SettingsRow
                icon={theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                label="Appearance"
                subtitle={theme === 'dark' ? 'Dark mode' : 'Light mode'}
                showChevron={false}
                rightElement={
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={handleThemeToggle}
                  />
                }
              />
              <SettingsRow
                icon={<Bell className="w-5 h-5" />}
                label="Push notifications"
                subtitle={
                  role === 'admin'
                    ? 'Platform activity updates'
                    : role === 'owner'
                    ? 'Bookings, tours, messages'
                    : 'Tours, messages, roommate matches'
                }
                showChevron={false}
                rightElement={
                  <Switch
                    checked={isSubscribed}
                    disabled={pushLoading}
                    onCheckedChange={async (checked) => {
                      if (checked) await subscribe();
                      else await unsubscribe();
                    }}
                  />
                }
              />
              <SettingsRow
                icon={<Bell className="w-5 h-5" />}
                label="Advanced notifications"
                subtitle="Customize notification types"
                onClick={() => navigate('/settings/notifications')}
              />
            </SettingsSection>

            {/* Payments Section - Students only */}
            {role === 'student' && (
              <SettingsSection title="Payments">
                <SettingsRow
                  icon={<CreditCard className="w-5 h-5" />}
                  label="My Wallet"
                  subtitle="Manage payment methods"
                  onClick={() => navigate('/wallet')}
                />
                <SettingsRow
                  icon={<Receipt className="w-5 h-5" />}
                  label="Billing history"
                  subtitle="View past transactions"
                  onClick={() => navigate('/billing-history')}
                />
                <SettingsRow
                  icon={<Home className="w-5 h-5" />}
                  label="Room reservations"
                  subtitle="Manage your bookings"
                  onClick={() => navigate('/student/payments')}
                />
              </SettingsSection>
            )}

            {/* Saved Items Section - Students and Admins */}
            {(role === 'student' || role === 'admin') && (
              <SettingsSection title="Saved">
                <SettingsRow
                  icon={<Heart className="w-5 h-5" />}
                  label="Saved dorms"
                  subtitle={`${savedItems.length} ${savedItems.length === 1 ? 'dorm' : 'dorms'} saved`}
                  onClick={() => navigate('/saved-dorms')}
                  badge={savedItems.length > 0 ? savedItems.length : undefined}
                />
                <SettingsRow
                  icon={<Home className="w-5 h-5" />}
                  label="Saved rooms"
                  subtitle={`${savedRooms.length} ${savedRooms.length === 1 ? 'room' : 'rooms'} saved`}
                  onClick={() => navigate('/saved-rooms')}
                  badge={savedRooms.length > 0 ? savedRooms.length : undefined}
                />
                <SettingsRow
                  icon={<Share2 className="w-5 h-5" />}
                  label="Shared collections"
                  subtitle={sharedCollections.length > 0 ? `${sharedCollections.length} collections` : 'Create shareable links'}
                  onClick={() => navigate('/saved-rooms')}
                  badge={sharedCollections.length > 0 ? sharedCollections.length : undefined}
                />
              </SettingsSection>
            )}

            {/* AI Section - Students and Admins */}
            {role !== 'owner' && (
              <SettingsSection title="AI">
                <SettingsRow
                  icon={<Brain className="w-5 h-5" />}
                  label="AI Memory"
                  subtitle="Remember your preferences"
                  showChevron={false}
                  rightElement={
                    <Switch
                      checked={settings.aiMemory}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, aiMemory: checked }))
                      }
                    />
                  }
                />
                {settings.aiMemory && (
                  <SettingsRow
                    icon={<Trash2 className="w-5 h-5" />}
                    label="Clear AI memory"
                    subtitle="Reset your AI preferences"
                    onClick={handleClearAIMemory}
                    destructive
                    showChevron={false}
                  />
                )}
              </SettingsSection>
            )}

            {/* App Version */}
            <div className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fixed Footer */}
      <SettingsFooter
        onCancel={handleCancel}
        onSave={handleSave}
        saving={saving}
      />

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

      <LanguageModal open={showLanguageModal} onOpenChange={setShowLanguageModal} />
    </div>
  );
}
