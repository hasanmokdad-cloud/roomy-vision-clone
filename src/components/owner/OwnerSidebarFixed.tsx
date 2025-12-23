import { Building2, BarChart3, Settings, DoorOpen, Calendar, LayoutDashboard, TrendingUp, Star, DollarSign } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', url: '/owner', icon: LayoutDashboard },
  { title: 'Finance Hub', url: '/owner/finance', icon: DollarSign },
  { title: 'Tour Management', url: '/owner/schedule', icon: Calendar },
  { title: 'Room Management', url: '/owner/rooms', icon: DoorOpen },
  { title: 'Bulk Operations', url: '/owner/bulk-operations', icon: Settings },
  { title: 'Reviews', url: '/owner/reviews', icon: Star },
  { title: 'My Listings', url: '/owner/listings', icon: Building2 },
  { title: 'Statistics', url: '/owner/stats', icon: TrendingUp },
];

interface OwnerSidebarFixedProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export function OwnerSidebarFixed({ isOpen, onClose, isMobile }: OwnerSidebarFixedProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed top-[70px] left-0 w-[240px] h-[calc(100vh-70px)] bg-background border-r border-border/40 z-40",
        "transition-transform duration-300 ease-in-out",
        "overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Roomy Gradient Logo Badge */}
      <div className="p-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6D5BFF] to-[#9A6AFF] flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-semibold bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] bg-clip-text text-transparent">
            Owner Portal
          </span>
        </div>
      </div>

      {/* Management Label */}
      <div className="px-4 py-3 border-b border-border/20">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Management
        </span>
      </div>

      {/* Menu Items */}
      <nav className="p-2 space-y-1">
        {menuItems.map((item) => {
          // Special handling for Room Management to match /owner/rooms AND /owner/dorms/*/rooms
          const isRoomManagementActive = item.url === '/owner/rooms' && 
            (location.pathname === '/owner/rooms' || /^\/owner\/dorms\/[^/]+\/rooms/.test(location.pathname));
          
          const isFinanceHubActive = item.url === '/owner/finance' && 
            location.pathname === '/owner/finance';
          
          const isTourManagementActive = item.url === '/owner/schedule' && 
            location.pathname === '/owner/schedule';
          
          const isActive = location.pathname === item.url || 
            (item.url === '/owner' && location.pathname === '/owner') ||
            isRoomManagementActive ||
            isFinanceHubActive ||
            isTourManagementActive;
          
          return (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.url === '/owner'}
              onClick={() => isMobile && onClose()}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "border-l-4 border-[#6D5BFF] bg-[#f7f4ff] text-[#6D5BFF] ml-0 pl-2.5"
                  : "text-gray-600 hover:bg-[#f6f4ff] hover:text-gray-900"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
