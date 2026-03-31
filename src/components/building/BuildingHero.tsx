import { useNavigate } from 'react-router-dom';
import { Grid2x2, Share, Heart } from 'lucide-react';
import { ShareButton } from '@/components/shared/ShareButton';

interface BuildingHeroProps {
  images: string[];
  displayName: string;
  dormId: string;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onImageClick?: (images: string[], index: number) => void;
}

export function BuildingHero({ images, displayName, dormId, isSaved, onToggleSave, onImageClick }: BuildingHeroProps) {
  const navigate = useNavigate();

  // Separate exterior (first image) from the rest
  const exteriorImage = images[0] || '';
  const otherImages = images.slice(1);

  // Randomly pick up to 4 from non-exterior images
  const shuffled = [...otherImages].sort(() => Math.random() - 0.5);
  const gridImages = shuffled.slice(0, 4);

  const totalImages = images.length;
  const showAllButton = totalImages > 1;

  if (totalImages === 0) {
    return (
      <div className="w-full h-[400px] md:h-[480px] bg-muted rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-bold text-muted-foreground/30 mb-2">{displayName.charAt(0)}</div>
          <p className="text-muted-foreground">{displayName}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Title row above grid */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">{displayName}</h1>
        <div className="flex items-center gap-3">
          <ShareButton dormId={dormId} dormName={displayName} />
          <button
            onClick={onToggleSave}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80 underline decoration-foreground/50"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* Image grid */}
      {totalImages === 1 ? (
        <div
          className="w-full h-[400px] md:h-[480px] rounded-xl overflow-hidden cursor-pointer"
          onClick={() => onImageClick?.(images, 0)}
        >
          <img src={exteriorImage} alt={displayName} className="w-full h-full object-cover" />
        </div>
      ) : totalImages === 2 ? (
        <div className="grid grid-cols-[3fr_2fr] gap-1.5 h-[400px] md:h-[480px] rounded-xl overflow-hidden">
          <div className="cursor-pointer" onClick={() => onImageClick?.(images, 0)}>
            <img src={exteriorImage} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <div className="relative cursor-pointer" onClick={() => onImageClick?.(images, 1)}>
            <img src={gridImages[0]} alt="" className="w-full h-full object-cover" />
            {showAllButton && <ShowAllButton onClick={() => navigate(`/dorm/${dormId}/photos`)} />}
          </div>
        </div>
      ) : totalImages === 3 ? (
        <div className="grid grid-cols-[3fr_2fr] gap-1.5 h-[400px] md:h-[480px] rounded-xl overflow-hidden">
          <div className="cursor-pointer" onClick={() => onImageClick?.(images, 0)}>
            <img src={exteriorImage} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-rows-2 gap-1.5">
            <div className="cursor-pointer" onClick={() => onImageClick?.(images, 1)}>
              <img src={gridImages[0]} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative cursor-pointer" onClick={() => onImageClick?.(images, 2)}>
              <img src={gridImages[1]} alt="" className="w-full h-full object-cover" />
              {showAllButton && <ShowAllButton onClick={() => navigate(`/dorm/${dormId}/photos`)} />}
            </div>
          </div>
        </div>
      ) : (
        // 4 or 5+ images: full 5-grid
        <div className="grid grid-cols-[3fr_1fr_1fr] gap-1.5 h-[400px] md:h-[480px] rounded-xl overflow-hidden">
          <div className="row-span-2 cursor-pointer" onClick={() => onImageClick?.(images, 0)}>
            <img src={exteriorImage} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <div className="cursor-pointer" onClick={() => onImageClick?.(images, 1)}>
            <img src={gridImages[0]} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="cursor-pointer" onClick={() => onImageClick?.(images, 2)}>
            <img src={gridImages[1]} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="cursor-pointer" onClick={() => onImageClick?.(images, 3)}>
            <img src={gridImages[2] || gridImages[0]} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative cursor-pointer" onClick={() => onImageClick?.(images, 4)}>
            <img src={gridImages[3] || gridImages[1] || gridImages[0]} alt="" className="w-full h-full object-cover" />
            {showAllButton && <ShowAllButton onClick={() => navigate(`/dorm/${dormId}/photos`)} />}
          </div>
        </div>
      )}
    </div>
  );
}

function ShowAllButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white text-foreground text-sm font-medium rounded-lg border border-foreground/20 shadow-sm hover:bg-white/90 transition-colors"
    >
      <Grid2x2 className="w-4 h-4" />
      Show all photos
    </button>
  );
}

export default BuildingHero;
