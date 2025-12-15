import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DeclineConfirmDrawerProps {
  open: boolean;
  onGoBack: () => void;
  onCancelSignup: () => void;
}

export function DeclineConfirmDrawer({ open, onGoBack, onCancelSignup }: DeclineConfirmDrawerProps) {
  const isMobile = useIsMobile();

  const content = (
    <div className="space-y-4 py-4">
      <p className="text-muted-foreground text-sm leading-relaxed">
        You won't be able to use Roomy without accepting our community commitment. 
        This helps us create a safe and respectful environment for everyone.
      </p>
    </div>
  );

  const footer = (
    <div className="space-y-3 w-full">
      <Button
        onClick={onGoBack}
        className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-base font-semibold rounded-xl"
      >
        Go back
      </Button>
      <Button
        variant="outline"
        onClick={onCancelSignup}
        className="w-full py-6 text-base rounded-xl text-destructive hover:text-destructive"
      >
        Cancel signup
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={() => {}}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b border-border relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4"
              onClick={onGoBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <DrawerTitle className="text-xl font-bold text-center">
              Are you sure?
            </DrawerTitle>
          </DrawerHeader>
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onGoBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <DialogTitle className="text-xl font-bold">
              Are you sure?
            </DialogTitle>
          </div>
        </DialogHeader>
        {content}
        <DialogFooter className="flex-col sm:flex-col gap-3">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
