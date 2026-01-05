import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Building2, MapPin, DollarSign, Users, Phone, Mail, Globe, Calendar, Image as ImageIcon, DoorOpen, Video, ChevronDown, Maximize2 } from "lucide-react";
import { useState } from "react";

interface AdminDormPreviewModalProps {
  dorm: any;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminDormPreviewModal({ dorm, isOpen, onClose }: AdminDormPreviewModalProps) {
  const [roomsExpanded, setRoomsExpanded] = useState(true);
  
  if (!dorm) return null;

  const rooms = dorm.rooms || [];
  const roomTypes = [...new Set(rooms.map((r: any) => r.type).filter(Boolean))] as string[];
  const roomsWithMedia = rooms.filter((r: any) => (r.images && r.images.length > 0) || r.video_url).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">Dorm Preview</DialogTitle>
          <DialogDescription className="sr-only">
            Preview dorm details and information
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
            {/* Cover Image */}
            {dorm.image_url && (
              <div className="relative h-64 rounded-lg overflow-hidden">
                <img
                  src={dorm.image_url}
                  alt={dorm.name || dorm.dorm_name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Basic Info */}
            <div>
              <h3 className="text-xl font-bold mb-2">{dorm.name || dorm.dorm_name}</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="capitalize">
                  {dorm.verification_status || 'Pending'}
                </Badge>
                {dorm.gender_preference && (
                  <Badge variant="secondary">{dorm.gender_preference}</Badge>
                )}
              </div>
            </div>

            {/* Location & Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-foreground/70">{dorm.area || dorm.location}</p>
                    {dorm.address && (
                      <p className="text-xs text-foreground/60">{dorm.address}</p>
                    )}
                  </div>
                </div>

                {dorm.university && (
                  <div className="flex items-start gap-2">
                    <Building2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">University</p>
                      <p className="text-sm text-foreground/70">{dorm.university}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <DollarSign className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Price</p>
                    <p className="text-sm text-foreground/70">
                      ${dorm.monthly_price || dorm.price}/month
                    </p>
                  </div>
                </div>

                {dorm.capacity && (
                  <div className="flex items-start gap-2">
                    <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Capacity</p>
                      <p className="text-sm text-foreground/70">{dorm.capacity} students</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                {dorm.phone_number && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-foreground/70">{dorm.phone_number}</p>
                    </div>
                  </div>
                )}

                {dorm.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-foreground/70 break-all">{dorm.email}</p>
                    </div>
                  </div>
                )}

                {dorm.website && (
                  <div className="flex items-start gap-2">
                    <Globe className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Website</p>
                      <a
                        href={dorm.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {dorm.website}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Submitted</p>
                    <p className="text-sm text-foreground/70">
                      {new Date(dorm.created_at).toLocaleDateString()} at{' '}
                      {new Date(dorm.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {dorm.description && (
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-foreground/70 whitespace-pre-wrap">
                  {dorm.description}
                </p>
              </div>
            )}

            {/* Services & Amenities */}
            {dorm.amenities && dorm.amenities.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Services & Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {dorm.amenities.map((amenity: string) => (
                    <Badge key={amenity} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Features */}
            <div>
              <h4 className="font-semibold mb-2">Additional Features</h4>
              <div className="space-y-1 text-sm text-foreground/70">
                <p>🚌 Shuttle Service: {dorm.shuttle ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Gallery Images */}
            {dorm.gallery_images && dorm.gallery_images.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Gallery ({dorm.gallery_images.length} images)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dorm.gallery_images.map((url: string, idx: number) => (
                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={url}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rooms Section */}
            {rooms.length > 0 && (
              <Collapsible open={roomsExpanded} onOpenChange={setRoomsExpanded}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <DoorOpen className="w-4 h-4" />
                    Rooms ({rooms.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{roomsWithMedia} with media</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${roomsExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {/* Room Type Summary */}
                  {roomTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {roomTypes.map(type => {
                        const count = rooms.filter((r: any) => r.type === type).length;
                        return (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type} ({count})
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  {/* Individual Room Cards */}
                  <div className="space-y-3">
                    {rooms.map((room: any) => (
                      <div key={room.id} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium">{room.name}</p>
                            {room.type && (
                              <Badge variant="secondary" className="text-xs mt-1">{room.type}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {room.images && room.images.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <ImageIcon className="w-3 h-3 mr-1" />
                                {room.images.length}
                              </Badge>
                            )}
                            {room.video_url && (
                              <Badge variant="outline" className="text-xs">
                                <Video className="w-3 h-3 mr-1" />
                                Video
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Price:</span>
                            <p className="font-medium">${room.price}/mo</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Deposit:</span>
                            <p className="font-medium">${room.deposit || 0}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Capacity:</span>
                            <p className="font-medium">{room.capacity || '-'} ({room.capacity_occupied || 0} occupied)</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Area:</span>
                            <p className="font-medium">{room.area_m2 ? `${room.area_m2}m²` : '-'}</p>
                          </div>
                        </div>

                        {/* Tiered Pricing */}
                        {(room.price_1_student || room.price_2_students) && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Tiered Pricing:</p>
                            <div className="flex gap-3 text-xs">
                              {room.price_1_student && (
                                <span>1 student: ${room.price_1_student}/mo</span>
                              )}
                              {room.price_2_students && (
                                <span>2 students: ${room.price_2_students}/mo</span>
                              )}
                            </div>
                            {(room.deposit_1_student || room.deposit_2_students) && (
                              <div className="flex gap-3 text-xs mt-1 text-muted-foreground">
                                {room.deposit_1_student && (
                                  <span>Deposit (1): ${room.deposit_1_student}</span>
                                )}
                                {room.deposit_2_students && (
                                  <span>Deposit (2): ${room.deposit_2_students}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Room Images Thumbnails */}
                        {room.images && room.images.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex gap-2 flex-wrap">
                              {room.images.slice(0, 4).map((img: string, idx: number) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt=""
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              ))}
                              {room.images.length > 4 && (
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                  +{room.images.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Rejection Reason (if rejected) */}
            {dorm.verification_status === 'Rejected' && dorm.rejection_reason && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-semibold text-destructive mb-2">Rejection Reason</h4>
                <p className="text-sm text-foreground/70">{dorm.rejection_reason}</p>
                {dorm.reviewed_at && (
                  <p className="text-xs text-foreground/50 mt-2">
                    Reviewed on {new Date(dorm.reviewed_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
