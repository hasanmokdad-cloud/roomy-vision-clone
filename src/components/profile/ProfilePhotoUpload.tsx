import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Loader2, Camera, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/utils/imageCompression';

interface ProfilePhotoUploadProps {
  userId: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  tableName?: 'students' | 'owners' | 'admins';
}

export function ProfilePhotoUpload({ userId, currentUrl, onUploaded, tableName = 'students' }: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const { toast } = useToast();

  useEffect(() => {
    setPreviewUrl(currentUrl);
  }, [currentUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Compress image
      const compressedFile = await compressImage(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
      });

      const fileExt = compressedFile.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ profile_photo_url: urlData.publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setPreviewUrl(urlData.publicUrl);
      onUploaded(urlData.publicUrl);

      toast({
        title: 'Success',
        description: 'Profile photo updated successfully',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!previewUrl) return;
    
    setUploading(true);
    
    try {
      // Extract file path from URL
      const urlParts = previewUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // Get "userId/timestamp.ext"
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('profile-photos')
        .remove([filePath]);
      
      if (deleteError) throw deleteError;
      
      // Update database
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ profile_photo_url: null })
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      setPreviewUrl(null);
      onUploaded(''); // Notify parent of deletion
      
      toast({
        title: 'Success',
        description: 'Profile photo deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete photo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="w-32 h-32 ring-4 ring-primary/20">
        <AvatarImage src={previewUrl || undefined} alt="Profile photo" />
        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-3xl">
          <Camera className="w-12 h-12" />
        </AvatarFallback>
      </Avatar>

      <Button
        variant="outline"
        className="relative"
        disabled={uploading}
      >
        <label className="cursor-pointer flex items-center gap-2">
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Photo
            </>
          )}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </Button>

      {previewUrl && (
        <Button
          variant="outline"
          onClick={handleDeletePhoto}
          disabled={uploading}
          className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-400"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Photo
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Max size: 5MB. Recommended: 800x800px
      </p>
    </div>
  );
}
