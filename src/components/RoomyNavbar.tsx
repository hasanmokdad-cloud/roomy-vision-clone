import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { cn } from '@/lib/utils';

export function RoomyNavbar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthReady, user, role, isAuthenticated, signOut, openAuthModal } = useAuth();
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await signOut();
  };

  const handleBecomeOwner = () => {
    if (!isAuthenticated) {
      // Airbnb-style redirect: go to login page with redirect_url
      navigate('/login?redirect_url=%2Fbecome-owner');
    } else {
      navigate('/become-owner');
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.6, 0.05, 0.01, 0.9] }}
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
      >
        <div
          className={cn(
            "max-w-7xl mx-auto transition-all duration-500 flex items-center justify-between relative",
            "navbar-water-glass rounded-2xl px-4 md:px-6 py-3"
          )}
        >
          {/* Water caustics overlay */}
          <div className="navbar-water-caustics" />
          
          {/* Logo - navigates based on role */}
          <Link 
            to={role === 'owner' ? '/owner' : role === 'admin' ? '/admin' : '/listings'} 
            className="flex items-center gap-2 shrink-0 relative z-10"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <img 
                src={RoomyLogo} 
                alt="Roomy" 
                className="w-9 h-9 md:w-10 md:h-10 rounded-xl"
              />
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:block">
                Roomy
              </span>
            </motion.div>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center gap-2 md:gap-3 relative z-10">
            {/* Become an Owner - hide for owners/admins */}
            {isAuthReady && role !== 'owner' && role !== 'admin' && (
              <Button
                variant="ghost"
                onClick={handleBecomeOwner}
                className="hidden md:flex text-sm font-medium hover:bg-white/10 rounded-full px-4"
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
                className="relative rounded-full hover:bg-white/10"
              >
                <MessageCircle className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            )}

            {/* Notification Bell - only show when logged in (desktop) */}
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
                  className="flex items-center gap-2 rounded-full px-3 py-2 h-auto border-white/20 hover:bg-white/10 hover:shadow-md transition-shadow bg-white/5"
                >
                  <Menu className="w-4 h-4" />
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    {isAuthenticated ? (
                      <span className="text-sm font-medium text-foreground">
                        {userName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl p-1"
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
      </motion.nav>

      <LanguageModal 
        open={languageModalOpen} 
        onOpenChange={setLanguageModalOpen} 
      />
    </>
  );
}
