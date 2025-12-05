import { Home, Building2, Plus, BarChart3, Settings, DoorOpen, Calendar, Upload, LayoutDashboard, TrendingUp, PlusCircle, Star, Wallet } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Dashboard', url: '/owner', icon: LayoutDashboard, exact: true },
  { title: 'My Listings', url: '/owner/listings', icon: Building2, exact: true },
  { title: 'Room Management', url: '/owner/rooms', icon: DoorOpen, exact: false },
  { title: 'Bulk Operations', url: '/owner/bulk-operations', icon: Settings, exact: true },
  { title: 'Bookings', url: '/owner/bookings', icon: Calendar, exact: true },
  { title: 'Tour Calendar', url: '/owner/calendar', icon: Calendar, exact: true },
  { title: 'Reviews', url: '/owner/reviews', icon: Star, exact: true },
  { title: 'Wallet & Payouts', url: '/owner/wallet', icon: Wallet, exact: true },
  { title: 'Add New Dorm', url: '/owner/dorms/new', icon: PlusCircle, exact: true },
  { title: 'Bulk Import', url: '/owner/bulk-import', icon: Upload, exact: true },
  { title: 'Statistics', url: '/owner/stats', icon: TrendingUp, exact: true },
];

interface OwnerSidebarProps {
  hiddenItems?: string[];
}

export function OwnerSidebar({ hiddenItems = [] }: OwnerSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();

  // Check if Room Management should be active (matches /owner/rooms or /owner/dorms/*/rooms)
  const isRoomManagementActive = (itemUrl: string): boolean => {
    if (itemUrl !== '/owner/rooms') return false;
    const path = location.pathname;
    return path === '/owner/rooms' || /^\/owner\/dorms\/[^/]+\/rooms$/.test(path);
  };

  const getNavCls = (item: typeof menuItems[0]) => ({ isActive }: { isActive: boolean }) => {
    const active = isActive || isRoomManagementActive(item.url);
    return active ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-white/5';
  };

  const visibleMenuItems = menuItems.filter(item => !hiddenItems.includes(item.title));

  return (
    <Sidebar className={state === 'collapsed' ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.exact} 
                      className={getNavCls(item)}
                    >
                      <item.icon className="w-4 h-4" />
                      {state !== 'collapsed' && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
