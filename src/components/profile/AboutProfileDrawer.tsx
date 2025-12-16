import { User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';

interface AboutProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreateProfile: () => void;
}

export function AboutProfileDrawer({ open, onClose, onCreateProfile }: AboutProfileDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="pt-6 pb-4">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
              </div>
            </div>
            <DrawerTitle className="text-2xl text-center">About your profile</DrawerTitle>
          </DrawerHeader>

          <div className="px-6 pb-6 space-y-6">
            <p className="text-center text-muted-foreground">
              Your Roomy profile is an important part of every reservation. Create yours to help other students and hosts get to know you.
            </p>

            <div className="space-y-4">
              <ProfileFeature
                icon={<Sparkles className="w-5 h-5" />}
                title="Better matches"
                description="Get matched with dorms and roommates that fit your lifestyle"
              />
              <ProfileFeature
                icon={<User className="w-5 h-5" />}
                title="Build trust"
                description="Hosts prefer guests with complete profiles"
              />
            </div>
          </div>

          <DrawerFooter className="pb-8">
            <Button 
              onClick={onCreateProfile}
              className="w-full bg-gradient-to-r from-primary to-secondary py-6 text-lg font-semibold"
            >
              Create your profile
            </Button>
            <DrawerClose asChild>
              <button className="w-full text-center py-3 text-muted-foreground hover:text-foreground transition-colors">
                Learn more
              </button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ProfileFeature({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
