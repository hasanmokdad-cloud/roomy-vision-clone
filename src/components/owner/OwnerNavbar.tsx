import { Menu, X, Bell, MessageSquare, Info, Phone, LogOut, User, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { useAuth } from '@/contexts/AuthContext';

interface OwnerNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function OwnerNavbar({ sidebarOpen, onToggleSidebar }: OwnerNavbarProps) {
  const navigate = useNavigate();
  const { userId, role, signOut } = useAuth();
  const { count: unreadMessages } = useUnreadMessagesCount(userId, role);

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { icon: MessageSquare, label: 'Messages', href: '/messages', badge: unreadMessages },
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
            "md:rounded-xl md:hover:bg-white/10 md:shadow-md md:w-10 md:h-10",
            "rounded-full w-12 h-12 bg-white/5 backdrop-blur-md shadow-lg md:bg-transparent md:backdrop-blur-none md:shadow-md"
          )}
        >
          {sidebarOpen ? (
            <X className="w-5 h-5 transition-transform duration-200" />
          ) : (
            <Menu className="w-5 h-5 transition-transform duration-200" />
          )}
        </Button>

        {/* Logo */}
        <Link to="/owner" className="flex items-center gap-2">
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
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:bg-[#f6f4ff] hover:text-foreground transition-all"
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] text-white text-xs rounded-full flex items-center justify-center">
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
          >
            <Bell className="w-5 h-5" />
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-[#6D5BFF] to-[#9A6AFF] text-white text-sm">
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
                      <span className="ml-auto w-5 h-5 bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] text-white text-xs rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
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
