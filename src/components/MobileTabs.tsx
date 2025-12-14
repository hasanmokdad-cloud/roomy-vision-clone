// Instagram/Airbnb-style mobile bottom navbar - icons only, clean design
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useBottomNav } from "@/contexts/BottomNavContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Heart,
  Sparkles,
  Search,
  MessageSquare,
  User,
  Wallet,
  CalendarDays,
  Home,
  MessageCircle,
  LogIn,
} from "lucide-react";

type TabConfig = {
  path: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
};

export default function MobileTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hideBottomNav } = useBottomNav();
  const { isAuthenticated, userId } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { unreadCount } = useUnreadCount(userId);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!userId) {
        setUserRole(null);
        return;
      }

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", userId)
        .single();

      setUserRole(roleRow?.roles?.name || 'student');
    };

    fetchUserRole();
  }, [userId]);

  // Role-based tab configurations
  const getTabs = (): TabConfig[] => {
    if (!isAuthenticated) {
      // Public/Anonymous users
      return [
        { path: "/wishlists", icon: Heart, label: "Wishlists" },
        { path: "/ai-match", icon: Sparkles, label: "AI Match" },
        { path: "/listings", icon: Search, label: "Explore" },
        { path: "/messages", icon: MessageSquare, label: "Inbox" },
        { path: "/profile", icon: LogIn, label: "Log in" },
      ];
    }

    if (userRole === 'owner') {
      return [
        { path: "/owner/wallet", icon: Wallet, label: "Wallet" },
        { path: "/owner/bookings", icon: CalendarDays, label: "Bookings" },
        { path: "/owner", icon: Home, label: "Owner" },
        { path: "/messages", icon: MessageSquare, label: "Messages", badge: unreadCount },
        { path: "/profile", icon: User, label: "Profile" },
      ];
    }

    if (userRole === 'admin') {
      return [
        { path: "/admin/wallet", icon: Wallet, label: "Wallet" },
        { path: "/admin/chats", icon: MessageCircle, label: "Chats" },
        { path: "/admin", icon: Home, label: "Admin" },
        { path: "/messages", icon: MessageSquare, label: "Messages", badge: unreadCount },
        { path: "/profile", icon: User, label: "Profile" },
      ];
    }

    // Students (default)
    return [
      { path: "/wishlists", icon: Heart, label: "Wishlists" },
      { path: "/ai-match", icon: Sparkles, label: "AI Match" },
      { path: "/listings", icon: Search, label: "Explore" },
      { path: "/messages", icon: MessageSquare, label: "Messages", badge: unreadCount },
      { path: "/profile", icon: User, label: "Profile" },
    ];
  };

  const tabs = getTabs();

  // Hide on certain routes
  if (hideBottomNav) return null;
  if (location.pathname.startsWith("/owner/") && !location.pathname.match(/^\/owner\/(wallet|bookings)$/)) return null;
  if (location.pathname.startsWith("/admin/") && !location.pathname.match(/^\/admin\/(wallet|chats)$/)) return null;
  if (location.pathname === "/owner" || location.pathname === "/admin") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 w-full bg-background border-t border-border md:hidden flex justify-around items-center h-14 z-50 safe-area-inset-bottom"
      role="navigation"
      aria-label="Main navigation"
    >
      {tabs.map(({ path, icon: Icon, label, badge }) => {
        const isActive = location.pathname === path || 
          (path !== '/profile' && location.pathname.startsWith(path) && path !== '/');
        
        return (
          <button
            key={path}
            onClick={() => {
              if (path === '/profile' && !isAuthenticated) {
                navigate('/profile');
              } else {
                navigate(path);
              }
            }}
            className="relative flex flex-col items-center justify-center flex-1 h-full"
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon 
              className={`w-6 h-6 transition-colors ${
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground"
              }`}
              fill={isActive && (path === '/wishlists') ? "currentColor" : "none"}
              strokeWidth={isActive ? 2.5 : 2}
            />
            
            {/* Unread badge */}
            {badge !== undefined && badge > 0 && (
              <span className="absolute top-1 right-1/4 bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold px-1">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
