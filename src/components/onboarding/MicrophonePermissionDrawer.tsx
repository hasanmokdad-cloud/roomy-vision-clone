import { Drawer, DrawerContent, DrawerFooter } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';

interface MicrophonePermissionDrawerProps {
  open: boolean;
  onAllow: () => void;
  onSkip: () => void;
  /** Optional: provide these if MicPermissionProvider is available */
  requestPermission?: () => Promise<boolean>;
  syncToDatabase?: (userId: string) => Promise<void>;
  userId?: string;
}

export function MicrophonePermissionDrawer({ 
  open, 
  onAllow, 
  onSkip,
  requestPermission,
  syncToDatabase,
  userId
}: MicrophonePermissionDrawerProps) {
  const isMobile = useIsMobile();
  const [requesting, setRequesting] = useState(false);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      if (requestPermission) {
        const granted = await requestPermission();
        
        // Sync to database regardless of result
        if (syncToDatabase && userId) {
          await syncToDatabase(userId);
        }
        
        if (granted) {
          console.log('Microphone permission granted and synced');
        }
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
    } finally {
      setRequesting(false);
      onAllow();
    }
  };

  const handleSkip = async () => {
    // Still sync the 'prompt' status to database so we know to ask later
    if (syncToDatabase && userId) {
      await syncToDatabase(userId);
    }
    onSkip();
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
        disabled={requesting}
        className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-base font-semibold rounded-xl"
      >
        {requesting ? 'Enabling...' : 'Yes, allow'}
      </Button>
      <Button
        variant="ghost"
        onClick={handleSkip}
        disabled={requesting}
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
