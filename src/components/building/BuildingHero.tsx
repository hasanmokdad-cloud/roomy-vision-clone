import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface BuildingHeroProps {
  images: string[];
  displayName: string;
  onImageClick?: (images: string[], index: number) => void;
}

/**
 * BuildingHero - Hero image section for building detail pages.
 * 
 * Displays the main building image(s) in a carousel format with
 * optional click-to-expand functionality.
 */
export function BuildingHero({ images, displayName, onImageClick }: BuildingHeroProps) {
  if (images.length === 0) {
    return (
      <Card className="border-0 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl">
        <CardContent className="p-0 h-[400px] md:h-[500px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold gradient-text mb-4">
              {displayName.charAt(0)}
            </div>
            <p className="text-xl text-muted-foreground">{displayName}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Carousel className="w-full">
      <CarouselContent>
        {images.map((img, idx) => (
          <CarouselItem key={idx}>
            <Card className="border-0 overflow-hidden rounded-2xl">
              <CardContent className="p-0 relative">
                <img
                  src={img}
                  alt={`${displayName} - Image ${idx + 1}`}
                  loading="lazy"
                  className="w-full h-[400px] md:h-[500px] object-cover cursor-pointer"
                  onClick={() => onImageClick?.(images, idx)}
                />
                {/* Subtle gradient overlay for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent pointer-events-none" />
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      {images.length > 1 && (
        <>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </>
      )}
    </Carousel>
  );
}

export default BuildingHero;
