import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, GripVertical } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CameraIcon from '@/assets/camera-icon.avif';
import { PhotoUploadModal } from '../PhotoUploadModal';
import { cn } from '@/lib/utils';

export interface BuildingImage {
  sectionType: string;
  url: string;
  sortOrder: number;
}

interface PhotosStepProps {
  buildingImages: BuildingImage[];
  onBuildingImagesChange: (images: BuildingImage[]) => void;
  selectedAmenities: string[];
  hasReception: boolean;
  receptionPerBlock: boolean;
  blockCount: number;
  propertyType?: string;
}

const SHARED_SPACE_ORDER = [
  { id: 'Study Room', sectionType: 'study_room', emoji: '📚', label: 'Study Room' },
  { id: 'Common Area', sectionType: 'common_area', emoji: '🛋', label: 'Common Area' },
  { id: 'Garden', sectionType: 'garden', emoji: '🌿', label: 'Garden' },
  { id: 'Gym', sectionType: 'gym', emoji: '💪', label: 'Gym' },
  { id: 'Pool', sectionType: 'pool', emoji: '🏊', label: 'Pool' },
  { id: 'Kitchen', sectionType: 'kitchen', emoji: '🍳', label: 'Kitchen' },
  { id: 'Laundry', sectionType: 'laundry', emoji: '👕', label: 'Laundry' },
  { id: 'Terrace', sectionType: 'terrace', emoji: '🌅', label: 'Terrace' },
  { id: 'Rooftop', sectionType: 'rooftop', emoji: '🏙', label: 'Rooftop' },
];

export function PhotosStep({ 
  buildingImages,
  onBuildingImagesChange,
  selectedAmenities,
  hasReception,
  receptionPerBlock,
  blockCount,
  propertyType = 'dorm',
}: PhotosStepProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadSection, setUploadSection] = useState<string>('exterior');
  const [imageLoadState, setImageLoadState] = useState<Record<string, boolean>>({});

  const getImagesForSection = (sectionType: string) =>
    buildingImages
      .filter(img => img.sectionType === sectionType)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleUpload = (urls: string[]) => {
    if (urls.length === 0) return;
    const existing = getImagesForSection(uploadSection);
    const maxSort = existing.length > 0 ? Math.max(...existing.map(i => i.sortOrder)) + 1 : 0;
    const newImages: BuildingImage[] = urls.map((url, i) => ({
      sectionType: uploadSection,
      url,
      sortOrder: maxSort + i,
    }));
    onBuildingImagesChange([...buildingImages, ...newImages]);
    toast({ title: `${urls.length} photo(s) uploaded!` });
    setUploadModalOpen(false);
  };

  const removeImage = (sectionType: string, url: string) => {
    onBuildingImagesChange(buildingImages.filter(img => !(img.sectionType === sectionType && img.url === url)));
  };

  const openUploadFor = (section: string) => {
    setUploadSection(section);
    setUploadModalOpen(true);
  };

  // Build gallery sections from selected amenities
  const gallerySections: { sectionType: string; label: string; emoji: string }[] = [];
  for (const space of SHARED_SPACE_ORDER) {
    if (selectedAmenities.includes(space.id)) {
      gallerySections.push(space);
    }
  }
  // Reception containers
  if (hasReception) {
    if (receptionPerBlock && blockCount > 1) {
      for (let i = 1; i <= blockCount; i++) {
        gallerySections.push({
          sectionType: `reception_block_${i}`,
          label: `Reception — Block ${i}`,
          emoji: '🛎',
        });
      }
    } else {
      gallerySections.push({ sectionType: 'reception', label: 'Reception', emoji: '🛎' });
    }
  }

  const exteriorImages = getImagesForSection('exterior');
  const additionalImages = getImagesForSection('additional');

  const renderImageGrid = (sectionType: string, images: BuildingImage[], maxImages: number) => {
    const currentCount = images.length;
    return (
      <div className="space-y-2">
        {currentCount === 0 ? (
          <div 
            onClick={() => openUploadFor(sectionType)}
            className="flex flex-col items-center justify-center h-[120px] rounded-xl border border-dashed border-muted-foreground/40 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <img src={CameraIcon} alt="Camera" className="w-10 h-10 mb-2 object-contain opacity-60" />
            <span className="text-xs text-muted-foreground">Add photos</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, index) => (
              <div key={`${sectionType}-${index}`} className="relative aspect-square rounded-lg overflow-hidden">
                {!imageLoadState[`${sectionType}-${index}`] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                <img
                  src={img.url}
                  alt={`${sectionType} ${index + 1}`}
                  className={cn("w-full h-full object-cover transition-opacity", !imageLoadState[`${sectionType}-${index}`] && "opacity-0")}
                  onLoad={() => setImageLoadState(prev => ({ ...prev, [`${sectionType}-${index}`]: true }))}
                />
                <button
                  onClick={() => removeImage(sectionType, img.url)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
                {index === 0 && sectionType === 'exterior' && (
                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Cover</span>
                )}
              </div>
            ))}
            {currentCount < maxImages && (
              <div
                onClick={() => openUploadFor(sectionType)}
                className="flex flex-col items-center justify-center aspect-square rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <img src={CameraIcon} alt="Add" className="w-8 h-8 mb-1 object-contain opacity-60" />
                <span className="text-xs text-muted-foreground">Add</span>
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center">
          {currentCount}/{maxImages} photos
        </p>
      </div>
    );
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
            Add photos of your building
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base mt-2">
            Help tenants see your property — upload photos for each area of your building
          </p>
        </motion.div>

        {/* Section 1 — Cover Photo (Exterior) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <label className="block text-sm font-medium text-foreground mb-2">
            Cover Photo (Exterior) <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Upload up to 5 exterior photos. The first image will be shown as your building's main cover photo.
          </p>
          {renderImageGrid('exterior', exteriorImages, 5)}
        </motion.div>

        {/* Section 2 — Gallery Photos (Shared Spaces) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <label className="block text-sm font-medium text-foreground mb-1">
            Gallery Photos
          </label>
          <p className="text-xs text-muted-foreground mb-4">
            Upload photos for each shared space in your building. Only spaces you selected earlier will appear here.
          </p>

          {gallerySections.length === 0 ? (
            <div className="p-6 rounded-xl bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">
                No shared spaces selected. If your building has shared spaces, go back to add them and upload photos here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {gallerySections.map((section) => {
                const sectionImages = getImagesForSection(section.sectionType);
                return (
                  <div key={section.sectionType}>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {section.emoji} {section.label}
                    </label>
                    {renderImageGrid(section.sectionType, sectionImages, 5)}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Section 3 — Additional Photos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium text-foreground mb-1">
            Additional Photos
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Anything else you'd like to showcase about your building
          </p>
          {renderImageGrid('additional', additionalImages, 5)}
        </motion.div>
      </div>

      {/* Upload Modal */}
      <PhotoUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUpload={handleUpload}
        maxFiles={5}
        currentCount={getImagesForSection(uploadSection).length}
        isCover={uploadSection === 'exterior'}
      />
    </div>
  );
}
