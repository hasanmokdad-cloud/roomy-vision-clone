// src/components/BottomNav.tsx
import MobileTabs from "./MobileTabs";
import { useIsMobile } from "@/hooks/use-mobile";

export default function BottomNav() {
  const isMobile = useIsMobile();
  
  return isMobile ? <MobileTabs /> : null;
}
