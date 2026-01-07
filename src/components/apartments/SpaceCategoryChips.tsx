import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SPACE_TYPE_LABELS, type SpaceType, type PhotoSection } from '@/types/apartmentDetail';

interface SpaceCategoryChipsProps {
  sections: PhotoSection[];
  activeSection?: number;
  onSectionClick: (index: number) => void;
}

function SpaceCategoryChipsComponent({
  sections,
  activeSection,
  onSectionClick,
}: SpaceCategoryChipsProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b py-3">
      <ScrollArea className="w-full">
        <div className="flex gap-2 px-4 md:px-0">
          {sections.map((section, index) => (
            <Button
              key={`${section.spaceType}-${section.spaceInstance || index}`}
              variant={activeSection === index ? 'default' : 'outline'}
              size="sm"
              className="flex-shrink-0 rounded-full"
              onClick={() => onSectionClick(index)}
            >
              {section.label}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </div>
  );
}

export const SpaceCategoryChips = memo(SpaceCategoryChipsComponent);
