import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Edit, Settings, LayoutDashboard, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface MobileProfileMenuProps {
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
  userEmail?: string;
}

export function MobileProfileMenu({ open, onClose, onSignOut, userEmail }: MobileProfileMenuProps) {
  const menuItems = [
    { icon: User, label: 'My Profile', href: '/profile' },
    { icon: Edit, label: 'Edit Profile', href: '/profile' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-background/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl"
          >
            <div className="px-6 py-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Profile Menu</h2>
                  {userEmail && (
                    <p className="text-sm text-muted-foreground mt-1">{userEmail}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Menu Items */}
              <div className="space-y-2 mb-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>

              <Separator className="my-4 bg-white/10" />

              {/* Sign Out */}
              <Button
                variant="ghost"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>

              {/* Safe area spacer for iOS */}
              <div className="h-8" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
