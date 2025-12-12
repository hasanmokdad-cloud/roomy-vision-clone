import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, MessageCircle, Globe, User, Settings, LogOut, Building2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { LanguageModal } from '@/components/LanguageModal';
import RoomyLogo from '@/assets/roomy-logo.png';
import { useTranslation } from 'react-i18next';

export function RoomyNavbar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { count: unreadCount } = useUnreadMessagesCount(user?.id, role || undefined);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadUserAndRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Fetch role
          const { data: roleRow } = await supabase
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          setRole((roleRow?.roles as any)?.name || null);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        
        // Fetch role
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        setRole((roleRow?.roles as any)?.name || null);
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/listings');
  };

  const handleBecomeOwner = () => {
    if (!user) {
      navigate('/auth?redirect=/become-owner');
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-background/95 backdrop-blur-xl border-b border-border shadow-sm' 
            : 'bg-background/80 backdrop-blur-lg'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/listings" className="flex items-center gap-2 shrink-0">
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
            <div className="flex items-center gap-2 md:gap-3">
              {/* Become an Owner - only show if not already an owner */}
              {role !== 'owner' && role !== 'admin' && (
                <Button
                  variant="ghost"
                  onClick={handleBecomeOwner}
                  className="hidden md:flex text-sm font-medium hover:bg-accent/50 rounded-full px-4"
                >
                  {t('navbar.becomeOwner', 'Become an Owner')}
                </Button>
              )}

              {/* Messages - only show when logged in */}
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/messages')}
                  className="relative rounded-full hover:bg-accent/50"
                >
                  <MessageCircle className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              )}

              {/* Hamburger Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 rounded-full px-3 py-2 h-auto border-border hover:shadow-md transition-shadow"
                  >
                    <Menu className="w-4 h-4" />
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                      {user ? (
                        <span className="text-sm font-medium text-foreground">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-background border border-border shadow-xl rounded-xl p-1"
                >
                  {!user ? (
                    // Not logged in menu
                    <>
                      <DropdownMenuItem
                        onClick={() => navigate('/auth')}
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
                        className="cursor-pointer rounded-lg py-3 text-destructive focus:text-destructive"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('navbar.signOut', 'Sign out')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
