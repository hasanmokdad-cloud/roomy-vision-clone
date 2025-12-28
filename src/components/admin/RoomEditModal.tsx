import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { TieredPricingFields } from '@/components/rooms/TieredPricingFields';

interface RoomEditModalProps {
  room: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

import { ownerRoomTypes } from '@/data/roomTypes';

export default function RoomEditModal({ room, isOpen, onClose, onUpdate }: RoomEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: room.name || '',
    type: room.type || 'Single',
    price: room.price?.toString() || '0',
    deposit: room.deposit?.toString() || '0',
    price_1_student: room.price_1_student?.toString() || '',
    price_2_students: room.price_2_students?.toString() || '',
    deposit_1_student: room.deposit_1_student?.toString() || '',
    deposit_2_students: room.deposit_2_students?.toString() || '',
    capacity: room.capacity || 1,
    area_m2: room.area_m2 || 0,
    description: room.description || '',
    available: room.available ?? true,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          name: formData.name,
          type: formData.type,
          price: parseFloat(formData.price) || 0,
          deposit: parseFloat(formData.deposit) || 0,
          price_1_student: formData.price_1_student ? parseFloat(formData.price_1_student) : null,
          price_2_students: formData.price_2_students ? parseFloat(formData.price_2_students) : null,
          deposit_1_student: formData.deposit_1_student ? parseFloat(formData.deposit_1_student) : null,
          deposit_2_students: formData.deposit_2_students ? parseFloat(formData.deposit_2_students) : null,
          capacity: formData.capacity,
          area_m2: formData.area_m2,
          description: formData.description,
          available: formData.available,
          updated_at: new Date().toISOString(),
        })
        .eq('id', room.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Room updated successfully',
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Room: {room.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Edit room details and pricing
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="type">Room Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ownerRoomTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing */}
            <TieredPricingFields
              roomType={formData.type}
              price={formData.price}
              price1Student={formData.price_1_student}
              price2Students={formData.price_2_students}
              deposit={formData.deposit}
              deposit1Student={formData.deposit_1_student}
              deposit2Students={formData.deposit_2_students}
              onChange={(field, value) => setFormData({ ...formData, [field]: value })}
            />

            {/* Capacity & Area */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity">Capacity (persons)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="area">Area (m²)</Label>
                <Input
                  id="area"
                  type="number"
                  value={formData.area_m2}
                  onChange={(e) => setFormData({ ...formData, area_m2: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex-1">
                <Label htmlFor="available" className="font-medium">Room Available</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Mark this room as available for booking
                </p>
              </div>
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
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
