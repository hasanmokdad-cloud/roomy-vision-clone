import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProfileFieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSave: () => void;
  isSaving?: boolean;
}

export const ProfileFieldModal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSave,
  isSaving = false,
}: ProfileFieldModalProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 -ml-2 hover:bg-muted rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
              <div className="w-9" /> {/* Spacer */}
            </div>
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto p-4">
            {description && (
              <p className="text-sm text-muted-foreground mb-4">{description}</p>
            )}
            {children}
          </div>
          
          <DrawerFooter className="border-t border-border pt-4">
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 -ml-2 hover:bg-muted rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <div className="w-9" /> {/* Spacer */}
        </DialogHeader>
        
        <div className="py-4">
          {description && (
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
          )}
          {children}
        </div>
        
        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
