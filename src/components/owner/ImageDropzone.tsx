import { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ImageDropzone({ 
  onFilesAdded, 
  multiple = true, 
  className,
  children 
}: ImageDropzoneProps) {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [onFilesAdded]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      onFilesAdded(files);
    }
    
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [onFilesAdded]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn(
        "border-2 border-dashed rounded-lg transition-colors cursor-pointer",
        "hover:border-primary hover:bg-primary/5",
        "flex flex-col items-center justify-center gap-2 p-6",
        className
      )}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {children || (
        <>
          <Upload className="w-10 h-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Drop images here or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">
              {multiple ? 'Multiple files supported' : 'Single file only'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
