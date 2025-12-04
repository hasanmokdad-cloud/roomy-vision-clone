import { Home, Building2, BarChart3, Settings, DoorOpen, Calendar, Upload, LayoutDashboard, TrendingUp, PlusCircle, Star, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', url: '/owner', icon: LayoutDashboard },
  { title: 'My Listings', url: '/owner/listings', icon: Building2 },
  { title: 'Room Management', url: '/owner/rooms', icon: DoorOpen },
  { title: 'Bulk Operations', url: '/owner/bulk-operations', icon: Settings },
  { title: 'Bookings', url: '/owner/bookings', icon: Calendar },
  { title: 'Tour Calendar', url: '/owner/calendar', icon: Calendar },
  { title: 'Reviews', url: '/owner/reviews', icon: Star },
  { title: 'Wallet & Payouts', url: '/owner/wallet', icon: Wallet },
  { title: 'Add New Dorm', url: '/owner/dorms/new', icon: PlusCircle },
  { title: 'Bulk Import', url: '/owner/bulk-import', icon: Upload },
  { title: 'Statistics', url: '/owner/stats', icon: TrendingUp },
  { title: 'Account', url: '/owner/account', icon: Settings },
];

interface OwnerSidebarFixedProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export function OwnerSidebarFixed({ isOpen, onClose, isMobile }: OwnerSidebarFixedProps) {
  return (
    <aside
      className={cn(
        "fixed top-[70px] left-0 w-[240px] h-[calc(100vh-70px)] bg-background border-r border-border/40 z-40",
        "transition-transform duration-300 ease-in-out",
        "overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Management Label */}
      <div className="px-4 py-3 border-b border-border/20">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Management
        </span>
      </div>

      {/* Menu Items */}
      <nav className="p-2 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === '/owner'}
            onClick={() => isMobile && onClose()}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
              )
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
