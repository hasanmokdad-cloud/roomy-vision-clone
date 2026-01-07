import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import type { PhotoSection } from '@/types/apartmentDetail';

interface SpacesSectionProps {
  apartmentId: string;
  sections: PhotoSection[];
}

function SpacesSectionComponent({ apartmentId, sections }: SpacesSectionProps) {
  const navigate = useNavigate();

  if (sections.length === 0) {
    return null;
  }

  const handleViewAllPhotos = (sectionIndex: number) => {
    navigate(`/apartments/${apartmentId}/photos#section-${sectionIndex}`);
  };

  return (
    <div className="py-6 border-b">
      <h3 className="text-xl font-semibold mb-4">Explore this home</h3>
      
      <div className="space-y-6">
        {sections.slice(0, 5).map((section, index) => (
          <div key={`${section.spaceType}-${section.spaceInstance || index}`}>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-lg">{section.label}</h4>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-primary"
                onClick={() => handleViewAllPhotos(index)}
              >
                View all
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Horizontal Photo Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {section.photos.slice(0, 6).map((photo, photoIndex) => (
                <div
                  key={photo.id}
                  className="flex-shrink-0 w-40 h-28 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleViewAllPhotos(index)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `${section.label} ${photoIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {sections.length > 5 && (
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate(`/apartments/${apartmentId}/photos`)}
        >
          View all spaces
        </Button>
      )}
    </div>
  );
}

export const SpacesSection = memo(SpacesSectionComponent);
