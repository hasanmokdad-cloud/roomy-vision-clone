import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  title?: string;
}

export function VideoPlayerModal({ open, onOpenChange, videoUrl, title }: VideoPlayerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
        <DialogHeader className="sr-only">
          <DialogTitle>{title || 'Video Player'}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
          
          {title && (
            <div className="absolute top-2 left-2 z-50 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              {title}
            </div>
          )}
          
          <video
            src={videoUrl}
            controls
            autoPlay
            muted
            className="w-full max-h-[90vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
