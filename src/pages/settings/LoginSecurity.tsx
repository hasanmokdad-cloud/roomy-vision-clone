import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Key, Shield, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MobileMenuRow } from '@/components/mobile/MobileMenuRow';
import BottomNav from '@/components/BottomNav';
import { SwipeableSubPage } from '@/components/mobile/SwipeableSubPage';
import { useIsMobile } from '@/hooks/use-mobile';

export default function LoginSecurity() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [factorId, setFactorId] = useState('');

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

  const handleVerify2FA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Two-factor authentication enabled successfully',
      });
      
      setShow2FASetup(false);
      setQrCode('');
      setVerifyCode('');
      setFactorId('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isMobile = useIsMobile();

  return (
    <SwipeableSubPage enabled={isMobile}>
    <div className="min-h-screen bg-background">
      <div className="pt-6 px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center active:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">Login & security</h1>
          </div>

          {/* Security Options */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Login
              </h2>
              <div className="divide-y divide-border/20">
                <MobileMenuRow
                  icon={<Key className="w-6 h-6" />}
                  label="Change password"
                  subtitle="Update your password"
                  onClick={() => setShowPasswordModal(true)}
                />
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Security
              </h2>
              <div className="divide-y divide-border/20">
                <MobileMenuRow
                  icon={<Shield className="w-6 h-6" />}
                  label="Two-factor authentication"
                  subtitle="Add an extra layer of security"
                  onClick={handleEnable2FA}
                />
                <MobileMenuRow
                  icon={<Smartphone className="w-6 h-6" />}
                  label="Trusted devices"
                  subtitle="Manage devices that can access your account"
                  onClick={() => navigate('/settings/devices')}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Password Change Drawer */}
      <Drawer open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Change Password</DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-6 space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-1"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button 
              onClick={handleChangePassword} 
              className="w-full"
            >
              Update Password
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* 2FA Setup Modal */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border border-border/40">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-xl">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
            <div>
              <Label htmlFor="verify-code">Verification Code</Label>
              <Input
                id="verify-code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleVerify2FA}
              className="w-full"
              disabled={verifyCode.length !== 6}
            >
              Verify and Enable
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
    </SwipeableSubPage>
  );
}
