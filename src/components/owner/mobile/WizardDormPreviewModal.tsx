import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CinematicDormCard } from "@/components/listings/CinematicDormCard";
import { AlertCircle, Images, DoorOpen, DollarSign, Video } from "lucide-react";
import { WizardRoomData } from "./steps/RoomNamesStep";

interface WizardDormPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: {
    title: string;
    city: string;
    area: string;
    address: string;
    description: string;
    capacity: number;
    coverImage: string;
    galleryImages: string[];
    amenities: string[];
    shuttle: boolean;
    genderPreference: string;
    rooms: WizardRoomData[];
  };
  submitting?: boolean;
}

export function WizardDormPreviewModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData,
  submitting = false 
}: WizardDormPreviewModalProps) {
  // Transform form data for CinematicDormCard
  const previewDorm = {
    id: "preview-temp-id",
    dorm_name: formData.title,
    area: formData.area,
    address: formData.address,
    cover_image: formData.coverImage || undefined,
    verification_status: "Pending",
    amenities: formData.amenities || [],
    shuttle: formData.shuttle,
    gender_preference: formData.genderPreference || undefined,
  };

  const rooms = formData.rooms || [];
  const roomsWithPrice = rooms.filter(r => r.price !== null && r.price > 0);
  const roomsWithMedia = rooms.filter(r => r.images.length > 0 || r.video_url);
  const roomTypes = [...new Set(rooms.map(r => r.type).filter(Boolean))];
  const priceRange = roomsWithPrice.length > 0 
    ? {
        min: Math.min(...roomsWithPrice.map(r => r.price!)),
        max: Math.max(...roomsWithPrice.map(r => r.price!))
      }
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">Preview Your Listing</DialogTitle>
          <DialogDescription>
            This is how students will see your dorm listing
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-12rem)]">
          <div className="space-y-6 px-1">
            {/* Dorm Card Preview */}
            <div className="flex justify-center py-6 bg-gradient-to-b from-muted/30 to-background rounded-xl">
              <div className="w-full max-w-md">
                <CinematicDormCard dorm={previewDorm} index={0} />
              </div>
            </div>

            {/* Gallery Images Preview */}
            {formData.galleryImages.length > 0 && (
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Images className="w-4 h-4" />
                  Gallery Images ({formData.galleryImages.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {formData.galleryImages.slice(0, 6).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ))}
                  {formData.galleryImages.length > 6 && (
                    <div className="flex items-center justify-center h-24 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">
                        +{formData.galleryImages.length - 6} more
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rooms Summary */}
            {rooms.length > 0 && (
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DoorOpen className="w-4 h-4" />
                  Rooms ({rooms.length})
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="w-4 h-4" />
                      Price Range
                    </div>
                    <p className="font-semibold">
                      {priceRange 
                        ? priceRange.min === priceRange.max 
                          ? `$${priceRange.min}/mo`
                          : `$${priceRange.min} - $${priceRange.max}/mo`
                        : "Not set"}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground mb-1">With Media</p>
                    <p className="font-semibold">{roomsWithMedia.length} of {rooms.length}</p>
                  </div>
                </div>

                {/* Room Types */}
                {roomTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {roomTypes.map(type => {
                      const count = rooms.filter(r => r.type === type).length;
                      return (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type} ({count})
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* Sample Room Cards */}
                <div className="space-y-2">
                  {rooms.slice(0, 3).map((room) => (
                    <div key={room.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                      {room.images.length > 0 ? (
                        <img
                          src={room.images[0]}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <DoorOpen className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{room.name || "Unnamed"}</p>
                        <p className="text-sm text-muted-foreground">
                          {room.type} • {room.price ? `$${room.price}/mo` : "No price"}
                        </p>
                      </div>
                      {room.video_url && (
                        <Video className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                  {rooms.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      +{rooms.length - 3} more rooms
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This is a preview. Your listing (including all {rooms.length} rooms) will be submitted 
                with "Pending" status and will require admin approval before being visible to students.
              </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Back to Review
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Looks Good, Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
