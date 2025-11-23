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
import { ArrowLeft, Loader2 } from "lucide-react";
import { VirtualTourGallery } from "@/components/rooms/VirtualTourGallery";
import { EnhancedImageUploader } from "@/components/owner/EnhancedImageUploader";

const ROOM_TYPES = [
  'Single',
  'Double',
  'Triple',
  'Apartment',
  'Junior Suite',
  'Royal Suite',
  'Standard Single',
  'High Standard Single',
  'Standard Double',
  'High Standard Double',
  'Small Single',
  'Medium Single',
  'Large Single',
  'Small Double',
  'Medium Double',
  'Large Double',
  'Large Quadruple',
  'Studio'
];

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
    deposit: "",
    area_m2: "",
    description: "",
    available: true,
  });
  const [images, setImages] = useState<string[]>([]);
  const [panoramaUrls, setPanoramaUrls] = useState<string[]>([]);

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
        deposit: (data as any).deposit?.toString() || "",
        area_m2: data.area_m2?.toString() || "",
        description: data.description || "",
        available: data.available,
      });
      setImages(data.images || []);
      setPanoramaUrls(data.panorama_urls || []);
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

  // Image upload is now handled by EnhancedImageUploader component

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
      deposit: formData.deposit ? parseFloat(formData.deposit) : null,
      area_m2: formData.area_m2 ? parseFloat(formData.area_m2) : null,
      description: formData.description || null,
      images: images,
      panorama_urls: panoramaUrls,
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
              placeholder="e.g., B1 or 14"
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
            <p className="text-xs text-muted-foreground mb-2">
              Upload up to 10 images. Drag to reorder, first image is the cover.
            </p>
            <EnhancedImageUploader
              existingImages={images}
              onChange={setImages}
              maxImages={10}
              bucketName="room-images"
              folder="rooms"
              allowReorder={true}
            />
          </div>

          {/* Virtual Tour Panoramas */}
          <div>
            <Label>360° Virtual Tour Images</Label>
            <p className="text-xs text-foreground/60 mb-2">
              Upload panoramic 360° images for immersive virtual tours
            </p>
            <VirtualTourGallery
              roomId={roomId}
              panoramaUrls={panoramaUrls}
              editable={true}
              onUpdate={setPanoramaUrls}
            />
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
