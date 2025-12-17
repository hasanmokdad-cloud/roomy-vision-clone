import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface NotificationPermissionDrawerProps {
  open: boolean;
  onAllow: () => void;
  onSkip: () => void;
}

export function NotificationPermissionDrawer({ open, onAllow, onSkip }: NotificationPermissionDrawerProps) {
  const isMobile = useIsMobile();

  const handleAllow = async () => {
    try {
      // Request notification permission - this triggers the native OS dialog
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
    onAllow();
  };

  const content = (
    <div className="space-y-6 py-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Bell className="w-10 h-10 text-primary" />
        </div>
      </div>

      <div className="text-center space-y-3">
        <h3 className="text-xl font-semibold text-foreground">
          Turn on notifications
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Don't miss important messages like booking updates, tour confirmations, 
          and account activity.
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
        Yes, notify me
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
          <DialogTitle className="sr-only">Turn on notifications</DialogTitle>
        </DialogHeader>
        {content}
        <DialogFooter className="flex-col sm:flex-col gap-3">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
