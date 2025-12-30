import { useState } from 'react';
import { Plus, MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NewChatMenuProps {
  onNewChat: () => void;
  onNewGroup: () => void;
}

export function NewChatMenu({ onNewChat, onNewGroup }: NewChatMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => {
            onNewChat();
            setOpen(false);
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>New Chat</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onNewGroup();
            setOpen(false);
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Users className="w-4 h-4" />
          <span>New Group</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
