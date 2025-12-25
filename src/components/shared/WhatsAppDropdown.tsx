import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WhatsAppDropdown() {
  return (
    <Button 
      className="bg-[#25D366]/50 hover:bg-[#25D366]/50 text-white gap-2 cursor-not-allowed" 
      disabled
    >
      <MessageCircle className="w-5 h-5" />
      Chat on WhatsApp
      <span className="text-xs opacity-70">(Coming Soon)</span>
    </Button>
  );
}
