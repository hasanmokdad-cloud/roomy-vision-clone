import { useState, useEffect } from 'react';
import { Menu, X, MessageSquare, Info, Phone, LogOut, User, Settings, Building2, Globe } from 'lucide-react';
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
import { AdminNotificationBell } from '@/components/admin/AdminNotificationBell';
import { supabase } from '@/integrations/supabase/client';
import { LanguageModal } from '@/components/LanguageModal';

interface AdminNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function AdminNavbar({ sidebarOpen, onToggleSidebar }: AdminNavbarProps) {
  const navigate = useNavigate();
  const { userId, role, signOut } = useAuth();
  const { count: unreadMessages } = useUnreadMessagesCount(userId, role);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);

  // Fetch admin record ID for notifications
  useEffect(() => {
    const fetchAdminId = async () => {
      if (!userId) return;
      
      const { data } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        setAdminId(data.id);
      }
    };

    fetchAdminId();
  }, [userId]);

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

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Admin Notification Bell (admin-specific notifications) */}
          {adminId && (
            <AdminNotificationBell adminId={adminId} />
          )}

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
              <DropdownMenuItem onClick={() => navigate('/messages')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
                {unreadMessages > 0 && (
                  <span className="ml-auto w-5 h-5 bg-gradient-to-r from-rose-500 to-purple-600 text-white text-xs rounded-full flex items-center justify-center">
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
              <DropdownMenuItem onClick={() => navigate('/listings')}>
                <Building2 className="w-4 h-4 mr-2" />
                Dorms
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguageModalOpen(true)}>
                <Globe className="w-4 h-4 mr-2" />
                Language
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

      <LanguageModal open={languageModalOpen} onOpenChange={setLanguageModalOpen} />
    </nav>
  );
}
