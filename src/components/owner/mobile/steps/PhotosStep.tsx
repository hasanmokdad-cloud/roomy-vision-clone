import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Plus, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/utils/imageCompression';
import { toast } from '@/hooks/use-toast';

interface PhotosStepProps {
  coverImage: string;
  galleryImages: string[];
  onCoverChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
}

export function PhotosStep({ 
  coverImage, 
  galleryImages, 
  onCoverChange, 
  onGalleryChange 
}: PhotosStepProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File, isCover: boolean) => {
    try {
      const compressed = await compressImage(file);
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = isCover ? `dorm-images/${fileName}` : `dorm-gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('dorm-uploads')
        .upload(filePath, compressed);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dorm-uploads')
        .getPublicUrl(filePath);

      if (isCover) {
        onCoverChange(publicUrl);
      } else {
        onGalleryChange([...galleryImages, publicUrl]);
      }

      return true;
    } catch (error: any) {
      toast({ 
        title: 'Upload failed', 
        description: error.message,
        variant: 'destructive' 
      });
      return false;
    }
  };

  const handleCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      await handleUpload(file, true);
      setUploading(false);
    }
  };

  const handleGalleryFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    // Process files one by one but show single loading state
    const filesToUpload = Array.from(files).slice(0, 10 - galleryImages.length);
    
    for (const file of filesToUpload) {
      await handleUpload(file, false);
    }
    
    if (filesToUpload.length > 0) {
      toast({ title: `${filesToUpload.length} photo(s) uploaded!` });
    }
    
    setUploading(false);
    
    // Reset input value so the same files can be selected again
    e.target.value = '';
  };

  const removeGalleryImage = (index: number) => {
    onGalleryChange(galleryImages.filter((_, i) => i !== index));
  };

  // Only cover image is required now
  const hasCoverPhoto = !!coverImage;

  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Add photos of your dorm
        </h1>
        <p className="text-muted-foreground">
          Great photos help students find your dorm. They're the first thing students see!
        </p>
      </motion.div>

      {/* Requirements notice - only show if cover photo is missing */}
      {!hasCoverPhoto && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6"
        >
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Please add a cover photo to continue
          </p>
        </motion.div>
      )}

      {/* Cover Photo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <label className="block text-sm font-medium text-foreground mb-2">
          Cover Photo (Exterior) *
        </label>
        <div className="relative">
          {coverImage ? (
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              <button
                onClick={() => onCoverChange('')}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
              <Camera className="w-10 h-10 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Add cover photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverFileSelect}
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </motion.div>

      {/* Gallery Photos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-sm font-medium text-foreground mb-2">
          Gallery Photos (Rooms, Common Areas) - Optional
        </label>
        <div className="grid grid-cols-3 gap-2">
          {galleryImages.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
              <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeGalleryImage(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {galleryImages.length < 10 && (
            <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">Add photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleGalleryFileSelect}
                disabled={uploading}
              />
            </label>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {galleryImages.length}/10 photos
        </p>
      </motion.div>

      {uploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-background/80 flex items-center justify-center z-50"
        >
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-foreground">Uploading...</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
