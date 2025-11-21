import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, X, Upload } from "lucide-react";
import { compressImage } from "@/utils/imageCompression";

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

  const [formData, setFormData] = useState({
    name: dorm?.name || dorm?.dorm_name || "",
    address: dorm?.address || "",
    area: dorm?.area || "",
    university: dorm?.university || "",
    description: dorm?.description || "",
    monthly_price: dorm?.monthly_price?.toString() || dorm?.price?.toString() || "",
    capacity: dorm?.capacity?.toString() || "",
    image_url: dorm?.image_url || dorm?.cover_image || "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address) {
      toast({
        title: "Error",
        description: "Name and address are required",
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

      if (dorm?.id) {
        // Update existing dorm
        const { error } = await supabase
          .from("dorms")
          .update(payload)
          .eq("id", dorm.id);

        if (error) throw error;
        toast({ title: "Success", description: "Dorm updated successfully" });
      } else {
        // Create new dorm
        payload.verification_status = "Pending";
        payload.available = true;
        
        const { error } = await supabase.from("dorms").insert([payload]);

        if (error) throw error;
        toast({ title: "Success", description: "Dorm created successfully" });
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

  return (
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
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="e.g., Hamra"
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
              <Label htmlFor="monthly_price">Starting Price ($)</Label>
              <Input
                id="monthly_price"
                type="number"
                step="0.01"
                value={formData.monthly_price}
                onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })}
                placeholder="500"
              />
            </div>

            <div>
              <Label htmlFor="capacity">Total Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="20"
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
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : dorm ? (
                "Update Dorm"
              ) : (
                "Create Dorm"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
