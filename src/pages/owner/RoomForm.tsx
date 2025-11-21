import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { compressImage } from "@/utils/imageCompression";

const ROOM_TYPES = ["Single", "Double", "Triple", "Studio", "Suite", "Shared"];

export default function RoomForm() {
  const { dormId } = useParams<{ dormId: string }>();
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    price: "",
    area_m2: "",
    description: "",
    available: true,
  });
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (roomId) {
      loadRoom();
    }
  }, [roomId]);

  const loadRoom = async () => {
    if (!roomId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name,
        type: data.type,
        price: data.price.toString(),
        area_m2: data.area_m2?.toString() || "",
        description: data.description || "",
        available: data.available,
      });
      setImages(data.images || []);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImage(file);
        const fileName = `${Date.now()}-${i}-${file.name}`;
        const filePath = `room-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("dorm-uploads")
          .upload(filePath, compressed);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("dorm-uploads")
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      }

      setImages([...images, ...newImages]);
      toast({
        title: "Success",
        description: `${newImages.length} image(s) uploaded`,
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

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const roomData = {
        dorm_id: dormId,
        name: formData.name,
        type: formData.type,
        price: parseFloat(formData.price),
        area_m2: formData.area_m2 ? parseFloat(formData.area_m2) : null,
        description: formData.description || null,
        images: images,
        available: formData.available,
      };

      if (roomId) {
        const { error } = await supabase
          .from("rooms")
          .update(roomData)
          .eq("id", roomId);

        if (error) throw error;
        toast({ title: "Success", description: "Room updated successfully" });
      } else {
        const { error } = await supabase
          .from("rooms")
          .insert([roomData]);

        if (error) throw error;
        toast({ title: "Success", description: "Room created successfully" });
      }

      navigate(`/owner/dorms/${dormId}/rooms`);
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
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/owner/dorms/${dormId}/rooms`)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">
          {roomId ? "Edit Room" : "Add New Room"}
        </h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Room Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Room 101"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Room Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {ROOM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Monthly Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="500"
                required
              />
            </div>

            <div>
              <Label htmlFor="area">Area (m²)</Label>
              <Input
                id="area"
                type="number"
                step="0.1"
                value={formData.area_m2}
                onChange={(e) => setFormData({ ...formData, area_m2: e.target.value })}
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
              placeholder="Describe the room features..."
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="available"
              checked={formData.available}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, available: checked as boolean })
              }
            />
            <Label htmlFor="available" className="cursor-pointer">
              Room is available for booking
            </Label>
          </div>

          <div>
            <Label>Room Images</Label>
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                multiple
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
                  {uploading ? "Uploading..." : "Upload Images"}
                </Button>
              </label>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Room ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/owner/dorms/${dormId}/rooms`)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : roomId ? (
                "Update Room"
              ) : (
                "Create Room"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
