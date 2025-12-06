import { Menu, X, Bell, MessageSquare, Info, Phone, LogOut, User, Settings, Home, Building2, Brain } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { useRoleGuard } from '@/hooks/useRoleGuard';

interface AdminNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function AdminNavbar({ sidebarOpen, onToggleSidebar }: AdminNavbarProps) {
  const navigate = useNavigate();
  const { userId, role } = useRoleGuard('admin');
  const { count: unreadMessages } = useUnreadMessagesCount(userId, role);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  // Full site navigation items (same as main landing page)
  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Building2, label: 'Dorms', href: '/listings' },
    { icon: MessageSquare, label: 'Messages', href: '/messages', badge: unreadMessages },
    { icon: Brain, label: 'AI Match', href: '/ai-match' },
    { icon: Info, label: 'About', href: '/about' },
    { icon: Phone, label: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-[70px] bg-background/95 backdrop-blur-md border-b border-border/40 z-50 px-6">
      <div className="h-full flex items-center gap-4">
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className={cn(
            "transition-all duration-200 active:scale-95",
            "md:rounded-xl md:hover:bg-muted md:shadow-md md:w-10 md:h-10",
            "rounded-full w-12 h-12 bg-muted/50 backdrop-blur-md shadow-lg md:bg-transparent md:backdrop-blur-none md:shadow-md"
          )}
        >
          {sidebarOpen ? (
            <X className="w-5 h-5 transition-transform duration-200" />
          ) : (
            <Menu className="w-5 h-5 transition-transform duration-200" />
          )}
        </Button>

        {/* Logo */}
        <Link to="/admin" className="flex items-center gap-2">
          <img 
            src="/roomy-logo.png" 
            alt="Roomy" 
            className="h-8 w-auto"
          />
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-rose-500 to-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full relative"
            onClick={() => navigate('/admin/notifications')}
          >
            <Bell className="w-5 h-5" />
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-rose-500 to-purple-600 text-white text-sm">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              
              {/* Mobile-only nav items */}
              <div className="md:hidden">
                <DropdownMenuSeparator />
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.label} onClick={() => navigate(item.href)}>
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto w-5 h-5 bg-gradient-to-r from-rose-500 to-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
