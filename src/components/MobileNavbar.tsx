// src/components/MobileNavbar.tsx
import { useLocation } from "react-router-dom";

export default function MobileNavbar() {
  const location = useLocation();

  // Hide completely on mobile - bottom nav handles all navigation
  if (location.pathname === "/auth") return null;

  // Always hidden on mobile, only shown on desktop by parent component
  return null;
}
