import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, User, LogOut, LayoutDashboard, Menu, MessageSquare } from 'lucide-react';
import AuthModal from './AuthModal';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useUnreadCount } from '@/hooks/useUnreadCount';

export default function Navbar() {
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const unreadCount = useUnreadCount(user?.id || null);

  useEffect(() => {
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    // Handle scroll
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('intro-played');
    navigate('/auth');
  };

  return (
    <>
      <nav 
        role="navigation"
        aria-label="Main navigation"
      style={{ opacity: scrolled ? 0.98 : 1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)]' : 'bg-black/60 backdrop-blur-md'
      }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link 
              to="/" 
              className="flex items-center gap-2 hover-scale"
              aria-label="Roomy - Home"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center" aria-hidden="true">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">Roomy</span>
            </Link>

            <div className="hidden md:flex items-center gap-8" role="menubar" aria-label="Main menu">
              <Link 
                to="/" 
                className="text-foreground/80 hover:text-foreground transition-colors story-link"
                role="menuitem"
              >
                Home
              </Link>
              <Link 
                to="/listings" 
                className="text-foreground/80 hover:text-foreground transition-colors story-link"
                role="menuitem"
              >
                Dorms
              </Link>
              <Link 
                to="/ai-match" 
                className="text-foreground/80 hover:text-foreground transition-colors story-link"
                role="menuitem"
              >
                AI Match
              </Link>
              <Link 
                to="/about" 
                className="text-foreground/80 hover:text-foreground transition-colors story-link"
                role="menuitem"
              >
                About
              </Link>
              <Link 
                to="/contact" 
                className="text-foreground/80 hover:text-foreground transition-colors story-link"
                role="menuitem"
              >
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    aria-label="Open mobile menu"
                    aria-expanded={mobileMenuOpen}
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-4 mt-6" role="navigation" aria-label="Mobile navigation">
                    <Link 
                      to="/" 
                      className="text-foreground/80 hover:text-foreground transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Home
                    </Link>
                    <Link 
                      to="/listings" 
                      className="text-foreground/80 hover:text-foreground transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dorms
                    </Link>
                    <Link 
                      to="/ai-match" 
                      className="text-foreground/80 hover:text-foreground transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      AI Match
                    </Link>
                    <Link 
                      to="/about" 
                      className="text-foreground/80 hover:text-foreground transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      About
                    </Link>
                    <Link 
                      to="/contact" 
                      className="text-foreground/80 hover:text-foreground transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Contact
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>

              <Button 
                variant="outline" 
                asChild 
                className="hidden md:inline-flex"
              >
                <Link to="/contact" aria-label="Contact us - Reach out">Reach Us</Link>
              </Button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="default" 
                      className="bg-gradient-to-r from-primary to-secondary"
                      aria-label="User profile menu"
                      aria-haspopup="menu"
                    >
                      <User className="w-4 h-4 mr-2" aria-hidden="true" />
                      Profile
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end"
                    className="bg-background/95 backdrop-blur-sm z-[60]"
                    role="menu"
                    aria-label="User menu"
                  >
                    <DropdownMenuItem 
                      onClick={() => navigate('/profile')}
                      role="menuitem"
                    >
                      <User className="w-4 h-4 mr-2" aria-hidden="true" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate('/dashboard')}
                      role="menuitem"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" aria-hidden="true" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => setAuthOpen(true)}
                  className="bg-gradient-to-r from-primary to-secondary"
                  aria-label="Sign in or create account"
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
