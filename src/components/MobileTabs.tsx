// Instagram-style mobile bottom navbar with icons only
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { MobileProfileMenu } from "@/components/mobile/MobileProfileMenu";
import {
  Settings,
  MessageSquare,
  User,
  Sparkles,
  Building2,
} from "lucide-react";

export default function MobileTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { unreadCount } = useUnreadCount(userId);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      setUserEmail(user.email);

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id)
        .single();

      setUserRole(roleRow?.roles?.name || null);
    };

    fetchUserData();
  }, []);

  // Owner has unique 3-icon layout
  const tabs = userRole === 'owner' 
    ? [
        { path: "/settings", icon: Settings, label: "Settings" },
        { path: "/messages", icon: MessageSquare, label: "Messages", center: true, badge: unreadCount },
        { path: "/profile", icon: User, label: "Profile", isProfile: true },
      ]
    : [
        { path: "/settings", icon: Settings, label: "Settings" },
        { path: "/messages", icon: MessageSquare, label: "Messages", badge: unreadCount },
        { path: "/listings", icon: Building2, label: "Dorms", center: true },
        { path: "/ai-match", icon: Sparkles, label: "AI Match" },
        { path: "/profile", icon: User, label: "Profile", isProfile: true },
      ];

  const handleProfileClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserEmail(user?.email);
    setProfileMenuOpen(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('intro-played');
    navigate('/auth');
  };

  // Hide on auth page and owner pages
  if (location.pathname === "/auth" || location.pathname.startsWith("/owner") || location.pathname.startsWith("/admin")) return null;

  // Get current tab index
  const currentIndex = tabs.findIndex(tab => location.pathname.startsWith(tab.path));

  // Swipe handlers
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      if (currentIndex < tabs.length - 1) {
        navigate(tabs[currentIndex + 1].path);
      }
    },
    onSwipeRight: () => {
      if (currentIndex > 0) {
        navigate(tabs[currentIndex - 1].path);
      }
    },
    threshold: 75,
  });

  return (
    <>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 w-full bg-background/95 dark:bg-background/98 backdrop-blur-lg shadow-[0_-2px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_20px_rgba(0,0,0,0.3)] border-t border-border md:hidden flex justify-around items-center py-2 z-50 safe-area-inset-bottom"
        {...swipeHandlers}
      >
        {tabs.map(({ path, icon: Icon, label, center, isProfile, badge }) => {
          const active = location.pathname === path || location.pathname.startsWith(path);
          
          if (center) {
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="relative flex items-center justify-center -mt-7"
                aria-label={label}
                aria-current={active ? "page" : undefined}
              >
                <motion.div 
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${
                    active
                      ? "bg-gradient-to-br from-primary via-secondary to-accent shadow-primary/50"
                      : "bg-gradient-to-br from-primary/70 via-secondary/70 to-accent/70 shadow-primary/30"
                  }`}
                  whileTap={{ scale: 0.9 }}
                >
                  {Icon && <Icon className="w-7 h-7 text-primary-foreground" />}
                </motion.div>
              </button>
            );
          }

          return (
            <button
              key={path}
              onClick={() => isProfile ? handleProfileClick() : navigate(path)}
              className="relative flex items-center justify-center p-2 transition-all"
              aria-label={label}
              aria-current={active ? "page" : undefined}
            >
              {Icon && (
                <>
                  <Icon className={`w-7 h-7 transition-colors ${
                    active ? "text-primary" : "text-foreground/60"
                  }`} />
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {badge !== undefined && badge > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                      {badge > 9 ? '9+' : badge}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </motion.div>

      <MobileProfileMenu
        open={profileMenuOpen}
        onClose={() => setProfileMenuOpen(false)}
        onSignOut={handleSignOut}
        userEmail={userEmail}
      />
    </>
  );
}