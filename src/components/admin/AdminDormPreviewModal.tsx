import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, MapPin, DollarSign, Users, Phone, Mail, Globe, Calendar, Image as ImageIcon } from "lucide-react";

interface AdminDormPreviewModalProps {
  dorm: any;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminDormPreviewModal({ dorm, isOpen, onClose }: AdminDormPreviewModalProps) {
  if (!dorm) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">Dorm Preview</DialogTitle>
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

            {/* Amenities */}
            {dorm.amenities && dorm.amenities.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Amenities</h4>
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
                <p>📦 Available: {dorm.available ? 'Yes' : 'No'}</p>
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
