import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, User, LogOut, LayoutDashboard } from 'lucide-react';
import AuthModal from './AuthModal';

export default function Navbar() {
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

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
    navigate('/');
  };

  return (
    <>
      <nav 
        style={{ opacity: scrolled ? 0.98 : 1 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm' : 'bg-white/70 backdrop-blur-md'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-2 hover-scale">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">Roomy</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors story-link">
                Home
              </Link>
              <Link to="/listings" className="text-foreground/80 hover:text-foreground transition-colors story-link">
                Dorms
              </Link>
              <Link to="/ai-match" className="text-foreground/80 hover:text-foreground transition-colors story-link">
                AI Match
              </Link>
              <Link to="/about" className="text-foreground/80 hover:text-foreground transition-colors story-link">
                About
              </Link>
              <Link to="/contact" className="text-foreground/80 hover:text-foreground transition-colors story-link">
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" asChild className="hidden md:inline-flex">
                <Link to="/contact">Reach Us</Link>
              </Button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" className="bg-gradient-to-r from-primary to-secondary">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => setAuthOpen(true)}
                  className="bg-gradient-to-r from-primary to-secondary"
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
