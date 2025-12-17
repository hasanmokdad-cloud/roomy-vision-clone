import { Drawer, DrawerContent, DrawerFooter } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MicrophonePermissionDrawerProps {
  open: boolean;
  onAllow: () => void;
  onSkip: () => void;
}

export function MicrophonePermissionDrawer({ open, onAllow, onSkip }: MicrophonePermissionDrawerProps) {
  const isMobile = useIsMobile();

  const handleAllow = async () => {
    try {
      // Request microphone permission - this triggers the native OS dialog
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      console.log('Microphone permission granted');
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
    }
    onAllow();
  };

  const content = (
    <div className="space-y-6 py-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Mic className="w-10 h-10 text-primary" />
        </div>
      </div>

      <div className="text-center space-y-3">
        <h3 className="text-xl font-semibold text-foreground">
          Enable voice messages
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Send voice messages to hosts and roommates quickly and easily.
        </p>
      </div>
    </div>
  );

  const footer = (
    <div className="space-y-3 w-full">
      <Button
        onClick={handleAllow}
        className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-base font-semibold rounded-xl"
      >
        Yes, allow
      </Button>
      <Button
        variant="ghost"
        onClick={onSkip}
        className="w-full py-6 text-base rounded-xl text-muted-foreground"
      >
        Not now
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={() => {}}>
        <DrawerContent className="max-h-[90vh]">
          <div className="px-4 overflow-y-auto">
            {content}
          </div>
          <DrawerFooter className="border-t border-border">
            {footer}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="sr-only">Enable voice messages</DialogTitle>
          <DialogDescription className="sr-only">
            Allow Roomy to access your microphone for voice messages
          </DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter className="flex-col sm:flex-col gap-3">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
