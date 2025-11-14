// src/components/MobileNavbar.tsx
import { MessageSquare } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export default function MobileNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/auth") return null;

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-sm md:hidden flex justify-between items-center px-4 py-3 border-b border-gray-200"
    >
      <h1
        onClick={() => navigate("/")}
        className="font-extrabold text-xl bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 text-transparent bg-clip-text cursor-pointer"
      >
        Roomy
      </h1>
      <button
        onClick={() => navigate("/ai-chat")}
        className="p-2 rounded-full hover:bg-gray-100 transition"
        aria-label="Chat with Roomy AI"
      >
        <MessageSquare className="w-6 h-6 text-gray-700" />
      </button>
    </motion.nav>
  );
}
