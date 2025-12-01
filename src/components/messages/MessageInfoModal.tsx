import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";

interface MessageInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageText: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  seenAt?: string | null;
  isSender: boolean;
}

export function MessageInfoModal({
  open,
  onOpenChange,
  messageText,
  createdAt,
  deliveredAt,
  seenAt,
  isSender,
}: MessageInfoModalProps) {
  const isMobile = useIsMobile();

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
  };

  const content = (
    <div className="space-y-4">
      {/* Message Preview */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">
              {isSender ? "You" : "Them"}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {messageText || "(No text)"}
            </p>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="space-y-3">
        {/* Read Status */}
        {seenAt && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10">
            <CheckCheck className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-500">Read</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTime(seenAt)}
              </p>
            </div>
          </div>
        )}

        {/* Delivered Status */}
        {deliveredAt && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <CheckCheck className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Delivered</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTime(deliveredAt)}
              </p>
            </div>
          </div>
        )}

        {/* Sent Status */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <Check className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Sent</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatTime(createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-[20px]">
          <SheetHeader>
            <SheetTitle>Message Info</SheetTitle>
          </SheetHeader>
          <div className="py-4">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Message Info</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}