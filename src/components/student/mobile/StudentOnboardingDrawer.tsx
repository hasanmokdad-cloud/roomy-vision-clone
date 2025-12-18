import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import MobileStudentWizard from "./MobileStudentWizard";

interface StudentOnboardingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function StudentOnboardingDrawer({
  open,
  onOpenChange,
  onComplete,
}: StudentOnboardingDrawerProps) {
  const handleComplete = () => {
    onOpenChange(false);
    onComplete?.();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh] max-h-[95vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Complete Your Profile</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto">
          <MobileStudentWizard 
            isDrawerMode 
            onComplete={handleComplete}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
