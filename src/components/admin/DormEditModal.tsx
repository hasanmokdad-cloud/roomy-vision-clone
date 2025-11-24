import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
import { Loader2 } from 'lucide-react';

interface DormEditModalProps {
  dorm: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const AMENITIES = [
  'WiFi', 'Laundry', 'Gym', 'Pool', 'Parking', 'Security',
  'Kitchen', 'Study Room', 'Garden', 'Air Conditioning',
  'Heating', 'Elevator', 'Furnished', 'Pet Friendly'
];

export default function DormEditModal({ dorm, isOpen, onClose, onUpdate }: DormEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: dorm.name || dorm.dorm_name || '',
    dorm_name: dorm.dorm_name || dorm.name || '',
    address: dorm.address || '',
    area: dorm.area || '',
    university: dorm.university || '',
    description: dorm.description || '',
    monthly_price: dorm.monthly_price || dorm.price || 0,
    capacity: dorm.capacity || 1,
    amenities: dorm.amenities || [],
    shuttle: dorm.shuttle || false,
    gender_preference: dorm.gender_preference || 'Mixed',
    phone_number: dorm.phone_number || '',
    email: dorm.email || '',
    website: dorm.website || '',
    available: dorm.available ?? true,
    verification_status: dorm.verification_status || 'Pending',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('dorms')
        .update({
          name: formData.name,
          dorm_name: formData.dorm_name,
          address: formData.address,
          area: formData.area,
          university: formData.university,
          description: formData.description,
          monthly_price: formData.monthly_price,
          price: formData.monthly_price, // Keep price in sync
          capacity: formData.capacity,
          amenities: formData.amenities,
          shuttle: formData.shuttle,
          gender_preference: formData.gender_preference,
          phone_number: formData.phone_number,
          email: formData.email,
          website: formData.website,
          available: formData.available,
          verification_status: formData.verification_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dorm.id);

      if (error) throw error;

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="monthly_price">Monthly Price ($)</Label>
                <Input
                  id="monthly_price"
                  type="number"
                  value={formData.monthly_price}
                  onChange={(e) => setFormData({ ...formData, monthly_price: Number(e.target.value) })}
                />
              </div>
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

            {/* Contact Info */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-3 gap-4">
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
            </div>

            {/* Amenities */}
            <div>
              <Label>Amenities</Label>
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
