import { useIsMobile } from "@/hooks/use-mobile";
import {
  Reply,
  Forward,
  Copy,
  Edit3,
  Info,
  Star,
  Pin,
  Languages,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MessageContextMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSender: boolean;
  messageId: string;
  messageText: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  seenAt?: string | null;
  onReply: () => void;
  onCopy: () => void;
  onEdit?: () => void;
  onStar: () => void;
  onInfo: () => void;
  onPin: () => void;
  onTranslate: () => void;
  onForward: () => void;
  onDelete: (deleteForEveryone: boolean) => void;
  trigger?: React.ReactNode;
  canEdit?: boolean;
  isPinned?: boolean;
}

export function MessageContextMenu({
  open,
  onOpenChange,
  isSender,
  messageId,
  messageText,
  createdAt,
  deliveredAt,
  seenAt,
  onReply,
  onCopy,
  onEdit,
  onStar,
  onInfo,
  onPin,
  onTranslate,
  onForward,
  onDelete,
  trigger,
  canEdit = false,
  isPinned = false,
}: MessageContextMenuProps) {
  const isMobile = useIsMobile();

  const menuItems = [
    { icon: Reply, label: "Reply", onClick: onReply },
    { icon: Forward, label: "Forward", onClick: onForward },
    { icon: Copy, label: "Copy", onClick: onCopy, show: !!messageText },
    { icon: Edit3, label: "Edit", onClick: onEdit, show: isSender && canEdit },
    { icon: Info, label: "Info", onClick: onInfo },
    { icon: Star, label: "Star", onClick: onStar },
    { icon: Pin, label: isPinned ? "Unpin" : "Pin", onClick: onPin },
    { icon: Languages, label: "Translate", onClick: onTranslate },
  ];

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-[20px]">
          <SheetHeader>
            <SheetTitle>Message options</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-1">
            {menuItems.map((item, index) => {
              if (item.show === false) return null;
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick?.();
                    onOpenChange(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
            
            <div className="h-px bg-border my-2" />
            
            <button
              onClick={() => {
                onDelete(false);
                onOpenChange(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors text-destructive"
            >
              <Trash2 className="h-5 w-5" />
              <span className="font-medium">Delete for me</span>
            </button>
            
            {isSender && (
              <button
                onClick={() => {
                  onDelete(true);
                  onOpenChange(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors text-destructive"
              >
                <Trash2 className="h-5 w-5" />
                <span className="font-medium">Delete for everyone</span>
              </button>
            )}
            
            <button
              onClick={() => onOpenChange(false)}
              disabled
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="font-medium">More</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      {trigger && <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>}
      <DropdownMenuContent align="start" className="w-48">
        {menuItems.map((item, index) => {
          if (item.show === false) return null;
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={index}
              onClick={item.onClick}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
            <span className="text-destructive">Delete</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onDelete(false)}>
              Delete for me
            </DropdownMenuItem>
            {isSender && (
              <DropdownMenuItem onClick={() => onDelete(true)}>
                Delete for everyone
              </DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuItem disabled>
          <MoreHorizontal className="mr-2 h-4 w-4" />
          More
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
