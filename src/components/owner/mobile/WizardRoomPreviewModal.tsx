import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, Users, Maximize2, Video, X } from "lucide-react";
import { WizardRoomData } from "./steps/RoomNamesStep";

interface WizardRoomPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: WizardRoomData;
}

export function WizardRoomPreviewModal({ isOpen, onClose, room }: WizardRoomPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Room Preview</DialogTitle>
          <DialogDescription>
            This is how students will see this room
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <div className="space-y-4">
            {/* Main Image */}
            {room.images.length > 0 ? (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                <img
                  src={room.images[0]}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
                {room.images.length > 1 && (
                  <Badge className="absolute bottom-2 right-2 bg-background/80 text-foreground">
                    +{room.images.length - 1} photos
                  </Badge>
                )}
              </div>
            ) : (
              <div className="aspect-video rounded-xl bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No images</span>
              </div>
            )}

            {/* Room Name & Type */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{room.name || "Unnamed Room"}</h3>
                {room.type && (
                  <Badge variant="secondary" className="mt-1">{room.type}</Badge>
                )}
              </div>
            </div>

            {/* Price & Deposit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" />
                  Monthly Price
                </div>
                <p className="font-semibold text-lg">
                  {room.price ? `$${room.price}` : "Not set"}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" />
                  Deposit
                </div>
                <p className="font-semibold text-lg">
                  {room.deposit ? `$${room.deposit}` : "Not set"}
                </p>
              </div>
            </div>

            {/* Capacity & Area */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  Capacity
                </div>
                <p className="font-semibold">
                  {room.capacity ? `${room.capacity} student${room.capacity > 1 ? 's' : ''}` : "Not set"}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Maximize2 className="w-4 h-4" />
                  Area
                </div>
                <p className="font-semibold">
                  {room.area_m2 ? `${room.area_m2} m²` : "Not set"}
                </p>
              </div>
            </div>

            {/* Tiered Pricing (if applicable) */}
            {(room.price_1_student || room.price_2_students) && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-sm font-medium mb-2">Tiered Pricing</p>
                <div className="space-y-1 text-sm">
                  {room.price_1_student && (
                    <p>1 student: ${room.price_1_student}/mo</p>
                  )}
                  {room.price_2_students && (
                    <p>2 students: ${room.price_2_students}/mo</p>
                  )}
                </div>
              </div>
            )}

            {/* Video Indicator */}
            {room.video_url && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="w-4 h-4" />
                Video tour available
              </div>
            )}

            {/* Gallery Thumbnails */}
            {room.images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {room.images.slice(1, 5).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ))}
                {room.images.length > 5 && (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
                    +{room.images.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
