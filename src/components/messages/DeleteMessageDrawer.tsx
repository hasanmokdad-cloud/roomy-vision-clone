import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { haptics } from "@/utils/haptics";

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
  const prefersReducedMotion = useReducedMotion();

  const handleDeleteForMe = () => {
    haptics.medium();
    onDeleteForMe();
    onOpenChange(false);
  };

  const handleDeleteForEveryone = () => {
    haptics.heavy();
    onDeleteForEveryone();
    onOpenChange(false);
  };

  const handleCancel = () => {
    haptics.light();
    onOpenChange(false);
  };

  const buttonVariants = {
    initial: prefersReducedMotion ? {} : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: prefersReducedMotion ? {} : { opacity: 0, y: 10 },
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-8">
        <DrawerHeader className="text-center">
          <motion.div
            initial={prefersReducedMotion ? {} : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={prefersReducedMotion ? { duration: 0.1 } : { type: "spring", stiffness: 400, damping: 20 }}
          >
            <DrawerTitle className="flex items-center justify-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Message
            </DrawerTitle>
          </motion.div>
          <DrawerDescription>
            Choose how you want to delete this message
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="px-4 space-y-3">
          <motion.div
            variants={buttonVariants}
            initial="initial"
            animate="animate"
            transition={prefersReducedMotion ? { duration: 0.1 } : { delay: 0.1, duration: 0.2 }}
          >
            <Button
              variant="outline"
              className="w-full h-14 text-base justify-start gap-3 active:scale-[0.98] transition-transform"
              onClick={handleDeleteForMe}
            >
              <Trash2 className="h-5 w-5" />
              Delete for me
            </Button>
          </motion.div>
          
          {isSender && (
            <motion.div
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              transition={prefersReducedMotion ? { duration: 0.1 } : { delay: 0.15, duration: 0.2 }}
            >
              <Button
                variant="destructive"
                className="w-full h-14 text-base justify-start gap-3 active:scale-[0.98] transition-transform"
                onClick={handleDeleteForEveryone}
              >
                <Trash2 className="h-5 w-5" />
                Delete for everyone
              </Button>
            </motion.div>
          )}
          
          <motion.div
            variants={buttonVariants}
            initial="initial"
            animate="animate"
            transition={prefersReducedMotion ? { duration: 0.1 } : { delay: 0.2, duration: 0.2 }}
          >
            <Button
              variant="ghost"
              className="w-full h-12 text-muted-foreground active:scale-[0.98] transition-transform"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </motion.div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
