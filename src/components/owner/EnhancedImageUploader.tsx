import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageDropzone } from './ImageDropzone';
import { ImagePreviewCard } from './ImagePreviewCard';
import { UploadProgressBar } from './UploadProgressBar';
import { ImageEditorModal } from './ImageEditorModal';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Upload, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedImageUploaderProps {
  existingImages?: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  bucketName?: string;
  folder?: string;
  allowReorder?: boolean;
  showPreview?: boolean;
}

export function EnhancedImageUploader({
  existingImages = [],
  onChange,
  maxImages = 10,
  bucketName = 'room-images',
  folder = '',
  allowReorder = true,
  showPreview = true,
}: EnhancedImageUploaderProps) {
  const {
    images,
    isUploading,
    addFiles,
    uploadAll,
    removeImage,
    reorderImages,
    replaceImage,
  } = useImageUpload(bucketName, folder);

  const { toast } = useToast();
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(existingImages);

  // Update existing images when prop changes
  useEffect(() => {
    setExistingImageUrls(existingImages);
  }, [existingImages]);

  // Handle file selection
  const handleFilesAdded = (files: File[]) => {
    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      toast({
        title: 'Too many images',
        description: `You can only upload ${remainingSlots} more image(s). Maximum is ${maxImages}.`,
        variant: 'destructive',
      });
      files = files.slice(0, remainingSlots);
    }

    if (files.length > 0) {
      addFiles(files);
    }
  };

  // Handle paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        handleFilesAdded(files);
        toast({ title: 'Images pasted', description: `${files.length} image(s) added` });
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [images.length, maxImages]);

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !allowReorder) return;
    reorderImages(result.source.index, result.destination.index);
  };

  // Remove existing image
  const handleRemoveExisting = (url: string) => {
    const updated = existingImageUrls.filter(img => img !== url);
    setExistingImageUrls(updated);
    onChange([...updated, ...uploadedUrls]);
  };

  // Upload all pending images
  const handleUploadAll = async () => {
    const urls = await uploadAll();
    const allUrls = [...existingImageUrls, ...urls];
    onChange(allUrls);
  };

  // Get uploaded URLs
  const uploadedUrls = images
    .filter((img) => img.status === 'success' && img.uploadedUrl)
    .map((img) => img.uploadedUrl!);

  // Update parent when uploads complete
  useEffect(() => {
    if (uploadedUrls.length > 0 && !isUploading) {
      const allUrls = [...existingImageUrls, ...uploadedUrls];
      onChange(allUrls);
    }
  }, [uploadedUrls.length, isUploading]);

  const handleEdit = (imageId: string) => {
    setEditingImageId(imageId);
    setEditorOpen(true);
  };

  const handleSaveEdit = (editedFile: File) => {
    if (!editingImageId) return;
    replaceImage(editingImageId, editedFile);
    setEditorOpen(false);
    setEditingImageId(null);
  };

  const completedCount = images.filter((img) => img.status === 'success').length;
  const failedCount = images.filter((img) => img.status === 'error').length;
  const pendingCount = images.filter((img) => img.status === 'pending').length;
  
  const editingImage = images.find(img => img.id === editingImageId);

  return (
    <div className="space-y-4">
      {/* Existing Images */}
      {existingImageUrls.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Existing Images ({existingImageUrls.length})</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {existingImageUrls.map((url, index) => (
              <Card key={url} className="relative group overflow-hidden">
                <img
                  src={url}
                  alt={`Existing ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                {index === 0 && (
                  <Badge className="absolute top-2 left-2 text-xs">Primary</Badge>
                )}
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveExisting(url)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {images.length > 0 && (
        <UploadProgressBar
          total={images.length}
          completed={completedCount}
          failed={failedCount}
        />
      )}

      {/* Dropzone */}
      {(existingImageUrls.length + images.length) < maxImages && (
        <ImageDropzone
          onFilesAdded={handleFilesAdded}
          multiple={true}
          className="border-2 border-dashed border-border hover:border-primary transition-colors"
        >
          <div className="text-center py-8">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Drop images here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              {existingImageUrls.length + images.length} / {maxImages} images • PNG, JPG, WEBP up to 10MB
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              You can also paste images with Ctrl+V
            </p>
          </div>
        </ImageDropzone>
      )}

      {/* Image Grid with Drag & Drop */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {pendingCount > 0
                ? `${pendingCount} image(s) ready to upload`
                : 'All images uploaded'}
            </p>
            <div className="flex gap-2">
              {pendingCount > 0 && (
                <Button
                  onClick={handleUploadAll}
                  disabled={isUploading}
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload All
                </Button>
              )}
              {failedCount > 0 && (
                <Button
                  onClick={() => {
                    images
                      .filter((img) => img.status === 'error')
                      .forEach((img) => removeImage(img.id));
                  }}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Failed
                </Button>
              )}
            </div>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="images" direction="horizontal">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
                >
                  {images.map((image, index) => (
                    <Draggable
                      key={image.id}
                      draggableId={image.id}
                      index={index}
                      isDragDisabled={!allowReorder || image.status === 'uploading'}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <ImagePreviewCard
                            image={image}
                            onDelete={() => removeImage(image.id)}
                            onEdit={image.status === 'pending' ? () => handleEdit(image.id) : undefined}
                            onSetPrimary={
                              index !== 0 && image.status === 'success'
                                ? () => reorderImages(index, 0)
                                : undefined
                            }
                            isPrimary={index === 0 && image.status === 'success'}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {/* Helper Text */}
      {images.length === 0 && existingImageUrls.length === 0 && (
        <Card className="p-4 bg-muted/50">
          <p className="text-sm text-center text-muted-foreground">
            No images uploaded yet. Add up to {maxImages} images to showcase this room.
          </p>
        </Card>
      )}

      {/* Image Editor Modal */}
      {editorOpen && editingImage && (
        <ImageEditorModal
          isOpen={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setEditingImageId(null);
          }}
          imageFile={editingImage.file}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
