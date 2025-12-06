import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Building2, 
  Key, 
  ShieldCheck, 
  MessageSquare, 
  BarChart3, 
  Activity, 
  Wallet, 
  RefreshCcw,
  Brain,
  Bell,
  FileStack
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, exact: true },
  { title: 'Review Forms', url: '/admin/pending-review', icon: FileText },
  { title: 'Manage Students', url: '/admin/students', icon: Users },
  { title: 'Manage Owners', url: '/admin/owners', icon: Building2 },
  { title: 'Manage Properties', url: '/admin/dorms', icon: Key },
  { title: 'RLS Debugger', url: '/admin/rls-debugger', icon: ShieldCheck },
  { title: 'Support Inbox', url: '/admin/messages', icon: MessageSquare },
  { title: 'All Chats', url: '/admin/chats', icon: MessageSquare },
  { title: 'Chat Analytics', url: '/admin/chats/analytics', icon: BarChart3 },
  { title: 'AI Diagnostics', url: '/admin/ai-diagnostics', icon: Activity },
  { title: 'Personality Insights', url: '/admin/personality-insights', icon: Brain },
  { title: 'Admin Payout Wallet', url: '/admin/wallet', icon: Wallet },
  { title: 'Refund Center', url: '/admin/refunds', icon: RefreshCcw },
  { title: 'Notifications', url: '/admin/notifications', icon: Bell },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'System Monitor', url: '/admin/system-monitor', icon: Activity },
  { title: 'System Logs', url: '/admin/logs', icon: FileStack },
];

interface AdminSidebarFixedProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export function AdminSidebarFixed({ isOpen, onClose, isMobile }: AdminSidebarFixedProps) {
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
      {/* Admin Portal Logo Badge */}
      <div className="p-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-semibold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
            Admin Portal
          </span>
        </div>
      </div>

      {/* Management Label */}
      <div className="px-4 py-3 border-b border-border/20">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Management
        </span>
      </div>

      {/* Menu Items */}
      <nav className="p-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.url
            : location.pathname === item.url || location.pathname.startsWith(item.url + '/');
          
          return (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.exact}
              onClick={() => isMobile && onClose()}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "border-l-4 border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 ml-0 pl-2.5"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
