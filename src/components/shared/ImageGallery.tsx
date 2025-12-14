import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageGallery({ images, initialIndex = 0, isOpen, onClose }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset currentIndex when modal opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-screen w-screen h-screen p-0 bg-white border-none rounded-none [&>button.absolute]:hidden"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Image Gallery</DialogTitle>
        </DialogHeader>
        
        {/* Airbnb-style Header bar */}
        <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 md:px-6 z-50 bg-white border-b">
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 text-sm font-medium hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
          <div className="text-sm font-medium text-gray-700">
            {currentIndex + 1} / {images.length}
          </div>
          <div className="w-20" /> {/* Spacer for balance */}
        </div>

        {/* Main image area - centered with proper padding */}
        <div className="w-full h-full flex items-center justify-center pt-16 pb-4 px-4 md:px-16">
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-full max-h-[calc(100vh-5rem)] object-contain rounded-lg"
          />
        </div>

        {/* Navigation buttons - Airbnb circular style */}
        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-300 shadow-md hover:shadow-lg hover:scale-105 transition-all z-50"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-300 shadow-md hover:shadow-lg hover:scale-105 transition-all z-50"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
