// src/components/MobileTabs.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  MessageSquare,
  User,
  Brain,
  LayoutDashboard,
} from "lucide-react";

export default function MobileTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: "/dashboard/student", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/ai-chat", icon: MessageSquare, label: "Chat" },
    { path: "/listings", icon: Home, label: "Dorms" },
    { path: "/ai-match", icon: Brain, label: "AI Match" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  // Hide on auth page
  if (location.pathname === "/auth") return null;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.1)] border-t border-gray-200 md:hidden flex justify-around py-3 z-50"
    >
      {tabs.map(({ path, icon: Icon, label }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center ${
              active
                ? "text-purple-600 scale-110"
                : "text-gray-600 hover:text-purple-500"
            } transition-all`}
            aria-label={label}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}
