import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Grid2X2, Heart, Share } from 'lucide-react';
import type { ApartmentPhoto } from '@/types/apartmentDetail';

interface ApartmentPhotoCollageProps {
  apartmentId: string;
  photos: ApartmentPhoto[];
  onShare?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

function ApartmentPhotoCollageComponent({
  apartmentId,
  photos,
  onShare,
  onSave,
  isSaved = false,
}: ApartmentPhotoCollageProps) {
  const navigate = useNavigate();

  const handleShowAllPhotos = () => {
    navigate(`/apartments/${apartmentId}/photos`);
  };

  // Get photos for collage layout
  const mainPhoto = photos[0];
  const sidePhotos = photos.slice(1, 5);

  if (photos.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] md:aspect-[2/1] bg-muted rounded-xl flex items-center justify-center">
        <span className="text-muted-foreground">No photos available</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Photo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-xl overflow-hidden">
        {/* Main Photo - spans 2 columns on desktop */}
        <div 
          className="md:col-span-2 md:row-span-2 relative cursor-pointer group"
          onClick={handleShowAllPhotos}
        >
          <img
            src={mainPhoto.url}
            alt={mainPhoto.caption || 'Apartment photo'}
            className="w-full h-64 md:h-full object-cover group-hover:brightness-90 transition-all"
          />
        </div>

        {/* Side Photos - 2x2 grid on desktop */}
        {sidePhotos.map((photo, index) => (
          <div 
            key={photo.id}
            className={`hidden md:block relative cursor-pointer group ${
              index >= 2 ? 'md:block' : ''
            }`}
            onClick={handleShowAllPhotos}
          >
            <img
              src={photo.url}
              alt={photo.caption || `Photo ${index + 2}`}
              className="w-full h-32 md:h-full object-cover group-hover:brightness-90 transition-all"
            />
          </div>
        ))}
      </div>

      {/* Action Buttons - Top Right */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm"
          onClick={onShare}
        >
          <Share className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm"
          onClick={onSave}
        >
          <Heart className={`h-4 w-4 mr-2 ${isSaved ? 'fill-destructive text-destructive' : ''}`} />
          Save
        </Button>
      </div>

      {/* Show All Photos Button - Bottom Right */}
      <Button
        variant="secondary"
        size="sm"
        className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm"
        onClick={handleShowAllPhotos}
      >
        <Grid2X2 className="h-4 w-4 mr-2" />
        Show all photos
      </Button>
    </div>
  );
}

export const ApartmentPhotoCollage = memo(ApartmentPhotoCollageComponent);
