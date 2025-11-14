import { Home, Building2, Plus, BarChart3, Settings, DoorOpen } from 'lucide-react';
import { NavLink } from 'react-router-dom';
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
  { title: 'Dashboard', url: '/owner', icon: Home },
  { title: 'My Listings', url: '/owner/listings', icon: Building2 },
  { title: 'Room Management', url: '/owner/rooms', icon: DoorOpen },
  { title: 'Add New Dorm', url: '/owner/add-dorm', icon: Plus },
  { title: 'Claim Existing Dorm', url: '/owner/claim-dorm', icon: Building2 },
  { title: 'Statistics', url: '/owner/stats', icon: BarChart3 },
  { title: 'Account', url: '/owner/account', icon: Settings },
];

export function OwnerSidebar() {
  const { state } = useSidebar();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-white/5';

  return (
    <Sidebar className={state === 'collapsed' ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <h2 className={`font-bold gradient-text ${state === 'collapsed' ? 'text-sm' : 'text-xl'}`}>
            {state === 'collapsed' ? 'O' : 'Owner Portal'}
          </h2>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
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
