import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CameraIcon from '@/assets/camera-icon.avif';
import { PhotoUploadModal } from '../PhotoUploadModal';
import { cn } from '@/lib/utils';
import { usePropertyTerminology } from '@/hooks/use-property-terminology';

interface PhotosStepProps {
  coverImage: string;
  galleryImages: string[];
  onCoverChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
  propertyType?: string;
}

export function PhotosStep({ 
  coverImage, 
  galleryImages, 
  onCoverChange, 
  onGalleryChange,
  propertyType = 'dorm'
}: PhotosStepProps) {
  const { dormLabel } = usePropertyTerminology(propertyType);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'cover' | 'gallery'>('gallery');
  const [coverImageLoaded, setCoverImageLoaded] = useState(false);
  const [galleryImagesLoaded, setGalleryImagesLoaded] = useState<Record<number, boolean>>({});

  // Reset cover image loaded state when cover image changes
  useEffect(() => {
    setCoverImageLoaded(false);
  }, [coverImage]);

  // Reset gallery image loaded state when gallery images change
  useEffect(() => {
    setGalleryImagesLoaded({});
  }, [galleryImages.length]);

  const handleModalUpload = (urls: string[]) => {
    if (urls.length === 0) return;
    
    if (uploadMode === 'cover') {
      onCoverChange(urls[0]);
      toast({ title: 'Cover photo uploaded!' });
    } else {
      onGalleryChange([...galleryImages, ...urls]);
      toast({ title: `${urls.length} photo(s) uploaded!` });
    }
    
    setUploadModalOpen(false);
  };

  const openCoverModal = () => {
    setUploadMode('cover');
    setUploadModalOpen(true);
  };

  const openGalleryModal = () => {
    setUploadMode('gallery');
    setUploadModalOpen(true);
  };

  const removeGalleryImage = (index: number) => {
    onGalleryChange(galleryImages.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
            Add photos of your {dormLabel}
          </h1>
        </motion.div>

        {/* Cover Photo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label className="block text-sm font-medium text-foreground mb-2">
            Cover Photo (Exterior) *
          </label>
          <div className="relative">
            {coverImage ? (
              <div className="relative h-[200px] lg:h-[240px] rounded-xl overflow-hidden border border-border">
                {!coverImageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                <img 
                  src={coverImage} 
                  alt="Cover" 
                  className={cn("w-full h-full object-cover transition-opacity", !coverImageLoaded && "opacity-0")}
                  onLoad={() => setCoverImageLoaded(true)}
                />
                <button
                  onClick={() => onCoverChange('')}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={openCoverModal}
                className="flex flex-col items-center justify-center h-[200px] lg:h-[240px] rounded-xl border border-dashed border-muted-foreground/40 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <img 
                  src={CameraIcon} 
                  alt="Camera" 
                  className="w-16 h-16 lg:w-20 lg:h-20 mb-4 object-contain opacity-60" 
                />
                <button 
                  type="button"
                  className="px-5 py-2 bg-background border border-foreground rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  Add photos
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Gallery Photos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-foreground mb-2">
            Gallery Photos (Common Areas, Lounge, Gym, Rooftop, Pool...) - Optional
          </label>
          
          {galleryImages.length === 0 ? (
            <div 
              onClick={openGalleryModal}
              className="flex flex-col items-center justify-center h-[160px] lg:h-[180px] rounded-xl border border-dashed border-muted-foreground/40 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <img 
                src={CameraIcon} 
                alt="Camera" 
                className="w-12 h-12 lg:w-14 lg:h-14 mb-3 object-contain opacity-60" 
              />
              <button 
                type="button"
                className="px-5 py-2 bg-background border border-foreground rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                Add photos
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {galleryImages.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                    {!galleryImagesLoaded[index] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    <img 
                      src={url} 
                      alt={`Gallery ${index + 1}`} 
                      className={cn("w-full h-full object-cover transition-opacity", !galleryImagesLoaded[index] && "opacity-0")}
                      onLoad={() => setGalleryImagesLoaded(prev => ({ ...prev, [index]: true }))}
                    />
                    <button
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {galleryImages.length < 10 && (
                  <div 
                    onClick={openGalleryModal}
                    className="flex flex-col items-center justify-center aspect-square rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <img 
                      src={CameraIcon} 
                      alt="Add" 
                      className="w-8 h-8 mb-1 object-contain opacity-60" 
                    />
                    <span className="text-xs text-muted-foreground">Add</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {galleryImages.length}/10 photos
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Upload Modal */}
      <PhotoUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUpload={handleModalUpload}
        maxFiles={10}
        currentCount={uploadMode === 'gallery' ? galleryImages.length : 0}
        isCover={uploadMode === 'cover'}
      />
    </div>
  );
}
