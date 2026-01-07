import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share, Heart } from 'lucide-react';

interface PhotoTourHeaderProps {
  apartmentName: string;
  apartmentId: string;
  onShare?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

function PhotoTourHeaderComponent({
  apartmentName,
  apartmentId,
  onShare,
  onSave,
  isSaved = false,
}: PhotoTourHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(`/apartments/${apartmentId}`);
  };

  return (
    <header className="sticky top-0 z-20 bg-background border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left - Back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold truncate max-w-[200px] md:max-w-none">
            {apartmentName}
          </h1>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
          >
            <Share className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Share</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
          >
            <Heart className={`h-4 w-4 mr-2 ${isSaved ? 'fill-destructive text-destructive' : ''}`} />
            <span className="hidden md:inline">Save</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export const PhotoTourHeader = memo(PhotoTourHeaderComponent);
