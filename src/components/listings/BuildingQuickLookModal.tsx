import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, 
  CheckCircle, 
  MessageSquare, 
  Bed, 
  DoorOpen,
  Building2
} from 'lucide-react';
import { getAmenityIcon } from '@/utils/amenityIcons';
import { useIsMobile } from '@/hooks/use-mobile';

interface BuildingQuickLookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building: {
    id: string;
    dorm_name: string;
    area?: string;
    address?: string;
    cover_image?: string;
    image_url?: string;
    amenities?: string[];
    verification_status?: string;
    room_types_json?: any;
    gallery_images?: string[];
    property_type?: string;
    gender_preference?: string;
    monthly_price?: number;
    price?: number;
  };
}

const BuildingQuickLookContent = memo(({ 
  building, 
  onClose 
}: { 
  building: BuildingQuickLookModalProps['building'];
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  
  const roomTypes = Array.isArray(building.room_types_json) ? building.room_types_json : [];
  const isVerified = building.verification_status === 'Verified';
  const dormImage = building.cover_image || building.image_url || '/placeholder.svg';
  const isApartmentBuilding = building.property_type === 'apartment';
  
  // Calculate availability summary
  const roomCount = roomTypes.length || 1;
  const bedCount = roomTypes.reduce((sum: number, r: any) => sum + (r.capacity || 1), 0) || roomCount;
  const startingPrice = roomTypes.length > 0 
    ? Math.min(...roomTypes.map((r: any) => r.price)) 
    : building.monthly_price || building.price || 0;

  const handleViewBuilding = () => {
    onClose();
    navigate(`/dorm/${building.id}`);
  };

  const handleContact = () => {
    // Dispatch custom event to open chatbot
    window.dispatchEvent(new CustomEvent('openRoomyChatbot', {
      detail: { 
        dormContext: {
          dormId: building.id,
          dormName: building.dorm_name,
          initialPrompt: `Tell me about ${building.dorm_name}` 
        }
      }
    }));
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mini Header with Image */}
      <div className="relative">
        <img
          src={dormImage}
          alt={building.dorm_name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {isVerified && (
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {isApartmentBuilding && (
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30 backdrop-blur-sm">
              <Building2 className="w-3 h-3 mr-1" />
              Apartment Building
            </Badge>
          )}
        </div>

        {/* Name & Location overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">
            {building.dorm_name}
          </h3>
          <div className="flex items-center gap-1 text-white/80 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{building.area}</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-5">
          {/* Full Address */}
          {building.address && (
            <div className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-1">Full Address</p>
              <p className="text-sm text-foreground">{building.address}</p>
            </div>
          )}

          {/* Price & Availability Summary */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Starting Price</p>
              <p className="text-2xl font-bold text-foreground">${startingPrice}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            </div>
            <div className="flex gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-1">
                  <DoorOpen className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">{roomCount} {roomCount === 1 ? 'room' : 'rooms'}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/10 mb-1">
                  <Bed className="w-5 h-5 text-secondary" />
                </div>
                <p className="text-xs text-muted-foreground">{bedCount} {bedCount === 1 ? 'bed' : 'beds'}</p>
              </div>
            </div>
          </div>

          {/* Gender Preference */}
          {building.gender_preference && (
            <Badge variant="outline" className="w-fit">
              {building.gender_preference === 'Male' && '♂ Male Only'}
              {building.gender_preference === 'Female' && '♀ Female Only'}
              {building.gender_preference === 'Mixed' && '⚥ Co-ed'}
            </Badge>
          )}

          {/* Amenities Grid */}
          {building.amenities && building.amenities.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Services & Amenities</p>
              <div className="grid grid-cols-2 gap-2">
                {building.amenities.slice(0, 8).map((amenity, idx) => {
                  const IconComponent = getAmenityIcon(amenity);
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 text-sm">
                      <IconComponent className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-foreground truncate">{amenity}</span>
                    </div>
                  );
                })}
                {building.amenities.length > 8 && (
                  <div className="flex items-center justify-center p-2 rounded-lg bg-muted/20 text-sm text-muted-foreground">
                    +{building.amenities.length - 8} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photo Strip */}
          {building.gallery_images && building.gallery_images.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">More Photos</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {building.gallery_images.slice(0, 5).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${building.dorm_name} - ${idx + 1}`}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Action Buttons - Fixed at bottom */}
      <div className="p-4 border-t border-border space-y-2">
        <Button onClick={handleViewBuilding} className="w-full" size="lg">
          View Building Details
        </Button>
        <Button onClick={handleContact} variant="outline" className="w-full" size="lg">
          <MessageSquare className="w-4 h-4 mr-2" />
          Chat with Roomy AI
        </Button>
      </div>
    </div>
  );
});

BuildingQuickLookContent.displayName = 'BuildingQuickLookContent';

export const BuildingQuickLookModal = memo(({ 
  open, 
  onOpenChange, 
  building 
}: BuildingQuickLookModalProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{building.dorm_name}</DrawerTitle>
          </DrawerHeader>
          <BuildingQuickLookContent 
            building={building} 
            onClose={() => onOpenChange(false)} 
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{building.dorm_name}</SheetTitle>
        </SheetHeader>
        <BuildingQuickLookContent 
          building={building} 
          onClose={() => onOpenChange(false)} 
        />
      </SheetContent>
    </Sheet>
  );
});

BuildingQuickLookModal.displayName = 'BuildingQuickLookModal';
