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
              <DropdownMenuItem onClick={() => navigate('/messages')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
                {unreadMessages > 0 && (
                  <span className="ml-auto w-5 h-5 bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] text-white text-xs rounded-full flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/about')}>
                <Info className="w-4 h-4 mr-2" />
                About
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/contact')}>
                <Phone className="w-4 h-4 mr-2" />
                Contact
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
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
