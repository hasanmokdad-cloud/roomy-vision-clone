import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, X, Upload, Eye } from "lucide-react";
import { compressImage } from "@/utils/imageCompression";
import { DormPreviewModal } from "./DormPreviewModal";

const AMENITIES_OPTIONS = [
  "WiFi",
  "Parking",
  "Laundry",
  "Gym",
  "Study Room",
  "Common Area",
  "Kitchen",
  "Air Conditioning",
  "Heating",
  "Security",
  "Elevator",
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
    university: dorm?.university || "",
    description: dorm?.description || "",
    monthly_price: dorm?.monthly_price?.toString() || dorm?.price?.toString() || "",
    capacity: dorm?.capacity?.toString() || "",
    image_url: dorm?.image_url || dorm?.cover_image || "",
    amenities: (dorm?.amenities || []) as string[],
  });

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
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

  const submitDorm = async () => {
    setLoading(true);
    try {
      const payload: any = {
        owner_id: ownerId,
        name: formData.name,
        dorm_name: formData.name,
        address: formData.address,
        area: formData.area || null,
        university: formData.university || null,
        description: formData.description || null,
        image_url: formData.image_url || null,
        cover_image: formData.image_url || null,
        location: formData.area || formData.address,
      };

      if (formData.monthly_price) {
        payload.monthly_price = parseFloat(formData.monthly_price);
        payload.price = parseFloat(formData.monthly_price);
      }

      if (formData.capacity) {
        payload.capacity = parseInt(formData.capacity);
      }

      if (formData.amenities.length > 0) {
        payload.amenities = formData.amenities;
      }

      if (dorm?.id) {
        // Update existing dorm
        const { error } = await supabase
          .from("dorms")
          .update(payload)
          .eq("id", dorm.id);

        if (error) throw error;
        toast({ title: "Success", description: "Dorm updated successfully" });
      } else {
        // Create new dorm with Pending status
        payload.verification_status = "Pending";
        payload.available = true;
        
        const { error } = await supabase.from("dorms").insert([payload]);

        if (error) throw error;
        toast({ 
          title: "Success", 
          description: "Dorm submitted for verification. You'll be notified once it's approved.",
        });
      }

      onSaved();
    } catch (error: any) {
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

    if (!formData.name || !formData.address || !formData.area || !formData.monthly_price || !formData.capacity) {
      toast({
        title: "Error",
        description: "Name, address, area, price, and room capacity are required",
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

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="university">Nearby University</Label>
              <Input
                id="university"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                placeholder="e.g., AUB"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthly_price">Starting/Monthly Price ($) *</Label>
              <Input
                id="monthly_price"
                type="number"
                step="0.01"
                value={formData.monthly_price}
                onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })}
                placeholder="500"
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
