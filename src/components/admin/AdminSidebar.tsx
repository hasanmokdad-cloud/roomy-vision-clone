import { Home, Building2, Users, BarChart3, FileText, Settings, Star, UserCheck } from 'lucide-react';
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
  { title: 'Dashboard', url: '/admin', icon: Home },
  { title: 'Manage Dorms', url: '/owner', icon: Building2 },
  { title: 'Review Moderation', url: '/owner/reviews', icon: Star },
  { title: 'Dorm Listings', url: '/admin/dorms', icon: Building2 },
  { title: 'Dorm Ownership', url: '/admin/ownership', icon: UserCheck },
  { title: 'Students', url: '/admin/students', icon: Users },
  { title: 'Owners', url: '/admin/owners', icon: Building2 },
  { title: 'Notifications', url: '/admin/notifications', icon: FileText },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'System Monitor', url: '/admin/system-monitor', icon: BarChart3 },
  { title: 'System Logs', url: '/admin/logs', icon: FileText },
  { title: 'Settings', url: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-white/5';

  return (
    <Sidebar className={state === 'collapsed' ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <h2 className={`font-bold gradient-text ${state === 'collapsed' ? 'text-sm' : 'text-xl'}`}>
            {state === 'collapsed' ? 'A' : 'Admin Panel'}
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
