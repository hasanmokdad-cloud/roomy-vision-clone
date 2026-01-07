import { memo, forwardRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PhotoSection as PhotoSectionType } from '@/types/apartmentDetail';

interface PhotoSectionProps {
  section: PhotoSectionType;
  index: number;
}

const PhotoSectionComponent = forwardRef<HTMLDivElement, PhotoSectionProps>(
  ({ section, index }, ref) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const openLightbox = (photoIndex: number) => {
      setCurrentPhotoIndex(photoIndex);
      setLightboxOpen(true);
    };

    const nextPhoto = () => {
      setCurrentPhotoIndex((prev) => 
        prev < section.photos.length - 1 ? prev + 1 : 0
      );
    };

    const prevPhoto = () => {
      setCurrentPhotoIndex((prev) => 
        prev > 0 ? prev - 1 : section.photos.length - 1
      );
    };

    // Create photo grid layout - first photo large, rest smaller
    const mainPhoto = section.photos[0];
    const gridPhotos = section.photos.slice(1);

    return (
      <div ref={ref} id={`section-${index}`} className="scroll-mt-20">
        {/* Section Title */}
        <h2 className="text-2xl font-semibold mb-4 px-4 md:px-0">
          {section.label}
        </h2>

        {/* Photo Grid */}
        <div className="space-y-2">
          {/* Main Photo */}
          {mainPhoto && (
            <div 
              className="w-full aspect-video md:aspect-[16/9] rounded-lg overflow-hidden cursor-pointer"
              onClick={() => openLightbox(0)}
            >
              <img
                src={mainPhoto.url}
                alt={mainPhoto.caption || section.label}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Grid of smaller photos */}
          {gridPhotos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {gridPhotos.map((photo, photoIndex) => (
                <div
                  key={photo.id}
                  className="aspect-[4/3] rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => openLightbox(photoIndex + 1)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `${section.label} ${photoIndex + 2}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox Dialog */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-none">
            <div className="relative w-full h-[90vh] flex items-center justify-center">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Navigation */}
              {section.photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 z-10 text-white hover:bg-white/20"
                    onClick={prevPhoto}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 z-10 text-white hover:bg-white/20"
                    onClick={nextPhoto}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}

              {/* Current Photo */}
              <img
                src={section.photos[currentPhotoIndex]?.url}
                alt={section.photos[currentPhotoIndex]?.caption || ''}
                className="max-w-full max-h-full object-contain"
              />

              {/* Photo Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                {currentPhotoIndex + 1} / {section.photos.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

PhotoSectionComponent.displayName = 'PhotoSection';

export const PhotoSection = memo(PhotoSectionComponent);
