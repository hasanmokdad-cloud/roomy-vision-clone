import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Shield, Mail, Key, LogOut, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { StudentProfile } from '../ProfileHub';

interface AccountSecurityCardProps {
  profile: StudentProfile | null;
  userId: string;
  onSignOut: () => void;
}

export function AccountSecurityCard({ profile, userId, onSignOut }: AccountSecurityCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const maskEmail = (email: string | null) => {
    if (!email) return 'Not set';
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    return `${local[0]}***@${domain}`;
  };

  return (
    <>
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
        {/* Collapsed Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between active:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <span className="font-semibold text-foreground">Account & Security</span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Collapsed Summary */}
        {!isExpanded && (
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Mail className="w-3 h-3 mr-1" />
              {maskEmail(profile?.email)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Student
            </Badge>
            {profile?.email_verified && (
              <Badge variant="default" className="text-xs bg-green-500/20 text-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        )}

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-border/30"
            >
              <div className="p-4 space-y-4">
                {/* Email Section */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Email & Identity</h4>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{profile?.email || 'Not set'}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.email_verified ? 'Email verified' : 'Email not verified'}
                        </p>
                      </div>
                    </div>
                    {profile?.email_verified && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>

                {/* Password & Security */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Password & Security</h4>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/settings/security')}
                    className="w-full justify-start"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Change password
                  </Button>
                </div>

                {/* Sign Out */}
                <Button
                  variant="outline"
                  onClick={() => setShowSignOutConfirm(true)}
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </Button>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-border/30">
                  <h4 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h4>
                  <Button
                    variant="outline"
                    disabled
                    className="w-full justify-start text-muted-foreground cursor-not-allowed opacity-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete account (coming soon)
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sign Out Confirmation */}
      <AlertDialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onSignOut}>Sign out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
