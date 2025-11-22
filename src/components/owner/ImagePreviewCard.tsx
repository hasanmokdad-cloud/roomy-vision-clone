import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, Star, AlertCircle, CheckCircle, Loader2, GripVertical, Edit } from 'lucide-react';
import { formatFileSize } from '@/utils/fileUtils';
import type { ImageUploadState } from '@/hooks/useImageUpload';

interface ImagePreviewCardProps {
  image: ImageUploadState;
  onDelete: () => void;
  onEdit?: () => void;
  onSetPrimary?: () => void;
  isPrimary?: boolean;
  isDragging?: boolean;
}

export function ImagePreviewCard({
  image,
  onDelete,
  onEdit,
  onSetPrimary,
  isPrimary = false,
  isDragging = false,
}: ImagePreviewCardProps) {
  const [imageError, setImageError] = useState(false);

  const getStatusIcon = () => {
    switch (image.status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      } ${isPrimary ? 'ring-2 ring-primary' : ''}`}
    >
      {/* Drag Handle */}
      <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing">
        <div className="bg-background/80 backdrop-blur-sm rounded p-1">
          <GripVertical className="w-4 h-4 text-foreground/60" />
        </div>
      </div>

      {/* Primary Badge */}
      {isPrimary && (
        <Badge className="absolute top-2 right-2 z-10 bg-primary/90 backdrop-blur-sm">
          <Star className="w-3 h-3 mr-1 fill-current" />
          Primary
        </Badge>
      )}

      {/* Image */}
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {!imageError ? (
          <img
            src={image.preview || image.uploadedUrl}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info Overlay */}
      <div className="p-3 space-y-2">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-xs font-medium">
              {image.status === 'uploading' && 'Uploading...'}
              {image.status === 'success' && 'Uploaded'}
              {image.status === 'error' && 'Failed'}
              {image.status === 'pending' && 'Ready'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            {onEdit && image.status === 'pending' && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onEdit}
                className="h-8 w-8"
                title="Edit image"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onSetPrimary && !isPrimary && image.status === 'success' && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onSetPrimary}
                className="h-8 w-8"
              >
                <Star className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              className="h-8 w-8 text-destructive hover:text-destructive"
              disabled={image.status === 'uploading'}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {image.status === 'uploading' && (
          <Progress value={image.progress} className="h-1" />
        )}

        {/* Error Message */}
        {image.status === 'error' && image.error && (
          <p className="text-xs text-destructive">{image.error}</p>
        )}

        {/* Size Info */}
        {image.status !== 'error' && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Original:</span>
              <span>{formatFileSize(image.originalSize)}</span>
            </div>
            {image.compressedSize && (
              <div className="flex justify-between">
                <span>Compressed:</span>
                <span className="text-green-600">
                  {formatFileSize(image.compressedSize)}
                  <span className="ml-1">
                    (-{Math.round((1 - image.compressedSize / image.originalSize) * 100)}%)
                  </span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
