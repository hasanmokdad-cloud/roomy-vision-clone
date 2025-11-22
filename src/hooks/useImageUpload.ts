import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/utils/imageCompression';
import { generateUniqueFileName, validateImageFile } from '@/utils/fileUtils';
import { useToast } from '@/hooks/use-toast';

export interface ImageUploadState {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  compressedSize?: number;
  originalSize: number;
  error?: string;
  uploadedUrl?: string;
}

export const useImageUpload = (bucketName: string = 'room-images', folder: string = '') => {
  const [images, setImages] = useState<ImageUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const addFiles = (files: File[]) => {
    const newImages: ImageUploadState[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
      progress: 0,
      originalSize: file.size,
    }));

    setImages((prev) => [...prev, ...newImages]);
    return newImages;
  };

  const uploadImage = async (imageState: ImageUploadState): Promise<string | null> => {
    const validation = validateImageFile(imageState.file);
    if (!validation.valid) {
      updateImageState(imageState.id, { status: 'error', error: validation.error });
      toast({ title: 'Error', description: validation.error, variant: 'destructive' });
      return null;
    }

    updateImageState(imageState.id, { status: 'uploading', progress: 0 });

    try {
      // Compress image
      const compressed = await compressImage(imageState.file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      updateImageState(imageState.id, { 
        progress: 50,
        compressedSize: compressed.size 
      });

      // Upload to Supabase
      const fileName = generateUniqueFileName(imageState.file.name);
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, compressed);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      updateImageState(imageState.id, {
        status: 'success',
        progress: 100,
        uploadedUrl: publicUrl,
      });

      return publicUrl;
    } catch (error: any) {
      updateImageState(imageState.id, {
        status: 'error',
        error: error.message,
      });
      toast({ 
        title: 'Upload Failed', 
        description: error.message, 
        variant: 'destructive' 
      });
      return null;
    }
  };

  const uploadAll = async (): Promise<string[]> => {
    setIsUploading(true);
    const pendingImages = images.filter((img) => img.status === 'pending');
    
    const uploadPromises = pendingImages.map((img) => uploadImage(img));
    const results = await Promise.all(uploadPromises);
    
    setIsUploading(false);
    return results.filter((url): url is string => url !== null);
  };

  const updateImageState = (id: string, updates: Partial<ImageUploadState>) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...updates } : img))
    );
  };

  const removeImage = async (id: string) => {
    const image = images.find((img) => img.id === id);
    if (image?.uploadedUrl && image.status === 'success') {
      // Extract file path from URL
      const urlParts = image.uploadedUrl.split('/');
      const filePath = folder 
        ? `${folder}/${urlParts[urlParts.length - 1]}`
        : urlParts[urlParts.length - 1];

      await supabase.storage.from(bucketName).remove([filePath]);
    }

    setImages((prev) => prev.filter((img) => img.id !== id));
    URL.revokeObjectURL(image?.preview || '');
  };

  const reorderImages = (startIndex: number, endIndex: number) => {
    setImages((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const reset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  return {
    images,
    isUploading,
    addFiles,
    uploadImage,
    uploadAll,
    removeImage,
    reorderImages,
    updateImageState,
    reset,
  };
};
