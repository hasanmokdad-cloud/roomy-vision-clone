import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Bell,
  Wallet,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccountSettingsSectionProps {
  onSignOut: () => void;
}

const menuItems = [
  {
    icon: User,
    label: 'Personal Info',
    subtitle: 'Name, email, phone',
    path: '/settings/personal-info',
  },
  {
    icon: Shield,
    label: 'Login & Security',
    subtitle: 'Password, devices',
    path: '/settings/security',
  },
  {
    icon: Bell,
    label: 'Notifications',
    subtitle: 'Push, email alerts',
    path: '/settings/notifications',
  },
  {
    icon: Wallet,
    label: 'Payments & Payouts',
    subtitle: 'Cards, history',
    path: '/wallet',
  },
  {
    icon: FileText,
    label: 'Legal',
    subtitle: 'Terms, privacy',
    path: '/legal',
  },
  {
    icon: HelpCircle,
    label: 'Help & Support',
    subtitle: 'Contact us',
    path: '/contact',
  },
];

export function AccountSettingsSection({ onSignOut }: AccountSettingsSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-foreground text-sm px-1">Account & Settings</h3>

      <div className="bg-card rounded-2xl border border-border/40 overflow-hidden divide-y divide-border/30">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center">
              <item.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <Button
        variant="ghost"
        onClick={onSignOut}
        className="w-full mt-4 text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 justify-start"
      >
        <LogOut className="w-4 h-4" />
        Log out
      </Button>
    </div>
  );
}
