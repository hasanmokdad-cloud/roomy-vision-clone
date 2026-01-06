import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, ImagePlus, Trash2, Check } from 'lucide-react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/utils/imageCompression';
import { useIsMobile } from '@/hooks/use-mobile';

interface PhotoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (urls: string[]) => void;
  maxFiles?: number;
  currentCount?: number;
  isCover?: boolean;
}

export function PhotoUploadModal({
  open,
  onOpenChange,
  onUpload,
  maxFiles = 10,
  currentCount = 0,
  isCover = false
}: PhotoUploadModalProps) {
  const isMobile = useIsMobile();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [uploadComplete, setUploadComplete] = useState<boolean[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const abortRef = useRef(false);

  const maxAllowed = isCover ? 1 : maxFiles - currentCount;

  // Disable + button for cover image when 1 file is selected
  const addMoreDisabled = isUploading || (isCover && selectedFiles.length >= 1);

  const handleFilesSelected = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(f => f.type.startsWith('image/')).slice(0, maxAllowed - selectedFiles.length);
    
    if (validFiles.length === 0) return;

    // Create previews
    const newPreviews: string[] = [];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === validFiles.length) {
          setPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, [maxAllowed, selectedFiles.length]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleBrowseClick = () => {
    if (!addMoreDisabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadClick = async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    
    abortRef.current = false;
    setIsUploading(true);
    setUploadProgress(new Array(selectedFiles.length).fill(0));
    setUploadComplete(new Array(selectedFiles.length).fill(false));
    setCompletedCount(0);
    setOverallProgress(0);
    
    const uploadedUrls: string[] = [];
    const totalFiles = selectedFiles.length;
    
    for (let i = 0; i < selectedFiles.length; i++) {
      if (abortRef.current) break;
      
      try {
        const file = selectedFiles[i];
        
        // Simulate progress for compression phase (0-30%)
        for (let p = 0; p <= 30; p += 10) {
          if (abortRef.current) break;
          await new Promise(r => setTimeout(r, 50));
          setUploadProgress(prev => {
            const updated = [...prev];
            updated[i] = p;
            return updated;
          });
          updateOverallProgress(i, p, totalFiles);
        }
        
        if (abortRef.current) break;
        
        const compressed = await compressImage(file);
        
        // Simulate progress for upload phase (30-90%)
        for (let p = 30; p <= 90; p += 15) {
          if (abortRef.current) break;
          await new Promise(r => setTimeout(r, 100));
          setUploadProgress(prev => {
            const updated = [...prev];
            updated[i] = p;
            return updated;
          });
          updateOverallProgress(i, p, totalFiles);
        }
        
        if (abortRef.current) break;
        
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = isCover ? `dorm-images/${fileName}` : `dorm-gallery/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('dorm-uploads')
          .upload(filePath, compressed);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('dorm-uploads')
          .getPublicUrl(filePath);
        
        uploadedUrls.push(publicUrl);
        
        // Complete this file (100%)
        setUploadProgress(prev => {
          const updated = [...prev];
          updated[i] = 100;
          return updated;
        });
        setUploadComplete(prev => {
          const updated = [...prev];
          updated[i] = true;
          return updated;
        });
        setCompletedCount(prev => prev + 1);
        updateOverallProgress(i, 100, totalFiles);
        
      } catch (error) {
        console.error('Upload failed for file:', i, error);
      }
    }
    
    // Small delay to show completion state
    await new Promise(r => setTimeout(r, 500));
    
    if (!abortRef.current && uploadedUrls.length > 0) {
      onUpload(uploadedUrls);
    }
    
    handleClose();
  };

  const updateOverallProgress = (currentIndex: number, currentProgress: number, total: number) => {
    setUploadProgress(prev => {
      const completedProgress = prev.slice(0, currentIndex).reduce((a, b) => a + b, 0);
      const overall = Math.round((completedProgress + currentProgress) / (total * 100) * 100);
      setOverallProgress(overall);
      return prev;
    });
  };

  const handleCancel = () => {
    if (isUploading) {
      // Abort uploads and reset to pre-upload state
      abortRef.current = true;
      setIsUploading(false);
      setUploadProgress([]);
      setUploadComplete([]);
      setCompletedCount(0);
      setOverallProgress(0);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    abortRef.current = true;
    setSelectedFiles([]);
    setPreviews([]);
    setIsDragOver(false);
    setIsUploading(false);
    setUploadProgress([]);
    setUploadComplete([]);
    setCompletedCount(0);
    setOverallProgress(0);
    onOpenChange(false);
  };

  const itemCount = selectedFiles.length;
  const subtitle = isUploading
    ? `${completedCount} of ${itemCount} items uploaded`
    : itemCount === 0 
      ? 'No items selected' 
      : `${itemCount} item${itemCount > 1 ? 's' : ''} selected`;

  // Shared content for both Drawer and Dialog
  const modalContent = (
    <>
      {/* Header */}
      <div className="relative py-4 px-4 text-center border-b border-border">
        <button
          onClick={handleClose}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
        
        <div>
          <h2 className="text-base font-semibold text-foreground">Upload photos</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        
        <button
          onClick={handleBrowseClick}
          disabled={addMoreDisabled}
          className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors
            ${addMoreDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted'}
          `}
        >
          <Plus className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Progress bar - only visible during upload */}
      {isUploading && (
        <div className="h-[2px] bg-muted w-full">
          <div 
            className="h-full bg-foreground transition-all duration-300 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4" style={{ maxHeight: isMobile ? 'calc(85vh - 180px)' : '400px' }}>
        {previews.length === 0 ? (
          /* Dropzone - shown when no images */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border border-dashed rounded-xl py-12 px-6 text-center transition-all
              ${isDragOver 
                ? 'border-foreground bg-muted' 
                : 'border-border bg-background'
              }
            `}
          >
            <div className="flex justify-center mb-4">
              <ImagePlus className="w-12 h-12 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">Drag and drop</h3>
            <p className="text-sm text-muted-foreground mb-4">or browse for photos</p>
            <button
              onClick={handleBrowseClick}
              className="px-6 py-3 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-colors"
            >
              Browse
            </button>
          </div>
        ) : (
          /* Image Grid - shown when images are selected */
          <div className="grid grid-cols-2 gap-3">
            {previews.map((preview, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-lg overflow-hidden"
              >
                <img 
                  src={preview} 
                  alt={`Preview ${index + 1}`} 
                  className="w-full h-auto object-cover"
                />
                
                {/* Top-right button: Trash (pre-upload) or X (during upload) */}
                <button
                  onClick={() => isUploading ? undefined : removeFile(index)}
                  disabled={isUploading}
                  className={`absolute top-2 right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center transition-colors
                    ${isUploading ? 'cursor-default' : 'hover:bg-gray-800'}
                  `}
                >
                  {isUploading ? (
                    <X className="w-4 h-4 text-white" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-white" />
                  )}
                </button>
                
                {/* Center progress indicator - only during upload */}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    {uploadComplete[index] ? (
                      /* Checkmark when complete */
                      <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center bg-black/30">
                        <Check className="w-6 h-6 text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      /* Circular progress spinner */
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                        <circle 
                          cx="24" cy="24" r="20" 
                          fill="none" 
                          stroke="rgba(255,255,255,0.3)" 
                          strokeWidth="3"
                        />
                        <circle 
                          cx="24" cy="24" r="20" 
                          fill="none" 
                          stroke="white" 
                          strokeWidth="3"
                          strokeDasharray={125.6}
                          strokeDashoffset={125.6 - (125.6 * (uploadProgress[index] || 0) / 100)}
                          strokeLinecap="round"
                          className="transition-all duration-200"
                        />
                      </svg>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={!isCover}
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-4 flex justify-between items-center">
        <button
          onClick={handleCancel}
          className="text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
        >
          {selectedFiles.length === 0 ? 'Done' : 'Cancel'}
        </button>
        <button
          onClick={handleUploadClick}
          disabled={selectedFiles.length === 0 || isUploading}
          className={`
            px-6 py-3 text-sm font-medium rounded-lg transition-colors min-w-[100px] flex items-center justify-center
            ${selectedFiles.length === 0
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-foreground text-background hover:bg-foreground/90'
            }
          `}
        >
          {isUploading ? (
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-background rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-background rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-background rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            'Upload'
          )}
        </button>
      </div>
    </>
  );

  // Render Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-background max-h-[85vh] rounded-t-[20px] [&>[data-vaul-handle-wrapper]]:hidden">
          {modalContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden [&>button]:hidden">
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}