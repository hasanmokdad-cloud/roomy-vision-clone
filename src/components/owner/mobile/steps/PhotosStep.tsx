import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/utils/imageCompression';
import { toast } from '@/hooks/use-toast';
import CameraIcon from '@/assets/camera-icon.avif';

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
    
    const filesToUpload = Array.from(files).slice(0, 10 - galleryImages.length);
    
    for (const file of filesToUpload) {
      await handleUpload(file, false);
    }
    
    if (filesToUpload.length > 0) {
      toast({ title: `${filesToUpload.length} photo(s) uploaded!` });
    }
    
    setUploading(false);
    e.target.value = '';
  };

  const removeGalleryImage = (index: number) => {
    onGalleryChange(galleryImages.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
            Add photos of your dorm
          </h1>
        </motion.div>

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
              <div className="relative h-[200px] lg:h-[240px] rounded-xl overflow-hidden border border-border">
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                <button
                  onClick={() => onCoverChange('')}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-[200px] lg:h-[240px] rounded-xl border border-dashed border-muted-foreground/40 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                <img 
                  src={CameraIcon} 
                  alt="Camera" 
                  className="w-16 h-16 lg:w-20 lg:h-20 mb-4 object-contain opacity-60" 
                />
                <button 
                  type="button"
                  className="px-5 py-2 bg-background border border-foreground rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.parentElement?.querySelector('input');
                    input?.click();
                  }}
                >
                  Add photos
                </button>
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
          
          {galleryImages.length === 0 ? (
            <label className="flex flex-col items-center justify-center h-[160px] lg:h-[180px] rounded-xl border border-dashed border-muted-foreground/40 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
              <img 
                src={CameraIcon} 
                alt="Camera" 
                className="w-12 h-12 lg:w-14 lg:h-14 mb-3 object-contain opacity-60" 
              />
              <button 
                type="button"
                className="px-5 py-2 bg-background border border-foreground rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.parentElement?.querySelector('input');
                  input?.click();
                }}
              >
                Add photos
              </button>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleGalleryFileSelect}
                disabled={uploading}
              />
            </label>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {galleryImages.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {galleryImages.length < 10 && (
                  <label className="flex flex-col items-center justify-center aspect-square rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                    <img 
                      src={CameraIcon} 
                      alt="Add" 
                      className="w-8 h-8 mb-1 object-contain opacity-60" 
                    />
                    <span className="text-xs text-muted-foreground">Add</span>
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
              <p className="text-xs text-muted-foreground text-center">
                {galleryImages.length}/10 photos
              </p>
            </div>
          )}
        </motion.div>
      </div>

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
