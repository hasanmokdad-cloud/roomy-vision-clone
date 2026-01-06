import { useState, useRef, ReactNode } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaDropZoneProps {
  onFilesDropped: (files: File[]) => void;
  accept?: 'images' | 'videos' | 'both';
  multiple?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'image/avif', 'image/bmp', 'image/tiff', 'image/svg+xml'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/avi', 'video/x-matroska', 'video/3gpp', 'video/3gpp2', 'video/x-m4v'];

export function MediaDropZone({
  onFilesDropped,
  accept = 'both',
  multiple = true,
  disabled = false,
  children,
  className
}: MediaDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const getAllowedTypes = () => {
    if (accept === 'images') return IMAGE_TYPES;
    if (accept === 'videos') return VIDEO_TYPES;
    return [...IMAGE_TYPES, ...VIDEO_TYPES];
  };

  const filterFiles = (files: FileList | File[]): File[] => {
    const allowedTypes = getAllowedTypes();
    const fileArray = Array.from(files);
    const filtered = fileArray.filter(file => 
      allowedTypes.some(type => file.type === type || file.type.startsWith(type.split('/')[0]))
    );
    return multiple ? filtered : filtered.slice(0, 1);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (disabled) return;

    const files = filterFiles(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesDropped(files);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn("relative", className)}
    >
      {children}
      
      {isDragging && !disabled && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-xl flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium text-primary">Drop files here</p>
            <p className="text-xs text-muted-foreground">
              {accept === 'images' ? 'Images only' : accept === 'videos' ? 'Videos only' : 'Images or Videos'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
