import { MessageCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WhatsAppDropdown() {
  const contacts = [
    { number: "96181858026", label: "Support - 81 858 026" },
    { number: "96176977539", label: "Inquiries - 76 977 539" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-[#25D366] hover:bg-[#1ea952] text-white gap-2">
          <MessageCircle className="w-5 h-5" />
          Chat on WhatsApp
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {contacts.map((contact) => (
          <DropdownMenuItem
            key={contact.number}
            onClick={() => window.open(`https://wa.me/${contact.number}`, "_blank")}
            className="cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {contact.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
