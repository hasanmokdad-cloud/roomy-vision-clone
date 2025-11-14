// Instagram-style mobile bottom navbar with icons only
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  MessageSquare,
  User,
  Sparkles,
} from "lucide-react";

export default function MobileTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: "/dashboard", icon: Home, label: "Home" },
    { path: "/messages", icon: MessageSquare, label: "Messages" },
    { path: "/listings", icon: null, label: "Dorms", center: true },
    { path: "/ai-match", icon: Sparkles, label: "AI Match" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  // Hide on auth page
  if (location.pathname === "/auth") return null;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 w-full bg-background/95 dark:bg-background/98 backdrop-blur-lg shadow-[0_-2px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_20px_rgba(0,0,0,0.3)] border-t border-border md:hidden flex justify-around items-center py-2 z-50 safe-area-inset-bottom"
    >
      {tabs.map(({ path, icon: Icon, label, center }) => {
        const active = location.pathname === path || location.pathname.startsWith(path);
        
        if (center) {
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="relative flex items-center justify-center -mt-6"
              aria-label={label}
              aria-current={active ? "page" : undefined}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                active
                  ? "bg-gradient-to-br from-primary via-secondary to-accent shadow-lg shadow-primary/50"
                  : "bg-gradient-to-br from-muted to-muted/50"
              }`}>
                <Home className={`w-6 h-6 ${active ? "text-primary-foreground" : "text-foreground/70"}`} />
              </div>
            </button>
          );
        }

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
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
              </>
            )}
          </button>
        );
      })}
    </motion.div>
  );
}
