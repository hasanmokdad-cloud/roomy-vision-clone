import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CinematicDormCard } from "@/components/listings/CinematicDormCard";
import { AlertCircle, Images } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DormPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: {
    name: string;
    address: string;
    area: string;
    description: string;
    capacity: string;
    image_url: string;
    amenities: string[];
    withinWalkingDistance: boolean;
    shuttle: boolean;
    gender_preference: string;
    gallery_images: string[];
  };
}

export function DormPreviewModal({ isOpen, onClose, onSubmit, formData }: DormPreviewModalProps) {
  // Transform form data to match CinematicDormCard props
  const previewDorm = {
    id: "preview-temp-id",
    dorm_name: formData.name,
    area: formData.area,
    address: formData.address,
    cover_image: formData.image_url || undefined,
    verification_status: "Pending",
    amenities: formData.amenities || [],
    shuttle: formData.shuttle,
    gender_preference: formData.gender_preference || undefined,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">Preview Your Listing</DialogTitle>
          <DialogDescription>
            This is how students will see your dorm listing
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">

          {/* Preview Card */}
          <div className="flex justify-center py-8 bg-gradient-to-b from-background/50 to-background rounded-xl">
            <div className="w-full max-w-md">
              <CinematicDormCard dorm={previewDorm} index={0} />
            </div>
          </div>

          {/* Gallery Images Preview */}
          {formData.gallery_images.length > 0 && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Images className="w-4 h-4" />
                Gallery Images ({formData.gallery_images.length})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {formData.gallery_images.slice(0, 6).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
                {formData.gallery_images.length > 6 && (
                  <div className="flex items-center justify-center h-24 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      +{formData.gallery_images.length - 6} more
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This is a preview. Your listing will be submitted with "Pending" status
              and will require admin approval before being visible to students.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={onClose}>
              Back to Editing
            </Button>
            <Button onClick={onSubmit}>
              Looks Good, Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
