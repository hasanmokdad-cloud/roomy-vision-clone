import { Drawer, DrawerContent, DrawerFooter } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMicPermission } from '@/contexts/MicPermissionContext';
import { useState } from 'react';

interface MicSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionGranted?: () => void;
  userId?: string;
  syncToDatabase?: (userId: string) => Promise<void>;
}

export function MicSetupModal({ open, onOpenChange, onPermissionGranted, userId, syncToDatabase }: MicSetupModalProps) {
  const isMobile = useIsMobile();
  const { requestPermission } = useMicPermission();
  const [requesting, setRequesting] = useState(false);

  const handleEnableVoice = async () => {
    setRequesting(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        // Sync to database immediately after granting permission
        if (syncToDatabase && userId) {
          await syncToDatabase(userId);
        }
        onOpenChange(false);
        onPermissionGranted?.();
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
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
          Enable Voice Messages
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Send voice notes to hosts and roommates quickly and easily. 
          Hold the mic button to record.
        </p>
      </div>
    </div>
  );

  const footer = (
    <div className="space-y-3 w-full">
      <Button
        onClick={handleEnableVoice}
        disabled={requesting}
        className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-base font-semibold rounded-xl"
      >
        {requesting ? 'Enabling...' : 'Enable Now'}
      </Button>
      <Button
        variant="ghost"
        onClick={handleSkip}
        disabled={requesting}
        className="w-full py-6 text-base rounded-xl text-muted-foreground"
      >
        Maybe Later
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
