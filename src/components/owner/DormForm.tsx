import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, X, Upload, Eye, Images } from "lucide-react";
import { compressImage } from "@/utils/imageCompression";
import { DormPreviewModal } from "./DormPreviewModal";
import { validateEmail, validatePhone, validateUrl, sanitizeInput } from "@/utils/inputValidation";
import { ImageDropzone } from "./ImageDropzone";
import { DraggableImageList } from "./DraggableImageList";

const AMENITIES_OPTIONS = [
  "WiFi",
  "Laundry",
  "Gym",
  "Pool",
  "Parking",
  "Security",
  "Kitchen",
  "Study Room",
  "Garden",
  "Common Area",
  "Air Conditioning",
  "Heating",
  "Elevator",
  "Furnished",
  "Pet Friendly",
  "Cleaning Service",
];

interface DormFormProps {
  dorm?: any;
  ownerId: string;
  onSaved: () => void;
  onCancel?: () => void;
}

export function DormForm({ dorm, ownerId, onSaved, onCancel }: DormFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    name: dorm?.name || dorm?.dorm_name || "",
    address: dorm?.address || "",
    area: dorm?.area || "",
    description: dorm?.description || "",
    capacity: dorm?.capacity?.toString() || "",
    image_url: dorm?.image_url || dorm?.cover_image || "",
    amenities: (dorm?.amenities || []) as string[],
    withinWalkingDistance: !dorm?.shuttle,
    shuttle: dorm?.shuttle || false,
    gender_preference: dorm?.gender_preference || "",
    gallery_images: (dorm?.gallery_images || []) as string[],
  });

  const [galleryUploading, setGalleryUploading] = useState(false);

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleWalkingDistanceChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      withinWalkingDistance: checked,
      shuttle: checked ? false : prev.shuttle,
    }));
  };


  const handleGalleryUpload = async (files: File[]) => {
    const maxImages = 10;
    const currentCount = formData.gallery_images.length;
    
    if (currentCount + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `You can upload up to ${maxImages} gallery images. You have ${currentCount}, trying to add ${files.length}.`,
        variant: "destructive",
      });
      files = files.slice(0, maxImages - currentCount);
    }

    if (files.length === 0) return;

    setGalleryUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const compressed = await compressImage(file);
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `dorm-gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("dorm-uploads")
          .upload(filePath, compressed);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("dorm-uploads")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setFormData({
        ...formData,
        gallery_images: [...formData.gallery_images, ...uploadedUrls],
      });

      toast({
        title: "Success",
        description: `${uploadedUrls.length} image(s) uploaded to gallery`,
      });
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    const newImages = formData.gallery_images.filter((_, i) => i !== index);
    setFormData({ ...formData, gallery_images: newImages });
  };

  const handleReorderGalleryImages = (reorderedImages: string[]) => {
    setFormData({ ...formData, gallery_images: reorderedImages });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `dorm-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("dorm-uploads")
        .upload(filePath, compressed);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("dorm-uploads")
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast({
        title: "Success",
        description: "Exterior image uploaded",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const ensureAuthenticated = async (): Promise<boolean> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('🔐 Auth Session Check:', {
      authenticated: !!session,
      user_id: session?.user?.id,
      expires_at: session?.expires_at,
      error: error?.message
    });
    
    if (error || !session) {
      toast({
        title: "Session Expired",
        description: "Please sign in again to continue.",
        variant: "destructive",
      });
      return false;
    }
    
    // Check if session is about to expire (within 5 minutes)
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
      
      console.log('⏰ Session expiry check:', { minutesUntilExpiry });
      
      if (minutesUntilExpiry < 5) {
        console.log('🔄 Session expiring soon, refreshing...');
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !newSession) {
          toast({
            title: "Session Refresh Failed",
            description: "Please sign in again.",
            variant: "destructive",
          });
          return false;
        }
        
        console.log('✅ Session refreshed successfully');
      }
    }
    
    return true;
  };

  const submitDorm = async () => {
    // Ensure authenticated session FIRST
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      return;
    }

    console.log('📝 Owner ID from props:', ownerId);

    // Validate required fields
    const missingFields: string[] = [];
    
    if (formData.amenities.length === 0) {
      missingFields.push("At least one amenity");
    }
    
    if (!formData.gender_preference) {
      missingFields.push("Gender preference");
    }
    
    if (!formData.image_url) {
      missingFields.push("Exterior building image");
    }
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please provide: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        owner_id: ownerId,
        name: formData.name,
        dorm_name: formData.name,
        address: formData.address,
        area: formData.area || null,
        description: formData.description || null,
        image_url: formData.image_url || null,
        cover_image: formData.image_url || null,
        location: formData.area || formData.address,
      };

      if (formData.capacity) {
        payload.capacity = parseInt(formData.capacity);
      }

      if (formData.amenities.length > 0) {
        payload.amenities = formData.amenities;
      }

      payload.shuttle = formData.shuttle;

      if (formData.gender_preference) {
        payload.gender_preference = formData.gender_preference;
      }

      if (formData.gallery_images.length > 0) {
        payload.gallery_images = formData.gallery_images;
      }

      console.log('📦 Insert Payload:', {
        ...payload,
        owner_id: payload.owner_id,
        amenities_count: payload.amenities?.length,
        gallery_images_count: payload.gallery_images?.length
      });

      if (dorm?.id) {
        // Update existing dorm
        console.log('🔄 Updating existing dorm:', dorm.id);
        const { error } = await supabase
          .from("dorms")
          .update(payload)
          .eq("id", dorm.id);

        if (error) {
          console.error('❌ Update Error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        toast({ title: "Success", description: "Dorm updated successfully" });
      } else {
        // Create new dorm with Pending status
        payload.verification_status = "Pending";
        payload.available = true;
        
      console.log('🚀 Attempting INSERT via RPC with ownerId:', ownerId);
      
      const { data: newDormId, error } = await supabase.rpc('insert_owner_dorm', {
        p_owner_id: ownerId,
        p_name: payload.name,
        p_dorm_name: payload.dorm_name || payload.name,
        p_address: payload.address,
        p_area: payload.area,
        p_university: null,
        p_description: payload.description || null,
        p_image_url: payload.image_url || null,
        p_cover_image: payload.cover_image || payload.image_url || null,
        p_monthly_price: null,
        p_capacity: payload.capacity,
        p_amenities: payload.amenities || [],
        p_shuttle: payload.shuttle || false,
        p_gender_preference: payload.gender_preference,
        p_phone_number: payload.phone_number,
        p_email: payload.email || null,
        p_website: payload.website || null,
        p_gallery_images: payload.gallery_images || []
      });
      
      console.log('📬 RPC Response:', { newDormId, error });
      
      if (error) {
        console.error('❌ RPC Error Details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ Dorm created with ID:', newDormId);
        
        toast({ 
          title: "Success", 
          description: "Dorm submitted for verification. You'll be notified once it's approved.",
        });
      }

      onSaved();
    } catch (error: any) {
      console.error('💥 Submission Error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address || !formData.area || !formData.capacity) {
      toast({
        title: "Error",
        description: "Name, address, area, and room capacity are required",
        variant: "destructive",
      });
      return;
    }

    await submitDorm();
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Basic validation before preview
    if (!formData.name || !formData.address || !formData.area) {
      toast({
        title: "Missing Information",
        description: "Please fill in name, address, and area to preview",
        variant: "destructive",
      });
      return;
    }
    
    setShowPreview(true);
  };

  return (
    <>
      <Card className="glass-hover">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Dorm Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Sunset Residence"
              required
            />
          </div>

          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full street address"
              required
            />
          </div>

          <div>
            <Label htmlFor="area">Area *</Label>
            <Input
              id="area"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              placeholder="e.g., Hamra"
              required
            />
          </div>

          <div>
            <Label htmlFor="capacity">Room Capacity (i.e. Total Number of Rooms) *</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="20"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your dorm..."
              rows={4}
            />
          </div>

          <div>
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
              {AMENITIES_OPTIONS.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <label
                    htmlFor={amenity}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {amenity}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Transportation Section */}
          <div className="space-y-4">
            <Label>Transportation</Label>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="walking-distance" className="text-base font-medium">
                  Within Walking Distance
                </Label>
                <p className="text-sm text-muted-foreground">
                  Dorm is within walking distance to nearby universities
                </p>
              </div>
              <Switch
                id="walking-distance"
                checked={formData.withinWalkingDistance}
                onCheckedChange={handleWalkingDistanceChange}
              />
            </div>

            {!formData.withinWalkingDistance && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="shuttle-service" className="text-base font-medium">
                    Shuttle Service Available
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Provides transportation to nearby universities
                  </p>
                </div>
                <Switch
                  id="shuttle-service"
                  checked={formData.shuttle}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, shuttle: checked })
                  }
                />
              </div>
            )}
          </div>

          {/* Gender Preference Section */}
          <div className="space-y-4">
            <div>
              <Label>Gender Preference</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Specify the accommodation policy for your dorm
              </p>
            </div>
            
            <RadioGroup
              value={formData.gender_preference}
              onValueChange={(value) => 
                setFormData({ ...formData, gender_preference: value })
              }
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="Male" id="male" />
                <Label htmlFor="male" className="flex-1 cursor-pointer">
                  Male Only
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="Female" id="female" />
                <Label htmlFor="female" className="flex-1 cursor-pointer">
                  Female Only
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="Mixed" id="mixed" />
                <Label htmlFor="mixed" className="flex-1 cursor-pointer">
                  Mixed (Co-ed)
                </Label>
              </div>
          </RadioGroup>
        </div>

        {/* Gallery Images Section */}
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold flex items-center gap-2">
              <Images className="w-5 h-5" />
              Gallery Images
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Add photos of common areas, kitchen, facilities, etc. (Max 10 images)
            </p>
          </div>

          {/* Image Dropzone */}
          {formData.gallery_images.length < 10 && (
            <ImageDropzone
              onFilesAdded={handleGalleryUpload}
              multiple={true}
              className="border-2 border-dashed border-border hover:border-primary transition-colors"
            >
              <div className="text-center py-6">
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  Drop images here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  {formData.gallery_images.length} / 10 images uploaded
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WEBP up to 10MB each
                </p>
              </div>
            </ImageDropzone>
          )}

          {/* Loading State */}
          {galleryUploading && (
            <div className="flex items-center justify-center gap-2 p-4 bg-primary/5 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Uploading images...</span>
            </div>
          )}

          {/* Draggable Image List */}
          {formData.gallery_images.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Drag to reorder • First image appears as main gallery photo
              </p>
              <DraggableImageList
                images={formData.gallery_images}
                onReorder={handleReorderGalleryImages}
                onRemove={handleRemoveGalleryImage}
              />
            </div>
          )}

          {/* Helper Text */}
          {formData.gallery_images.length === 0 && !galleryUploading && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                No gallery images yet. Add photos to showcase your dorm's facilities.
              </p>
            </div>
          )}
        </div>

        <div>
            <Label>Exterior Building Image</Label>
            <div className="mt-2 space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label htmlFor="image-upload">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  disabled={uploading}
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? "Uploading..." : "Upload Exterior Image"}
                </Button>
              </label>

              {formData.image_url && (
                <div className="relative group">
                  <img
                    src={formData.image_url}
                    alt="Dorm exterior"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: "" })}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={loading}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview Listing
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : dorm ? (
                "Update Dorm"
              ) : (
                "Submit for Verification"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <DormPreviewModal
      isOpen={showPreview}
      onClose={() => setShowPreview(false)}
      onSubmit={async () => {
        setShowPreview(false);
        await submitDorm();
      }}
      formData={formData}
    />
    </>
  );
}
