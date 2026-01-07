import { Building2, Settings, DoorOpen, Calendar, LayoutDashboard, TrendingUp, Star, Wallet, Bed } from 'lucide-react';
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
  { title: 'Bed Inventory', url: '/owner/inventory', icon: Bed, exact: true },
  { title: 'Finance Hub', url: '/owner/finance', icon: Wallet, exact: false },
  { title: 'Tour Management', url: '/owner/schedule', icon: Calendar, exact: false },
  { title: 'Room Management', url: '/owner/rooms', icon: DoorOpen, exact: false },
  { title: 'Bulk Operations', url: '/owner/bulk-operations', icon: Settings, exact: true },
  { title: 'Reviews', url: '/owner/reviews', icon: Star, exact: true },
  { title: 'My Listings', url: '/owner/listings', icon: Building2, exact: true },
  { title: 'Statistics', url: '/owner/stats', icon: TrendingUp, exact: true },
];

interface OwnerSidebarProps {
  hiddenItems?: string[];
}

export function OwnerSidebar({ hiddenItems = [] }: OwnerSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();

  // Check if certain hub items should be active based on URL patterns
  const isHubActive = (itemUrl: string): boolean => {
    const path = location.pathname;
    if (itemUrl === '/owner/rooms') {
      return path === '/owner/rooms' || /^\/owner\/dorms\/[^/]+\/rooms$/.test(path);
    }
    if (itemUrl === '/owner/finance') {
      return path.startsWith('/owner/finance');
    }
    if (itemUrl === '/owner/schedule') {
      return path.startsWith('/owner/schedule');
    }
    return false;
  };

  const getNavCls = (item: typeof menuItems[0]) => ({ isActive }: { isActive: boolean }) => {
    const active = isActive || isHubActive(item.url);
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
