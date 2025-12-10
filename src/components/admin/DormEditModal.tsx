import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Upload, X, Images, Image as ImageIcon } from 'lucide-react';
import { EnhancedImageUploader } from '@/components/owner/EnhancedImageUploader';

interface DormEditModalProps {
  dorm: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  isAdmin?: boolean;
}

const AMENITIES = [
  'WiFi', 'Laundry', 'Gym', 'Pool', 'Parking', 'Security',
  'Kitchen', 'Study Room', 'Garden', 'Air Conditioning',
  'Heating', 'Elevator', 'Furnished', 'Pet Friendly'
];

export default function DormEditModal({ dorm, isOpen, onClose, onUpdate, isAdmin = false }: DormEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: dorm.name || dorm.dorm_name || '',
    dorm_name: dorm.dorm_name || dorm.name || '',
    address: dorm.address || '',
    area: dorm.area || '',
    description: dorm.description || '',
    capacity: dorm.capacity || 1,
    amenities: dorm.amenities || [],
    shuttle: dorm.shuttle || false,
    gender_preference: dorm.gender_preference || 'Mixed',
    available: dorm.available ?? true,
    verification_status: dorm.verification_status || 'Pending',
  });
  const [galleryImages, setGalleryImages] = useState<string[]>(dorm.gallery_images || []);
  const [exteriorImage, setExteriorImage] = useState<string>(dorm.image_url || dorm.cover_image || '');

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // Use RPC function for admin updates (bypasses RLS)
        const { error } = await supabase.rpc('admin_update_dorm', {
          p_dorm_id: dorm.id,
          p_name: formData.name,
          p_dorm_name: formData.dorm_name,
          p_address: formData.address,
          p_area: formData.area,
          p_description: formData.description,
          p_capacity: formData.capacity,
          p_amenities: formData.amenities,
          p_shuttle: formData.shuttle,
          p_gender_preference: formData.gender_preference,
          p_available: formData.available,
          p_verification_status: formData.verification_status,
          p_gallery_images: galleryImages,
          p_image_url: exteriorImage,
          p_cover_image: exteriorImage,
        });
        if (error) throw error;
      } else {
        // Owner updates use direct RLS-protected query
        const updateData: any = {
          name: formData.name,
          dorm_name: formData.dorm_name,
          address: formData.address,
          area: formData.area,
          description: formData.description,
          capacity: formData.capacity,
          amenities: formData.amenities,
          shuttle: formData.shuttle,
          gender_preference: formData.gender_preference,
          available: formData.available,
          gallery_images: galleryImages,
          image_url: exteriorImage,
          cover_image: exteriorImage,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('dorms')
          .update(updateData)
          .eq('id', dorm.id);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Dorm updated successfully',
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Dorm: {dorm.name || dorm.dorm_name}</DialogTitle>
          <DialogDescription className="sr-only">
            Edit dorm information and settings
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Dorm Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Settings */}
            <div className={`grid ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender Preference</Label>
                <Select
                  value={formData.gender_preference}
                  onValueChange={(value) => setFormData({ ...formData, gender_preference: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isAdmin && (
                <div>
                  <Label htmlFor="status">Verification Status</Label>
                  <Select
                    value={formData.verification_status}
                    onValueChange={(value) => setFormData({ ...formData, verification_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Verified">Verified</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Services & Amenities */}
            <div>
              <Label>Services & Amenities</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {AMENITIES.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`amenity-${amenity}`}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity)}
                    />
                    <label htmlFor={`amenity-${amenity}`} className="text-sm cursor-pointer">
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Transportation */}
            <div className="space-y-4">
              <Label>Transportation</Label>
              
              <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div className="flex-1">
                  <Label htmlFor="walking-distance" className="font-medium">Within Walking Distance</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dorm is within walking distance to nearby universities
                  </p>
                </div>
                <Switch
                  id="walking-distance"
                  checked={!formData.shuttle}
                  onCheckedChange={(checked) => setFormData({ ...formData, shuttle: !checked })}
                />
              </div>

              {formData.shuttle && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="flex-1">
                    <Label htmlFor="shuttle-service" className="font-medium">Shuttle Service Available</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Provides transportation to nearby universities
                    </p>
                  </div>
                  <Switch
                    id="shuttle-service"
                    checked={formData.shuttle}
                    onCheckedChange={(checked) => setFormData({ ...formData, shuttle: checked })}
                  />
                </div>
              )}
            </div>

            {/* Gallery Images */}
            <div>
              <Label className="flex items-center gap-2">
                <Images className="w-4 h-4" />
                Gallery Images (Common Areas)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload up to 10 images. Drag to reorder.
              </p>
              <EnhancedImageUploader
                existingImages={galleryImages}
                onChange={setGalleryImages}
                maxImages={10}
                bucketName="dorm-uploads"
                folder="gallery"
                allowReorder={true}
              />
            </div>

            {/* Exterior Building Image */}
            <div>
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Exterior Building Image
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload the main exterior photo of your building
              </p>
              <EnhancedImageUploader
                existingImages={exteriorImage ? [exteriorImage] : []}
                onChange={(images) => setExteriorImage(images[0] || '')}
                maxImages={1}
                bucketName="dorm-uploads"
                folder="exterior"
                allowReorder={false}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
