import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useOwnerDormQuery } from '@/hooks/useOwnerDormQuery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Trash2, Upload, X } from 'lucide-react';
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
  const { id: dormId } = useParams();
  const { userId } = useRoleGuard('owner');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  // Fetch existing dorm data if in edit mode
  const { data: existingDorm, isLoading: isDormLoading } = useOwnerDormQuery(dormId, ownerId || undefined);

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
    { type: 'Single', capacity: 1, price: 0, amenities: [] as string[], images: [] as string[] },
  ]);

  // Image state
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [roomImageFiles, setRoomImageFiles] = useState<{ [key: number]: File[] }>({});
  const [roomImagePreviews, setRoomImagePreviews] = useState<{ [key: number]: string[] }>({});

  // Fetch owner ID
  useEffect(() => {
    const fetchOwnerId = async () => {
      if (!userId) return;
      const { data } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId)
        .single();
      if (data) setOwnerId(data.id);
    };
    fetchOwnerId();
  }, [userId]);

  // Populate form with existing dorm data
  useEffect(() => {
    if (existingDorm) {
      setFormData({
        dorm_name: existingDorm.dorm_name || '',
        address: existingDorm.address || '',
        area: existingDorm.area || '',
        university: existingDorm.university || '',
        description: existingDorm.description || '',
        phone_number: existingDorm.phone_number || '',
        email: existingDorm.email || '',
        shuttle: existingDorm.shuttle || false,
        gender_preference: existingDorm.gender_preference || 'Mixed',
      });

      if (existingDorm.cover_image) {
        setCoverImagePreview(existingDorm.cover_image);
      }

      if (existingDorm.room_types_json) {
        const roomsData = Array.isArray(existingDorm.room_types_json) 
          ? existingDorm.room_types_json 
          : [];
        setRooms(roomsData.map((r: any) => ({
          type: r.type || '',
          capacity: r.capacity || 1,
          price: r.price || 0,
          amenities: r.amenities || [],
          images: r.images || [],
        })));

        // Set existing room image previews
        const previews: { [key: number]: string[] } = {};
        roomsData.forEach((r: any, idx: number) => {
          if (r.images && r.images.length > 0) {
            previews[idx] = r.images;
          }
        });
        setRoomImagePreviews(previews);
      }
    }
  }, [existingDorm]);

  const addRoom = () => {
    setRooms([...rooms, { type: '', capacity: 1, price: 0, amenities: [], images: [] }]);
  };

  const removeRoom = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index));
    const newFiles = { ...roomImageFiles };
    delete newFiles[index];
    setRoomImageFiles(newFiles);
    const newPreviews = { ...roomImagePreviews };
    delete newPreviews[index];
    setRoomImagePreviews(newPreviews);
  };

  const updateRoom = (index: number, field: string, value: any) => {
    const updatedRooms = [...rooms];
    updatedRooms[index] = { ...updatedRooms[index], [field]: value };
    setRooms(updatedRooms);
  };

  // Handle cover image upload
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
  };

  // Handle room image uploads
  const handleRoomImageChange = (roomIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setRoomImageFiles(prev => ({
        ...prev,
        [roomIndex]: [...(prev[roomIndex] || []), ...files]
      }));

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setRoomImagePreviews(prev => ({
            ...prev,
            [roomIndex]: [...(prev[roomIndex] || []), reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeRoomImage = (roomIndex: number, imageIndex: number) => {
    setRoomImageFiles(prev => {
      const updated = { ...prev };
      if (updated[roomIndex]) {
        updated[roomIndex] = updated[roomIndex].filter((_, i) => i !== imageIndex);
      }
      return updated;
    });

    setRoomImagePreviews(prev => {
      const updated = { ...prev };
      if (updated[roomIndex]) {
        updated[roomIndex] = updated[roomIndex].filter((_, i) => i !== imageIndex);
      }
      return updated;
    });
  };

  // Upload image to Supabase storage
  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}-${Date.now()}.${fileExt}`;
      const filePath = `${ownerId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('dorm-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dorm-uploads')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
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

      if (!ownerId) {
        throw new Error('Owner profile not found');
      }

      // Upload cover image if new one provided
      let coverImageUrl = existingDorm?.cover_image || null;
      if (coverImage) {
        const uploadedUrl = await uploadImage(coverImage, 'cover');
        if (uploadedUrl) coverImageUrl = uploadedUrl;
      }

      // Upload room images
      const roomsWithImages = await Promise.all(
        rooms.map(async (room, index) => {
          let imageUrls = room.images || [];
          
          // Upload new images for this room
          if (roomImageFiles[index] && roomImageFiles[index].length > 0) {
            const uploadedUrls = await Promise.all(
              roomImageFiles[index].map(file => uploadImage(file, `room-${index}`))
            );
            const validUrls = uploadedUrls.filter(url => url !== null) as string[];
            imageUrls = [...imageUrls, ...validUrls];
          }

          return {
            ...room,
            images: imageUrls,
            available: true,
          };
        })
      );

      // Calculate starting price
      const startingPrice = rooms.length > 0 ? Math.min(...rooms.map(r => r.price)) : 0;

      const dormData = {
        owner_id: ownerId,
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
        room_types_json: roomsWithImages,
        cover_image: coverImageUrl,
        verification_status: dormId ? existingDorm?.verification_status : 'Pending',
        available: true,
      };

      if (dormId) {
        // Update existing dorm
        const { error } = await supabase
          .from('dorms')
          .update(dormData)
          .eq('id', dormId)
          .eq('owner_id', ownerId);

        if (error) throw error;

        toast({
          title: 'Dorm updated successfully!',
          description: 'Your changes have been saved.',
        });
      } else {
        // Insert new dorm
        const { error } = await supabase
          .from('dorms')
          .insert(dormData);

        if (error) throw error;

        toast({
          title: 'Dorm added successfully!',
          description: 'Your dorm is now pending verification.',
        });
      }

      navigate('/owner/rooms');
    } catch (error: any) {
      console.error('Error saving dorm:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save dorm. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (dormId && isDormLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <OwnerSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <p>Loading dorm data...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <OwnerSidebar />
      
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/owner/rooms')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rooms
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl gradient-text">
                {dormId ? 'Edit Dorm' : 'Add New Dorm'}
              </CardTitle>
              <p className="text-foreground/60">
                {dormId ? 'Update your dorm details below' : 'Fill in the details below to list your dorm'}
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cover Image Upload */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Cover Image</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cover_image">Upload Cover Photo</Label>
                    <div className="flex items-start gap-4">
                      {coverImagePreview ? (
                        <div className="relative">
                          <img 
                            src={coverImagePreview} 
                            alt="Cover preview" 
                            className="w-48 h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={removeCoverImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label 
                          htmlFor="cover_image" 
                          className="w-48 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                        >
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Click to upload</span>
                        </label>
                      )}
                      <Input
                        id="cover_image"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

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

                        {/* Room Images */}
                        <div className="space-y-2">
                          <Label>Room Images</Label>
                          <div className="flex flex-wrap gap-2">
                            {roomImagePreviews[index]?.map((preview, imgIdx) => (
                              <div key={imgIdx} className="relative">
                                <img 
                                  src={preview} 
                                  alt={`Room ${index + 1} image ${imgIdx + 1}`}
                                  className="w-24 h-24 object-cover rounded-lg border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -top-2 -right-2 h-5 w-5"
                                  onClick={() => removeRoomImage(index, imgIdx)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <label 
                              htmlFor={`room_images_${index}`}
                              className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                            >
                              <Upload className="w-6 h-6 text-muted-foreground" />
                            </label>
                            <Input
                              id={`room_images_${index}`}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleRoomImageChange(index, e)}
                              className="hidden"
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
                    onClick={() => navigate('/owner/rooms')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (dormId ? 'Updating...' : 'Adding...') : (dormId ? 'Update Dorm' : 'Add Dorm')}
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
