import { Menu, X, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OwnerNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function OwnerNavbar({ sidebarOpen, onToggleSidebar }: OwnerNavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-[70px] bg-background/95 backdrop-blur-md border-b border-border/40 z-50">
      <div className="h-full flex items-center px-4 gap-4">
        {/* Toggle Button - Airbnb style on desktop, iOS style on mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className={cn(
            "transition-all duration-200 active:scale-95",
            // Desktop/Tablet - Airbnb style
            "md:rounded-xl md:hover:bg-white/10 md:shadow-md md:w-10 md:h-10",
            // Mobile - iOS style
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
          <span className="text-xl font-bold gradient-text hidden sm:inline">
            Owner Portal
          </span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <Bell className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
