import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Home, Users, Heart, Calendar, MessageSquare, Play, AlertTriangle, Eye } from "lucide-react";
import { WizardRoomData } from "./steps/RoomNamesStep";

interface WizardRoomPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: WizardRoomData;
}

export function WizardRoomPreviewModal({ isOpen, onClose, room }: WizardRoomPreviewModalProps) {
// Calculate if room is full based on capacity
  const capacity = room.capacity || 1;
  const capacityOccupied = room.capacity_occupied || 0;
  const isFull = capacityOccupied >= capacity;
  const capacityDisplay = `${capacityOccupied}/${capacity}`;
  
  // Deduplicated images
  const displayImages = room.images.length > 0 ? [...new Set(room.images)] : [];
  
  // Determine lowest price for tiered pricing
  const getPriceDisplay = () => {
    const lowerType = (room.type || '').toLowerCase();
    const isDouble = lowerType.includes('double');
    const isTriple = lowerType.includes('triple');
    const hasTieredPricing = (isDouble || isTriple) && (room.price_1_student || room.price_2_students);
    
    if (hasTieredPricing && room.price) {
      const prices = [room.price];
      if (room.price_1_student) prices.push(room.price_1_student);
      if (room.price_2_students) prices.push(room.price_2_students);
      const minPrice = Math.min(...prices);
      return { isStartingFrom: true, price: minPrice };
    }
    
    return { isStartingFrom: false, price: room.price || 0 };
  };

  const priceInfo = getPriceDisplay();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="text-lg font-bold">Student View Preview</DialogTitle>
          <DialogDescription className="text-xs">
            This is how students will see this room
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-6rem)]">
          <div className="p-4">
            {/* Room Card Preview - Matching EnhancedRoomCard */}
            <Card className="overflow-hidden shadow-lg">
              <CardContent className="p-0">
                {/* Image Section */}
                <div className="relative">
                  <div className="relative overflow-hidden">
                    {displayImages.length === 0 && !room.video_url ? (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">No media available</p>
                      </div>
                    ) : displayImages.length > 1 || room.video_url ? (
                      <Carousel className="w-full">
                        <CarouselContent>
                          {displayImages.slice(0, 10).map((img, idx) => (
                            <CarouselItem key={idx}>
                              <div className="relative">
                                <img
                                  src={img}
                                  alt={`${room.name} - Image ${idx + 1}`}
                                  className="w-full h-48 object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                                  <Button size="icon" variant="secondary" className="bg-black/60 text-white">
                                    <Eye className="w-5 h-5" />
                                  </Button>
                                </div>
                              </div>
                            </CarouselItem>
                          ))}
                          {room.video_url && (
                            <CarouselItem>
                              <div className="relative w-full h-48 bg-black">
                                <video
                                  src={room.video_url}
                                  className="w-full h-48 object-cover"
                                  muted
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <Button size="icon" className="w-14 h-14 rounded-full bg-white hover:bg-white/90">
                                    <Play className="w-6 h-6 text-black" />
                                  </Button>
                                </div>
                              </div>
                            </CarouselItem>
                          )}
                        </CarouselContent>
                        <CarouselPrevious className="left-2 bg-white hover:bg-white" />
                        <CarouselNext className="right-2 bg-white hover:bg-white" />
                      </Carousel>
                    ) : (
                      <div className="relative">
                        <img
                          src={displayImages[0]}
                          alt={room.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                          <Button size="icon" variant="secondary" className="bg-black/60 text-white">
                            <Eye className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Save Button (decorative) */}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-white hover:bg-white shadow-lg border border-white/50"
                    disabled
                  >
                    <Heart className="w-4 h-4 text-gray-700" />
                  </Button>

                  {/* Availability Badge */}
                  <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      ✓ Available
                    </Badge>
                    <Badge 
                      variant={isFull ? "destructive" : "secondary"}
                      className="bg-background/90 text-foreground border text-xs"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      {capacityDisplay}
                      {isFull && ' (Full)'}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
                        <Home className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base">{room.name || "Unnamed Room"}</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      {priceInfo.isStartingFrom && (
                        <div className="text-xs text-foreground/60">Starting from</div>
                      )}
                      <div className="text-xl font-bold text-primary">
                        ${priceInfo.price || '—'}
                      </div>
                      <div className="text-xs text-foreground/60">per month</div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {room.type && (
                      <div className="flex items-center gap-1 text-foreground font-medium col-span-2">
                        <span>{room.type}</span>
                      </div>
                    )}
                    
                    {room.capacity && (
                      <div className="flex items-center gap-1 text-foreground/70">
                        <Users className="w-4 h-4" />
                        <span>{room.capacity} student{room.capacity > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-foreground/70">
                      <span>Deposit: ${room.deposit || room.price || '—'}</span>
                    </div>
                    
                    {room.area_m2 && (
                      <div className="text-foreground/70 col-span-2">
                        Area: {room.area_m2}m²
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={isFull}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {isFull ? 'Full' : 'Reserve'}
                    </Button>
                  </div>

                  {/* Non-refundable notice */}
                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1 flex-wrap">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Deposits and platform fees are non-refundable.</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tiered Pricing Details (if applicable) */}
            {(room.price_1_student || room.price_2_students) && (
              <Card className="mt-3 bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <p className="text-sm font-medium mb-2">Tiered Pricing</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {room.price_1_student && (
                      <p>1 student: ${room.price_1_student}/mo</p>
                    )}
                    {room.price_2_students && (
                      <p>2 students: ${room.price_2_students}/mo</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

      </DialogContent>
    </Dialog>
  );
}
