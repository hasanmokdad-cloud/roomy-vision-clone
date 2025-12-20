import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteMessageDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  isSender: boolean;
}

export function DeleteMessageDrawer({
  open,
  onOpenChange,
  onDeleteForMe,
  onDeleteForEveryone,
  isSender,
}: DeleteMessageDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-8">
        <DrawerHeader className="text-center">
          <DrawerTitle className="flex items-center justify-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Message
          </DrawerTitle>
          <DrawerDescription>
            Choose how you want to delete this message
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="px-4 space-y-3">
          <Button
            variant="outline"
            className="w-full h-14 text-base justify-start gap-3"
            onClick={() => {
              onDeleteForMe();
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-5 w-5" />
            Delete for me
          </Button>
          
          {isSender && (
            <Button
              variant="destructive"
              className="w-full h-14 text-base justify-start gap-3"
              onClick={() => {
                onDeleteForEveryone();
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-5 w-5" />
              Delete for everyone
            </Button>
          )}
          
          <Button
            variant="ghost"
            className="w-full h-12 text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
