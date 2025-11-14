import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { OwnerSidebar } from '@/components/owner/OwnerSidebar';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import type { RoomType } from '@/types/RoomType';
import { ImageDropzone } from '@/components/owner/ImageDropzone';
import { DraggableImageList } from '@/components/owner/DraggableImageList';
import { compressImage } from '@/utils/imageCompression';
import { useOwnerDormQuery } from '@/hooks/useOwnerDormQuery';
import PanoramaViewer from '@/components/shared/PanoramaViewer';

const dormSchema = z.object({
  dorm_name: z.string().min(3, 'Dorm name must be at least 3 characters'),
  address: z.string().min(5, 'Address is required'),
  area: z.string().min(2, 'Area is required'),
  university: z.string().optional(),
  phone_number: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  shuttle: z.boolean().default(false),
  gender_preference: z.string().optional(),
  services_amenities: z.string().optional(),
});

type DormFormData = z.infer<typeof dormSchema>;

export default function OwnerAddDorm() {
  const { id: dormId } = useParams();
  const isEditMode = !!dormId;
  const { userId } = useRoleGuard('owner');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  
  // Room types state
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([
    { type: '', price: 0, capacity: 1, amenities: [], images: [], available: true }
  ]);

  // Image state
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const [roomImageFiles, setRoomImageFiles] = useState<Record<number, File[]>>({});
  const [roomImagePreviews, setRoomImagePreviews] = useState<Record<number, string[]>>({});
  const [existingCoverImage, setExistingCoverImage] = useState<string>('');
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Panorama state
  const [panoramaFiles, setPanoramaFiles] = useState<Record<number, File | null>>({});
  const [panoramaPreviews, setPanoramaPreviews] = useState<Record<number, string>>({});
  const [showPanoramaViewer, setShowPanoramaViewer] = useState(false);
  const [currentPanorama, setCurrentPanorama] = useState<string>('');

  // Fetch existing dorm data if in edit mode
  const { data: existingDorm } = useOwnerDormQuery(dormId, ownerId || undefined);

  const form = useForm<DormFormData>({
    resolver: zodResolver(dormSchema),
    defaultValues: {
      dorm_name: '',
      address: '',
      area: '',
      university: '',
      phone_number: '',
      email: '',
      website: '',
      description: '',
      shuttle: false,
      gender_preference: '',
      services_amenities: '',
    },
  });

  // Load owner ID
  useEffect(() => {
    if (userId) {
      supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId)
        .single()
        .then(({ data }) => {
          if (data) setOwnerId(data.id);
        });
    }
  }, [userId]);

  // Populate form if editing
  useEffect(() => {
    if (existingDorm && isEditMode) {
      form.reset({
        dorm_name: existingDorm.dorm_name || '',
        address: existingDorm.address || '',
        area: existingDorm.area || '',
        university: existingDorm.university || '',
        phone_number: existingDorm.phone_number || '',
        email: existingDorm.email || '',
        website: existingDorm.website || '',
        description: existingDorm.description || '',
        shuttle: existingDorm.shuttle || false,
        gender_preference: existingDorm.gender_preference || '',
        services_amenities: (existingDorm as any).services_amenities || '',
      });

      if (existingDorm.room_types_json) {
        setRoomTypes(existingDorm.room_types_json);
        // Set existing room images
        const existingPreviews: Record<number, string[]> = {};
        existingDorm.room_types_json.forEach((room: RoomType, idx: number) => {
          if (room.images && room.images.length > 0) {
            existingPreviews[idx] = room.images;
          }
        });
        setRoomImagePreviews(existingPreviews);
      }

      if (existingDorm.cover_image) {
        setExistingCoverImage(existingDorm.cover_image);
        setCoverImagePreview(existingDorm.cover_image);
      }
    }
  }, [existingDorm, isEditMode, form]);

  const addRoomType = () => {
    setRoomTypes([...roomTypes, { type: '', price: 0, capacity: 1, amenities: [], images: [], available: true }]);
  };

  const removeRoomType = (index: number) => {
    setRoomTypes(roomTypes.filter((_, i) => i !== index));
    // Clean up images for this room
    const newFiles = { ...roomImageFiles };
    delete newFiles[index];
    setRoomImageFiles(newFiles);
    const newPreviews = { ...roomImagePreviews };
    delete newPreviews[index];
    setRoomImagePreviews(newPreviews);
    const newPanoFiles = { ...panoramaFiles };
    delete newPanoFiles[index];
    setPanoramaFiles(newPanoFiles);
    const newPanoPreviews = { ...panoramaPreviews };
    delete newPanoPreviews[index];
    setPanoramaPreviews(newPanoPreviews);
  };

  const updateRoomType = (index: number, field: keyof RoomType, value: any) => {
    const updated = [...roomTypes];
    updated[index] = { ...updated[index], [field]: value };
    setRoomTypes(updated);
  };

  const handleCoverImageChange = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRoomImagesChange = (roomIndex: number, files: File[]) => {
    setRoomImageFiles(prev => ({
      ...prev,
      [roomIndex]: [...(prev[roomIndex] || []), ...files]
    }));
    setRoomImagePreviews(prev => ({
      ...prev,
      [roomIndex]: [...(prev[roomIndex] || []), ...files.map(f => URL.createObjectURL(f))]
    }));
  };

  const handlePanoramaChange = (roomIndex: number, files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setPanoramaFiles(prev => ({ ...prev, [roomIndex]: file }));
      setPanoramaPreviews(prev => ({ ...prev, [roomIndex]: URL.createObjectURL(file) }));
    }
  };

  const handleRoomImagesReorder = (roomIndex: number, newOrder: string[]) => {
    setRoomImagePreviews(prev => ({
      ...prev,
      [roomIndex]: newOrder
    }));
  };

  const removeRoomImage = (roomIndex: number, imageIndex: number) => {
    setRoomImageFiles(prev => ({
      ...prev,
      [roomIndex]: (prev[roomIndex] || []).filter((_, i) => i !== imageIndex)
    }));
    setRoomImagePreviews(prev => ({
      ...prev,
      [roomIndex]: (prev[roomIndex] || []).filter((_, i) => i !== imageIndex)
    }));
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const compressed = await compressImage(file, { maxSizeMB: 0.5 });
    const { data, error } = await supabase.storage
      .from('dorm-uploads')
      .upload(path, compressed, { upsert: true });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('dorm-uploads')
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const onSubmit = async (values: DormFormData) => {
    if (!ownerId) {
      toast({ title: 'Error', description: 'Owner profile not found', variant: 'destructive' });
      return;
    }

    if (roomTypes.some(r => !r.type || r.price <= 0)) {
      toast({ title: 'Error', description: 'Please complete all room types', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    setUploadingImages(true);

    try {
      // Upload cover image
      let coverImageUrl = existingCoverImage;
      if (coverImage) {
        coverImageUrl = await uploadImage(coverImage, `covers/${ownerId}-${Date.now()}.jpg`);
      }

      // Upload room images and panoramas
      const updatedRoomTypes = await Promise.all(
        roomTypes.map(async (room, idx) => {
          // Get existing images from room or from previews
          const existingImages = room.images || [];
          const existingImageUrls = roomImagePreviews[idx]?.filter(url => url.startsWith('http')) || [];
          const newFiles = roomImageFiles[idx] || [];
          
          const newImageUrls = await Promise.all(
            newFiles.map((file, fileIdx) =>
              uploadImage(file, `rooms/${ownerId}-${Date.now()}-${idx}-${fileIdx}.jpg`)
            )
          );

          // Upload panorama if exists
          let panoramaUrl = room.panorama_url;
          if (panoramaFiles[idx]) {
            panoramaUrl = await uploadImage(panoramaFiles[idx]!, `panoramas/${ownerId}-${Date.now()}-${idx}.jpg`);
          }

          return {
            ...room,
            images: [...existingImageUrls, ...newImageUrls],
            panorama_url: panoramaUrl,
          };
        })
      );

      setUploadingImages(false);

      const startingPrice = Math.min(...updatedRoomTypes.map(r => r.price));

      const dormData = {
        ...values,
        owner_id: ownerId,
        cover_image: coverImageUrl,
        room_types_json: updatedRoomTypes,
        monthly_price: startingPrice,
        verification_status: isEditMode ? existingDorm?.verification_status : 'Pending',
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('dorms')
          .update(dormData as any)
          .eq('id', dormId);

        if (error) throw error;

        toast({ title: 'Success!', description: 'Dorm updated successfully' });
      } else {
        const { error } = await supabase
          .from('dorms')
          .insert(dormData as any);

        if (error) throw error;

        toast({ title: 'Success!', description: 'Dorm added successfully' });
      }

      navigate('/owner/rooms');
    } catch (error: any) {
      console.error('Error saving dorm:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save dorm', variant: 'destructive' });
    } finally {
      setSubmitting(false);
      setUploadingImages(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <OwnerSidebar />
      
      <main className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/owner/rooms')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rooms
          </Button>

          <h1 className="text-4xl font-bold gradient-text mb-4">
            {isEditMode ? 'Edit Dorm' : 'Add New Dorm'}
          </h1>
          <p className="text-foreground/70 mb-8">
            {isEditMode ? 'Update your dorm details and room configurations' : 'Fill in the details below to list your dorm'}
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Basic Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dorm_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dorm Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Sunny Heights Residence" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Hamra, Beirut" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Full Address *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Street, Building, Floor" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="university"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nearby University</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select university" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AUB">American University of Beirut</SelectItem>
                              <SelectItem value="LAU">Lebanese American University</SelectItem>
                              <SelectItem value="USJ">Université Saint-Joseph</SelectItem>
                              <SelectItem value="UB">University of Balamand</SelectItem>
                              <SelectItem value="BAU">Beirut Arab University</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender_preference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender Preference</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select preference" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male Only">Male Only</SelectItem>
                              <SelectItem value="Female Only">Female Only</SelectItem>
                              <SelectItem value="Mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              {/* Cover Image */}
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Cover Image</h2>
                {coverImagePreview ? (
                  <div className="relative">
                    <img src={coverImagePreview} alt="Cover" className="w-full h-64 object-cover rounded-lg" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setCoverImage(null);
                        setCoverImagePreview('');
                        setExistingCoverImage('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <ImageDropzone onFilesAdded={handleCoverImageChange} multiple={false} />
                )}
              </Card>

              {/* Room Types */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">Room Types</h2>
                  <Button type="button" onClick={addRoomType} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Room Type
                  </Button>
                </div>

                <div className="space-y-6">
                  {roomTypes.map((room, index) => (
                    <Card key={index} className="p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Room {index + 1}</h3>
                        {roomTypes.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRoomType(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label>Room Type *</Label>
                          <Input
                            value={room.type}
                            onChange={(e) => updateRoomType(index, 'type', e.target.value)}
                            placeholder="e.g. Single, Double"
                          />
                        </div>
                        <div>
                          <Label>Price ($/month) *</Label>
                          <Input
                            type="number"
                            value={room.price}
                            onChange={(e) => updateRoomType(index, 'price', Number(e.target.value))}
                            placeholder="300"
                          />
                        </div>
                        <div>
                          <Label>Capacity *</Label>
                          <Input
                            type="number"
                            value={room.capacity}
                            onChange={(e) => updateRoomType(index, 'capacity', Number(e.target.value))}
                            placeholder="1"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label>Amenities (comma-separated)</Label>
                        <Input
                          value={(room.amenities || []).join(', ')}
                          onChange={(e) => updateRoomType(index, 'amenities', e.target.value.split(',').map(a => a.trim()))}
                          placeholder="WiFi, AC, Private Bathroom"
                        />
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <Switch
                          checked={room.available !== false}
                          onCheckedChange={(checked) => updateRoomType(index, 'available', checked)}
                        />
                        <Label>Available for booking</Label>
                      </div>

                      {/* 360° Panorama */}
                      <div className="mb-4">
                        <Label className="mb-2 block flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          360° Panorama Photo (Optional)
                        </Label>
                        {panoramaPreviews[index] ? (
                          <div className="relative">
                            <img
                              src={panoramaPreviews[index]}
                              alt="Panorama preview"
                              className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                setCurrentPanorama(panoramaPreviews[index]);
                                setShowPanoramaViewer(true);
                              }}
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  setCurrentPanorama(panoramaPreviews[index]);
                                  setShowPanoramaViewer(true);
                                }}
                              >
                                Preview 360°
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => {
                                  setPanoramaFiles(prev => {
                                    const updated = { ...prev };
                                    delete updated[index];
                                    return updated;
                                  });
                                  setPanoramaPreviews(prev => {
                                    const updated = { ...prev };
                                    delete updated[index];
                                    return updated;
                                  });
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <ImageDropzone
                            onFilesAdded={(files) => handlePanoramaChange(index, files)}
                            multiple={false}
                          />
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload a 360° panorama photo for an immersive virtual tour experience
                        </p>
                      </div>

                      {/* Room Images */}
                      <div>
                        <Label className="mb-2 block">Room Images</Label>
                        {roomImagePreviews[index]?.length > 0 && (
                          <DraggableImageList
                            images={roomImagePreviews[index]}
                            onReorder={(newOrder) => handleRoomImagesReorder(index, newOrder)}
                            onRemove={(imgIndex) => removeRoomImage(index, imgIndex)}
                          />
                        )}
                        <ImageDropzone
                          onFilesAdded={(files) => handleRoomImagesChange(index, files)}
                          multiple={true}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>

              {/* Contact & Additional Info */}
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Contact & Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+961 XX XXX XXX" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="contact@dorm.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input {...field} type="url" placeholder="https://www.dorm.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} placeholder="Describe your dorm..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="services_amenities"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Services & Amenities</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder="List all amenities and services..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shuttle"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Shuttle Service Available</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              {/* Submit */}
              <div className="flex gap-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {uploadingImages ? 'Uploading Images...' : 'Saving...'}
                    </>
                  ) : (
                    <>{isEditMode ? 'Update Dorm' : 'Add Dorm'}</>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/owner/rooms')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>

      {/* Panorama Viewer */}
      {showPanoramaViewer && currentPanorama && (
        <PanoramaViewer
          imageUrl={currentPanorama}
          onClose={() => {
            setShowPanoramaViewer(false);
            setCurrentPanorama('');
          }}
          title="360° Room Tour"
        />
      )}
    </div>
  );
}
