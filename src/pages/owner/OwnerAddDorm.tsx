import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { OwnerSidebar } from '@/components/owner/OwnerSidebar';
import { z } from 'zod';

const dormSchema = z.object({
  dorm_name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  address: z.string().min(5, 'Address is required').max(200),
  area: z.string().min(2, 'Area is required').max(50),
  university: z.string().optional(),
  description: z.string().max(500).optional(),
  phone_number: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  shuttle: z.boolean(),
  gender_preference: z.string().optional(),
});

export default function OwnerAddDorm() {
  const { userId } = useRoleGuard('owner');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    dorm_name: '',
    address: '',
    area: '',
    university: '',
    description: '',
    phone_number: '',
    email: '',
    shuttle: false,
    gender_preference: 'Mixed',
  });

  const [rooms, setRooms] = useState([
    { type: 'Single', capacity: 1, price: 0, amenities: [] as string[] },
  ]);

  const addRoom = () => {
    setRooms([...rooms, { type: '', capacity: 1, price: 0, amenities: [] }]);
  };

  const removeRoom = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const updateRoom = (index: number, field: string, value: any) => {
    const updatedRooms = [...rooms];
    updatedRooms[index] = { ...updatedRooms[index], [field]: value };
    setRooms(updatedRooms);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      dormSchema.parse(formData);

      // Validate rooms
      if (rooms.some(r => !r.type || r.price <= 0)) {
        throw new Error('Please fill in all room details');
      }

      // Get owner ID
      const { data: owner } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId!)
        .single();

      if (!owner) {
        throw new Error('Owner profile not found');
      }

      // Calculate starting price
      const startingPrice = rooms.length > 0 ? Math.min(...rooms.map(r => r.price)) : 0;

      // Insert dorm
      const { data: dorm, error } = await supabase
        .from('dorms')
        .insert({
          owner_id: owner.id,
          dorm_name: formData.dorm_name,
          name: formData.dorm_name,
          location: formData.address,
          address: formData.address,
          area: formData.area,
          university: formData.university || null,
          description: formData.description || null,
          phone_number: formData.phone_number || null,
          email: formData.email || null,
          shuttle: formData.shuttle,
          gender_preference: formData.gender_preference,
          monthly_price: startingPrice,
          price: startingPrice,
          room_types_json: rooms.map(r => ({ ...r, available: true })),
          verification_status: 'Pending',
          available: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Dorm added successfully!',
        description: 'Your dorm is now pending verification.',
      });

      navigate('/owner/rooms');
    } catch (error: any) {
      console.error('Error adding dorm:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add dorm. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <OwnerSidebar />
      
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/owner')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl gradient-text">Add New Dorm</CardTitle>
              <p className="text-foreground/60">Fill in the details below to list your dorm</p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dorm_name">Dorm Name *</Label>
                      <Input
                        id="dorm_name"
                        required
                        value={formData.dorm_name}
                        onChange={(e) => setFormData({ ...formData, dorm_name: e.target.value })}
                        placeholder="e.g., Sunset Residences"
                      />
                    </div>

                    <div>
                      <Label htmlFor="area">Area *</Label>
                      <Input
                        id="area"
                        required
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        placeholder="e.g., Hamra, Achrafieh"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Full Address *</Label>
                    <Input
                      id="address"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="university">Nearest University</Label>
                      <Select
                        value={formData.university}
                        onValueChange={(value) => setFormData({ ...formData, university: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select university" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LAU">LAU</SelectItem>
                          <SelectItem value="AUB">AUB</SelectItem>
                          <SelectItem value="USEK">USEK</SelectItem>
                          <SelectItem value="USJ">USJ</SelectItem>
                          <SelectItem value="Balamand">Balamand</SelectItem>
                          <SelectItem value="BAU">BAU</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="gender_preference">Gender Preference</Label>
                      <Select
                        value={formData.gender_preference}
                        onValueChange={(value) => setFormData({ ...formData, gender_preference: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mixed">Mixed</SelectItem>
                          <SelectItem value="Male Only">Male Only</SelectItem>
                          <SelectItem value="Female Only">Female Only</SelectItem>
                        </SelectContent>
                      </Select>
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
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="+961 XX XXX XXX"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@example.com"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="shuttle"
                      checked={formData.shuttle}
                      onCheckedChange={(checked) => setFormData({ ...formData, shuttle: checked })}
                    />
                    <Label htmlFor="shuttle">Shuttle service available</Label>
                  </div>
                </div>

                {/* Room Types */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Room Types</h3>
                    <Button type="button" onClick={addRoom} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Room
                    </Button>
                  </div>

                  {rooms.map((room, index) => (
                    <Card key={index} className="p-4 bg-muted/50">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Room {index + 1}</h4>
                          {rooms.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeRoom(index)}
                              variant="ghost"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label>Room Type *</Label>
                            <Select
                              value={room.type}
                              onValueChange={(value) => updateRoom(index, 'type', value)}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Single">Single</SelectItem>
                                <SelectItem value="Double">Double</SelectItem>
                                <SelectItem value="Triple">Triple</SelectItem>
                                <SelectItem value="Quad">Quad</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Capacity *</Label>
                            <Input
                              type="number"
                              min="1"
                              required
                              value={room.capacity}
                              onChange={(e) => updateRoom(index, 'capacity', parseInt(e.target.value))}
                            />
                          </div>

                          <div>
                            <Label>Price/Month ($) *</Label>
                            <Input
                              type="number"
                              min="0"
                              required
                              value={room.price}
                              onChange={(e) => updateRoom(index, 'price', parseInt(e.target.value))}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/owner')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Dorm'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
