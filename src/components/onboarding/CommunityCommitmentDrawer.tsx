import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CommunityCommitmentDrawerProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function CommunityCommitmentDrawer({ open, onAccept, onDecline }: CommunityCommitmentDrawerProps) {
  const isMobile = useIsMobile();

  const content = (
    <div className="space-y-6 py-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
          <Heart className="w-8 h-8 text-pink-500" fill="currentColor" />
        </div>
      </div>

      <div className="text-center space-y-3">
        <h3 className="text-xl font-semibold text-foreground">
          Roomy is a community where everyone can belong
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          To ensure this, we're asking you to commit to the following:
        </p>
      </div>

      <div className="bg-muted/50 rounded-xl p-4 space-y-3">
        <p className="text-sm text-foreground leading-relaxed">
          I agree to treat everyone in the Roomy community—regardless of their race, religion, 
          national origin, ethnicity, skin color, disability, sex, gender identity, sexual orientation, 
          or age—with respect, and without judgment or bias.
        </p>
      </div>

      <button 
        className="text-sm text-primary hover:underline block mx-auto"
        onClick={() => window.open('/legal/community-guidelines', '_blank')}
      >
        Learn more
      </button>
    </div>
  );

  const footer = (
    <div className="space-y-3 w-full">
      <Button
        onClick={onAccept}
        className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-base font-semibold rounded-xl"
      >
        Agree and continue
      </Button>
      <Button
        variant="outline"
        onClick={onDecline}
        className="w-full py-6 text-base rounded-xl"
      >
        Decline
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={() => {}}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b border-border">
            <DrawerTitle className="text-xl font-bold text-center">
              Our community commitment
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
          <DialogTitle className="text-xl font-bold text-center">
            Our community commitment
          </DialogTitle>
        </DialogHeader>
        {content}
        <DialogFooter className="flex-col sm:flex-col gap-3">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
