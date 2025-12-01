import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthSession } from "@/hooks/useAuthSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { VirtualTourGallery } from "@/components/rooms/VirtualTourGallery";
import { EnhancedImageUploader } from "@/components/owner/EnhancedImageUploader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StudentReservationCard } from "@/components/owner/StudentReservationCard";

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
  const { isAuthenticated, userId, refreshSession } = useAuthSession();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(!roomId); // true for create, false for edit

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    price: "",
    deposit: "",
    capacity: "",
    capacity_occupied: "0",
    area_m2: "",
    description: "",
    available: true,
  });
  const [images, setImages] = useState<string[]>([]);
  const [panoramaUrls, setPanoramaUrls] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoUploading, setVideoUploading] = useState(false);
  const [reservedStudents, setReservedStudents] = useState<any[]>([]);

  // Auto-capacity logic
  const getCapacityFromType = (type: string): number | null => {
    const lowerType = type.toLowerCase();
    
    // Skip auto-capacity for these types (variable capacity)
    if (lowerType.includes('apartment') || 
        lowerType.includes('suite') || 
        lowerType.includes('studio')) {
      return null;
    }
    
    // Auto-determine capacity from type name
    if (lowerType.includes('single')) return 1;
    if (lowerType.includes('double')) return 2;
    if (lowerType.includes('triple')) return 3;
    if (lowerType.includes('quadruple')) return 4;
    
    return null;
  };

  // Load reserved students for this room
  const loadReservedStudents = async () => {
    if (!roomId) return;
    
    try {
      const { data: reservations } = await supabase
        .from('reservations')
        .select(`
          id,
          status,
          paid_at,
          student_id,
          students!inner (
            id,
            full_name,
            email,
            gender,
            university,
            major,
            profile_photo_url
          )
        `)
        .eq('room_id', roomId)
        .in('status', ['paid', 'confirmed']);

      if (reservations) {
        setReservedStudents(reservations);
      }
    } catch (error) {
      console.error('Error loading reserved students:', error);
    }
  };

  useEffect(() => {
    if (roomId) {
      loadRoom();
      loadReservedStudents();
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
        deposit: data.deposit?.toString() || "",
        capacity: data.capacity?.toString() || "",
        capacity_occupied: data.capacity_occupied?.toString() || "0",
        area_m2: data.area_m2?.toString() || "",
        description: data.description || "",
        available: data.available,
      });
      setImages(data.images || []);
      setPanoramaUrls(data.panorama_urls || []);
      setVideoUrl(data.video_url || "");
      setDataLoaded(true);
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
      // Refresh session for better security
      await refreshSession();

      const roomData = {
        room_id: roomId, // Include room_id for updates
        dorm_id: dormId,
        name: formData.name,
        type: formData.type,
        price: parseFloat(formData.price),
        deposit: formData.deposit ? parseFloat(formData.deposit) : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        capacity_occupied: formData.capacity_occupied ? parseInt(formData.capacity_occupied) : 0,
        area_m2: formData.area_m2 ? parseFloat(formData.area_m2) : null,
        description: formData.description || null,
        images: images,
        panorama_urls: panoramaUrls,
        video_url: videoUrl || null,
        available: formData.available,
      };

      // Use Edge Function for both create and update (bypasses RLS issues)
      const { data, error } = await supabase.functions.invoke('create-room', {
        body: roomData
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || `Failed to ${roomId ? 'update' : 'create'} room`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({ 
        title: "Success", 
        description: `Room ${roomId ? 'updated' : 'created'} successfully` 
      });

      navigate(`/owner/dorms/${dormId}/rooms`);
    } catch (error: any) {
      console.error("Error saving room:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your session has expired. Redirecting to login...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading while data is being fetched for edit mode
  if (roomId && !dataLoaded) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading room data...</span>
        </div>
      </div>
    );
  }

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
              onValueChange={(value) => {
                const autoCapacity = getCapacityFromType(value);
                setFormData({ 
                  ...formData, 
                  type: value,
                  // Auto-set capacity if determinable, keep existing if not
                  capacity: autoCapacity !== null ? autoCapacity.toString() : formData.capacity,
                  // Reset occupied to 0 when type changes
                  capacity_occupied: "0"
                });
              }}
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
              <Label htmlFor="deposit">Deposit ($)</Label>
              <Input
                id="deposit"
                type="number"
                step="0.01"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                placeholder="200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="capacity">Room Capacity (students) *</Label>
              <Input
                id="capacity"
                type="number"
                step="1"
                min="1"
                value={formData.capacity}
                onChange={(e) => {
                  const newCapacity = e.target.value;
                  setFormData({ 
                    ...formData, 
                    capacity: newCapacity,
                    // Reset occupied to 0 if it exceeds new capacity
                    capacity_occupied: parseInt(formData.capacity_occupied) > parseInt(newCapacity || "0") 
                      ? "0" 
                      : formData.capacity_occupied
                  });
                }}
                placeholder="e.g., 1, 2, 3..."
                required
                readOnly={getCapacityFromType(formData.type) !== null}
                className={getCapacityFromType(formData.type) !== null ? 'bg-muted cursor-not-allowed' : ''}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {getCapacityFromType(formData.type) !== null 
                  ? 'Auto-set based on room type (Apartment/Suite/Studio can be edited)' 
                  : 'Number of students this room can accommodate'}
              </p>
            </div>

            <div>
              <Label htmlFor="capacity_occupied">Current Capacity (Occupied)</Label>
              <Select
                value={formData.capacity_occupied}
                onValueChange={(value) => setFormData({ ...formData, capacity_occupied: value })}
                disabled={!formData.capacity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select occupied spots" />
                </SelectTrigger>
                <SelectContent>
                  {formData.capacity && Array.from(
                    { length: parseInt(formData.capacity) + 1 }, 
                    (_, i) => i
                  ).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} / {formData.capacity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Number of students currently occupying this room
              </p>
            </div>
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

          {/* Room Video */}
          <div>
            <Label>Room Video</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Upload 1 video (max 100MB) to showcase the room
            </p>
            {videoUrl ? (
              <div className="space-y-2">
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full max-h-64 rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (videoUrl.startsWith('http')) {
                      // Delete from storage
                      const path = videoUrl.split('/').slice(-2).join('/');
                      await supabase.storage.from('room-images').remove([path]);
                    }
                    setVideoUrl("");
                    setVideoFile(null);
                  }}
                >
                  Remove Video
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Check file size (100MB max)
                    if (file.size > 100 * 1024 * 1024) {
                      toast({
                        title: "Error",
                        description: "Video must be less than 100MB",
                        variant: "destructive",
                      });
                      return;
                    }

                    setVideoUploading(true);
                    try {
                      const fileExt = file.name.split('.').pop();
                      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                      const filePath = `room-videos/${fileName}`;

                      const { error: uploadError, data } = await supabase.storage
                        .from('room-images')
                        .upload(filePath, file);

                      if (uploadError) throw uploadError;

                      const { data: { publicUrl } } = supabase.storage
                        .from('room-images')
                        .getPublicUrl(filePath);

                      setVideoUrl(publicUrl);
                      setVideoFile(file);
                      
                      toast({
                        title: "Success",
                        description: "Video uploaded successfully",
                      });
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message,
                        variant: "destructive",
                      });
                    } finally {
                      setVideoUploading(false);
                    }
                  }}
                  disabled={videoUploading}
                />
                {videoUploading && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Uploading video...</span>
                  </div>
                )}
              </div>
            )}
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

          {/* Students Occupying This Room - Only show for edit mode */}
          {roomId && reservedStudents.length > 0 && (
            <div className="space-y-4 border rounded-lg p-6 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg font-semibold">Students in This Room</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reservedStudents.length} student{reservedStudents.length > 1 ? 's' : ''} currently reserved
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {formData.capacity_occupied} / {formData.capacity}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {reservedStudents.map((res: any) => (
                  <StudentReservationCard 
                    key={res.id}
                    student={res.students}
                    reservation={{
                      id: res.id,
                      status: res.status,
                      paid_at: res.paid_at
                    }}
                    roomId={roomId}
                    onRemove={loadReservedStudents}
                  />
                ))}
              </div>
            </div>
          )}

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
