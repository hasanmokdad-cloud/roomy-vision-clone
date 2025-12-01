import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Languages } from "lucide-react";

interface TranslateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageText: string | null;
}

export function TranslateModal({
  open,
  onOpenChange,
  messageText,
}: TranslateModalProps) {
  const isMobile = useIsMobile();

  const content = (
    <div className="space-y-4">
      {/* Original Message */}
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Original</p>
        <p className="text-sm">{messageText || "(No text)"}</p>
      </div>

      {/* Coming Soon Notice */}
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Languages className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Translation Coming Soon</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          We're working on bringing real-time message translation to Roomy. Stay tuned!
        </p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-[20px]">
          <SheetHeader>
            <SheetTitle>Translate Message</SheetTitle>
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
          <DialogTitle>Translate Message</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}