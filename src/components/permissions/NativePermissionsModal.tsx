import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Camera, Image, Check, ChevronRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerDescription 
} from '@/components/ui/drawer';
import { useNativePermissions, PermissionStatus } from '@/hooks/useNativePermissions';

interface NativePermissionsModalProps {
  open: boolean;
  onComplete: () => void;
}

interface PermissionItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: PermissionStatus;
  onRequest: () => Promise<boolean>;
}

function PermissionItem({ icon, title, description, status, onRequest }: PermissionItemProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      const granted = await onRequest();
      setLocalStatus(granted ? 'granted' : 'denied');
    } finally {
      setIsRequesting(false);
    }
  };

  const isGranted = localStatus === 'granted';
  const isDenied = localStatus === 'denied';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
        isGranted 
          ? 'bg-green-500/10 border-green-500/30' 
          : isDenied
          ? 'bg-destructive/10 border-destructive/30'
          : 'bg-muted/50 border-border'
      }`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
        isGranted 
          ? 'bg-green-500/20 text-green-500' 
          : isDenied
          ? 'bg-destructive/20 text-destructive'
          : 'bg-primary/20 text-primary'
      }`}>
        {isGranted ? <Check className="w-6 h-6" /> : icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </div>
      
      {!isGranted && (
        <Button
          size="sm"
          variant={isDenied ? 'outline' : 'default'}
          onClick={handleRequest}
          disabled={isRequesting}
          className="shrink-0"
        >
          {isRequesting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            />
          ) : isDenied ? (
            <>Settings <ChevronRight className="w-4 h-4 ml-1" /></>
          ) : (
            'Allow'
          )}
        </Button>
      )}
    </motion.div>
  );
}

export function NativePermissionsModal({ open, onComplete }: NativePermissionsModalProps) {
  const {
    permissions,
    requestMicrophonePermission,
    requestCameraPermission,
    requestPhotoPermission,
    markModalShown,
    openNativeSettings,
  } = useNativePermissions();

  const handleComplete = () => {
    markModalShown();
    onComplete();
  };

  const handleMicRequest = async () => {
    const granted = await requestMicrophonePermission();
    if (!granted) {
      openNativeSettings();
    }
    return granted;
  };

  const handleCameraRequest = async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      openNativeSettings();
    }
    return granted;
  };

  const handlePhotoRequest = async () => {
    const granted = await requestPhotoPermission();
    return granted;
  };

  const allGranted = 
    permissions.microphone === 'granted' &&
    permissions.camera === 'granted' &&
    permissions.photos === 'granted';

  return (
    <Drawer open={open} onOpenChange={() => {}}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <DrawerTitle className="text-xl font-bold">
            Enable App Permissions
          </DrawerTitle>
          <DrawerDescription className="text-muted-foreground">
            Roomy needs these permissions for the best experience
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="px-4 pb-6 space-y-3">
          <AnimatePresence mode="wait">
            <PermissionItem
              icon={<Mic className="w-6 h-6" />}
              title="Microphone"
              description="Send voice messages to hosts and friends"
              status={permissions.microphone}
              onRequest={handleMicRequest}
            />
            
            <PermissionItem
              icon={<Camera className="w-6 h-6" />}
              title="Camera"
              description="View virtual room tours and take photos"
              status={permissions.camera}
              onRequest={handleCameraRequest}
            />
            
            <PermissionItem
              icon={<Image className="w-6 h-6" />}
              title="Photo Library"
              description="Share images and upload documents"
              status={permissions.photos}
              onRequest={handlePhotoRequest}
            />
          </AnimatePresence>
          
          <div className="pt-4">
            <Button
              onClick={handleComplete}
              className="w-full py-6 text-lg font-semibold"
              variant={allGranted ? 'default' : 'outline'}
            >
              {allGranted ? 'Continue to Roomy' : 'Skip for Now'}
            </Button>
            
            {!allGranted && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                You can enable these later in your device settings
              </p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
