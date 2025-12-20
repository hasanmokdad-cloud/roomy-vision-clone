import { Camera, Image, File, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface AttachmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPhoto: () => void;
  onSelectCamera: () => void;
  onSelectDocument: () => void;
  uploading?: boolean;
}

export function AttachmentModal({
  open,
  onOpenChange,
  onSelectPhoto,
  onSelectCamera,
  onSelectDocument,
  uploading,
}: AttachmentModalProps) {
  const handleSelect = (handler: () => void) => {
    handler();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-safe">
        <DrawerHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">Share</DrawerTitle>
            <button 
              onClick={() => onOpenChange(false)}
              className="p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </DrawerHeader>
        
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Photo & Video */}
            <button
              onClick={() => handleSelect(onSelectPhoto)}
              disabled={uploading}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
            >
              <div className="w-14 h-14 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Image className="w-7 h-7 text-violet-500" />
              </div>
              <span className="text-sm text-foreground">Gallery</span>
            </button>

            {/* Camera */}
            <button
              onClick={() => handleSelect(onSelectCamera)}
              disabled={uploading}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
            >
              <div className="w-14 h-14 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Camera className="w-7 h-7 text-pink-500" />
              </div>
              <span className="text-sm text-foreground">Camera</span>
            </button>

            {/* Document */}
            <button
              onClick={() => handleSelect(onSelectDocument)}
              disabled={uploading}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
            >
              <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                <File className="w-7 h-7 text-blue-500" />
              </div>
              <span className="text-sm text-foreground">Document</span>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
