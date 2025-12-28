import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, CheckCheck, Play } from "lucide-react";
import { format } from "date-fns";

interface MessageInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageText: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  seenAt?: string | null;
  playedAt?: string | null;
  isSender: boolean;
  isVoiceMessage?: boolean;
}

export function MessageInfoModal({
  open,
  onOpenChange,
  messageText,
  createdAt,
  deliveredAt,
  seenAt,
  playedAt,
  isSender,
  isVoiceMessage = false,
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
              {isVoiceMessage ? "🎤 Voice message" : (messageText || "(Media)")}
            </p>
          </div>
        </div>
      </div>

      {/* Status Timeline - Show all statuses for sender */}
      {isSender && (
        <div className="space-y-3">
          {/* Played Status - only for voice messages */}
          {isVoiceMessage && (
            <div className={`flex items-start gap-3 p-3 rounded-lg ${playedAt ? 'bg-green-500/10' : 'bg-muted/30 opacity-60'}`}>
              <Play className={`w-5 h-5 mt-0.5 ${playedAt ? 'text-green-500' : 'text-muted-foreground'}`} />
              <div className="flex-1">
                <p className={`text-sm ${playedAt ? 'font-medium text-green-500' : 'text-muted-foreground'}`}>Played</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {playedAt ? formatTime(playedAt) : '-'}
                </p>
              </div>
            </div>
          )}

          {/* Read Status */}
          <div className={`flex items-start gap-3 p-3 rounded-lg ${seenAt ? 'bg-blue-500/10' : 'bg-muted/30 opacity-60'}`}>
            <CheckCheck className={`w-5 h-5 mt-0.5 ${seenAt ? 'text-blue-500' : 'text-muted-foreground'}`} />
            <div className="flex-1">
              <p className={`text-sm ${seenAt ? 'font-medium text-blue-500' : 'text-muted-foreground'}`}>Read</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {seenAt ? formatTime(seenAt) : '-'}
              </p>
            </div>
          </div>

          {/* Delivered Status - always show */}
          <div className={`flex items-start gap-3 p-3 rounded-lg ${deliveredAt ? 'bg-muted/50' : 'bg-muted/30 opacity-60'}`}>
            <CheckCheck className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className={`text-sm ${deliveredAt ? 'font-medium' : 'text-muted-foreground'}`}>Delivered</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {deliveredAt ? formatTime(deliveredAt) : '-'}
              </p>
            </div>
          </div>

          {/* Sent Status - always show */}
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
      )}

      {/* For receiver, just show when received */}
      {!isSender && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Check className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Received</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTime(createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
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