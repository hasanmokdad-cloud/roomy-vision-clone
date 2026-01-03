import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, MessageCircle, Globe, User, Settings, LogOut, Building2, Shield, Sparkles, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { LanguageModal } from '@/components/LanguageModal';
import RoomyLogo from '@/assets/roomy-logo.png';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { NotificationBellPopover } from '@/components/shared/NotificationBellPopover';

export function RoomyNavbar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthReady, user, role, isAuthenticated, signOut, openAuthModal } = useAuth();
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  
  const { count: unreadCount } = useUnreadMessagesCount(user?.id, role || undefined);

  // Fetch user's full_name based on role
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user?.id || !role) return;
      
      if (role === 'student') {
        const { data } = await supabase
          .from('students')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        setUserName(data?.full_name || null);
      } else if (role === 'owner') {
        const { data } = await supabase
          .from('owners')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        setUserName(data?.full_name || null);
      } else if (role === 'admin') {
        const { data } = await supabase
          .from('admins')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        setUserName(data?.full_name || null);
      }
    };
    
    fetchUserName();
  }, [user?.id, role]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await signOut();
  };

  const handleBecomeOwner = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect_url=%2Fbecome-owner');
    } else {
      navigate('/become-owner');
    }
  };

  return (
    <>
      <nav className="w-full bg-white border-b border-[#DDDDDD]">
        <div className="max-w-[1760px] mx-auto px-6 md:px-10 lg:px-20">
          <div className="flex items-center justify-between h-20">
            {/* Logo - navigates based on role */}
            <Link 
              to={role === 'owner' ? '/owner' : role === 'admin' ? '/admin' : '/listings'} 
              className="flex items-center gap-2 shrink-0"
            >
              <img 
                src={RoomyLogo} 
                alt="Roomy" 
                className="w-8 h-8 md:w-10 md:h-10 rounded-xl"
              />
              <span 
                className="text-xl md:text-[22px] font-semibold text-[#FF385C] hidden sm:block"
                style={{ fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif' }}
              >
                Roomy
              </span>
            </Link>

            {/* Right side actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Become an Owner - hide for owners/admins */}
              {isAuthReady && role !== 'owner' && role !== 'admin' && (
                <Button
                  variant="ghost"
                  onClick={handleBecomeOwner}
                  className="hidden md:flex text-sm font-medium text-[#222222] hover:bg-[#F7F7F7] rounded-full px-4 h-10"
                >
                  {t('navbar.becomeOwner', 'Become an Owner')}
                </Button>
              )}

              {/* Messages - only show when logged in */}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/messages')}
                  className="relative rounded-full hover:bg-[#F7F7F7] w-10 h-10"
                >
                  <MessageCircle className="w-5 h-5 text-[#222222]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#FF385C] text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              )}

              {/* Notification Bell - only show when logged in */}
              {isAuthenticated && user?.id && (
                <NotificationBellPopover 
                  userId={user.id} 
                  tableType="user" 
                  variant="default"
                />
              )}

              {/* Hamburger Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-3 rounded-full px-2 py-1.5 h-auto border-[#DDDDDD] hover:shadow-md transition-shadow bg-white ml-2"
                  >
                    <Menu className="w-4 h-4 text-[#222222] ml-1" />
                    <div className="w-8 h-8 rounded-full bg-[#717171] flex items-center justify-center">
                      {isAuthenticated ? (
                        <span className="text-sm font-medium text-white">
                          {userName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-white border border-[#DDDDDD] shadow-[0_2px_16px_rgba(0,0,0,0.12)] rounded-xl p-1 mt-2"
              >
                {!isAuthenticated ? (
                  // Not logged in menu
                  <>
                    <DropdownMenuItem
                      onClick={() => navigate('/contact')}
                      className="cursor-pointer rounded-lg py-3"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {t('navbar.contact', 'Contact')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={openAuthModal}
                      className="font-semibold cursor-pointer rounded-lg py-3"
                    >
                      {t('navbar.loginOrSignup', 'Log in or sign up')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setLanguageModalOpen(true)}
                      className="cursor-pointer rounded-lg py-3"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      {t('navbar.language', 'Language')}
                    </DropdownMenuItem>
                  </>
                ) : (
                  // Logged in menu
                  <>
                    <DropdownMenuItem
                      onClick={() => navigate('/profile')}
                      className="cursor-pointer rounded-lg py-3"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {t('navbar.myProfile', 'My Profile')}
                    </DropdownMenuItem>
                    
                    {/* AI Match - only for confirmed students */}
                    {role === 'student' && (
                      <DropdownMenuItem
                        onClick={() => navigate('/ai-match')}
                        className="cursor-pointer rounded-lg py-3"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t('navbar.aiMatch', 'AI Match')}
                      </DropdownMenuItem>
                    )}
                    
                    {/* Control Panel for owners */}
                    {role === 'owner' && (
                      <DropdownMenuItem
                        onClick={() => navigate('/owner')}
                        className="cursor-pointer rounded-lg py-3"
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        {t('navbar.controlPanel', 'Control Panel')}
                      </DropdownMenuItem>
                    )}
                    
                    {/* Control Panel for admins */}
                    {role === 'admin' && (
                      <DropdownMenuItem
                        onClick={() => navigate('/admin')}
                        className="cursor-pointer rounded-lg py-3"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {t('navbar.controlPanel', 'Control Panel')}
                      </DropdownMenuItem>
                    )}
                    
                    {/* Contact - show for all authenticated users */}
                    <DropdownMenuItem
                      onClick={() => navigate('/contact')}
                      className="cursor-pointer rounded-lg py-3"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {t('navbar.contact', 'Contact')}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      onClick={() => navigate('/settings')}
                      className="cursor-pointer rounded-lg py-3"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {t('navbar.settings', 'Settings')}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={() => setLanguageModalOpen(true)}
                      className="cursor-pointer rounded-lg py-3"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      {t('navbar.language', 'Language')}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="cursor-pointer rounded-lg py-3 text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {signingOut ? t('navbar.signingOut', 'Signing out...') : t('navbar.signOut', 'Sign out')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <LanguageModal 
        open={languageModalOpen} 
        onOpenChange={setLanguageModalOpen} 
      />
    </>
  );
}
