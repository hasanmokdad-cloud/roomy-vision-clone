import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { compressImage } from '@/utils/imageCompression';
import { motion } from 'framer-motion';

export default function AddNewDorm() {
  const { userId, loading: authLoading } = useRoleGuard('owner');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dorm_name: '',
    location: '',
    area: '',
    address: '',
    university: '',
    description: '',
    price: '',
    monthly_price: '',
    phone_number: '',
    email: '',
    website: '',
    capacity: '',
    gender_preference: 'Mixed',
    shuttle: false,
    available: true,
    amenities: [] as string[],
  });

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');

  useEffect(() => {
    if (!userId) return;

    const fetchOwnerId = async () => {
      const { data: owner, error } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !owner) {
        toast({
          title: 'Error',
          description: 'You must complete your owner profile first.',
          variant: 'destructive',
        });
        navigate('/owner/account');
        return;
      }

      setOwnerId(owner.id);
    };

    fetchOwnerId();
  }, [userId, navigate, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const compressed = await compressImage(file);
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('dorm-uploads')
        .upload(fileName, compressed);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('dorm-uploads')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ownerId) {
      toast({
        title: 'Error',
        description: 'Owner ID not found',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.name || !formData.location || !formData.monthly_price) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    setUploading(true);

    try {
      let coverImageUrl = '';
      if (coverImage) {
        const url = await uploadImage(coverImage);
        if (url) coverImageUrl = url;
      }

      setUploading(false);

      const { data, error } = await supabase
        .from('dorms')
        .insert({
          owner_id: ownerId,
          name: formData.name,
          dorm_name: formData.dorm_name || formData.name,
          location: formData.location,
          area: formData.area,
          address: formData.address,
          university: formData.university,
          description: formData.description,
          price: parseFloat(formData.monthly_price),
          monthly_price: parseFloat(formData.monthly_price),
          phone_number: formData.phone_number,
          email: formData.email,
          website: formData.website,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          gender_preference: formData.gender_preference,
          shuttle: formData.shuttle,
          available: formData.available,
          amenities: formData.amenities,
          cover_image: coverImageUrl,
          image_url: coverImageUrl,
          verification_status: 'Pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Dorm created successfully. Pending admin approval.',
      });

      navigate('/owner/listings');
    } catch (error: any) {
      console.error('Error creating dorm:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create dorm',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const amenitiesOptions = [
    'WiFi', 'AC', 'Heating', 'Laundry', 'Kitchen', 'Parking',
    'Security', 'Gym', 'Study Room', 'Common Area', 'Meals'
  ];

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  if (authLoading || !ownerId) {
    return (
      <OwnerLayout>
        <div className="p-4 md:p-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="ghost"
              onClick={() => navigate('/owner/listings')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Dorms
            </Button>

            <h1 className="text-3xl font-semibold text-gray-800">Add New Dorm</h1>
            <p className="text-gray-500 text-sm mt-1">Create a new dorm listing</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-700">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Dorm Name *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Sunrise Student Housing"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">City/Location *</Label>
                      <Input
                        id="location"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Beirut"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="area">Area/Neighborhood</Label>
                      <Input
                        id="area"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        placeholder="e.g., Hamra"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="university">Nearby University</Label>
                      <Input
                        id="university"
                        value={formData.university}
                        onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                        placeholder="e.g., LAU"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Full Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Full street address"
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your dorm..."
                      rows={4}
                      className="rounded-xl"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pricing & Capacity */}
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-700">Pricing & Capacity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="monthly_price">Monthly Price (USD) *</Label>
                      <Input
                        id="monthly_price"
                        type="number"
                        required
                        value={formData.monthly_price}
                        onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })}
                        placeholder="400"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity">Total Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        placeholder="50"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="gender_preference">Gender Policy</Label>
                    <Select
                      value={formData.gender_preference}
                      onValueChange={(value) => setFormData({ ...formData, gender_preference: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mixed">Mixed</SelectItem>
                        <SelectItem value="Male">Male Only</SelectItem>
                        <SelectItem value="Female">Female Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Amenities */}
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-700">Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {amenitiesOptions.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Switch
                          checked={formData.amenities.includes(amenity)}
                          onCheckedChange={() => toggleAmenity(amenity)}
                        />
                        <Label className="text-gray-700">{amenity}</Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Cover Image */}
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-700">Cover Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label htmlFor="cover-image" className="cursor-pointer">
                      <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary transition-colors">
                        {coverImagePreview ? (
                          <img
                            src={coverImagePreview}
                            alt="Preview"
                            className="max-h-64 mx-auto rounded-lg"
                          />
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-12 h-12 mx-auto text-gray-400" />
                            <p className="text-sm text-gray-500">Click to upload cover image</p>
                          </div>
                        )}
                      </div>
                      <Input
                        id="cover-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-700">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="+961 1 234567"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@dorm.com"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://..."
                      className="rounded-xl"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Options */}
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-700">Additional Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="shuttle" className="text-gray-700">Shuttle Service Available</Label>
                    <Switch
                      id="shuttle"
                      checked={formData.shuttle}
                      onCheckedChange={(checked) => setFormData({ ...formData, shuttle: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="available" className="text-gray-700">Currently Available for Booking</Label>
                    <Switch
                      id="available"
                      checked={formData.available}
                      onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/owner/listings')}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex-1 bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] text-white rounded-xl"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Dorm'
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </OwnerLayout>
  );
}