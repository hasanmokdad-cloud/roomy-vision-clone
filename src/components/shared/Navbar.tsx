import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Home, Sparkles, Info, Phone, MessageSquare, Menu, User, LogOut, LayoutDashboard } from 'lucide-react';
import RoomyLogo from '@/assets/roomy-logo.png';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import AuthModal from './AuthModal';

export default function Navbar() {
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const { unreadCount } = useUnreadCount(user?.id || null);

  useEffect(() => {
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      const fetchRole = async () => {
        const { data } = await supabase.rpc('get_user_role', { 
          p_user_id: user.id 
        });
        
        const defaultAdminEmails = [
          'hassan.mokdad01@lau.edu',
          'hasan.mokdad@aiesec.net',
        ];
        
        const resolvedRole = data || 
          (defaultAdminEmails.includes(user.email ?? '') ? 'admin' : null);
        
        setRole(resolvedRole);
      };
      
      fetchRole();
    } else {
      setRole(null);
    }
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('intro-played');
    window.location.href = '/listings';
  };

  const handleDashboardClick = () => {
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'owner') {
      navigate('/owner');
    } else {
      navigate('/listings');
    }
  };

  const navItems = [
    { icon: Home, label: 'Home', href: '/', show: role !== 'owner' },
    { icon: Building2, label: 'Dorms', href: '/listings', show: role !== 'owner' },
    { icon: MessageSquare, label: 'Messages', href: '/messages', show: true },
    { icon: Sparkles, label: 'AI Match', href: '/ai-match', show: role !== 'owner' },
    { icon: Info, label: 'About', href: '/about', show: true },
    { icon: Phone, label: 'Contact', href: '/contact', show: true },
  ].filter(item => item.show);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between">
          <Link to="/">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <img 
                src={RoomyLogo} 
                alt="Roomy" 
                className="w-10 h-10 rounded-xl"
              />
              <span className="text-2xl font-bold gradient-text">Roomy</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item, index) => (
              <Link key={item.label} to={item.href}>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/5 transition-all"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center gap-2"
          >
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-6">
                  {navItems.map((item) => (
                    <Link 
                      key={item.label}
                      to={item.href} 
                      className="text-foreground/80 hover:text-foreground transition-colors py-2 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {user ? (
              <>
                {/* Messages Icon with Badge - Hidden on mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hidden md:flex"
                  asChild
                >
                  <Link to="/messages">
                    <MessageSquare className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0 text-[10px]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Link>
                </Button>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      className="bg-gradient-to-r from-primary to-secondary text-white font-semibold px-6 py-2 rounded-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end"
                    className="bg-background/95 backdrop-blur-sm border border-white/10"
                  >
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    {(role === 'owner' || role === 'admin') && (
                      <DropdownMenuItem onClick={handleDashboardClick}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Control Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <User className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={() => setAuthOpen(true)}
                className="bg-gradient-to-r from-primary to-secondary text-white font-semibold px-6 py-2 rounded-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300"
              >
                Get Started
              </Button>
            )}
          </motion.div>
        </div>
      </motion.nav>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
