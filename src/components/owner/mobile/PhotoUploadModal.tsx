import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ImagePlus, Trash2 } from 'lucide-react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

interface PhotoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => void;
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxAllowed = isCover ? 1 : maxFiles - currentCount;

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
    fileInputRef.current?.click();
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

  const handleUploadClick = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setIsDragOver(false);
    onOpenChange(false);
  };

  const itemCount = selectedFiles.length;
  const subtitle = itemCount === 0 
    ? 'No items selected' 
    : `${itemCount} item${itemCount > 1 ? 's' : ''} selected`;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-white max-h-[85vh] rounded-t-[20px] [&>[data-vaul-handle-wrapper]]:hidden">
        {/* Header */}
        <div className="relative py-4 px-4 text-center">
          <button
            onClick={handleClose}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-800" />
          </button>
          
          <div>
            <h2 className="text-base font-semibold text-gray-900">Upload photos</h2>
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          
          <button
            onClick={handleBrowseClick}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-800" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 pb-4">
          {previews.length === 0 ? (
            /* Dropzone - shown when no images */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border border-dashed rounded-xl py-12 px-6 text-center transition-all
                ${isDragOver 
                  ? 'border-gray-800 bg-gray-50' 
                  : 'border-gray-300 bg-white'
                }
              `}
            >
              <div className="flex justify-center mb-4">
                <ImagePlus className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">Drag and drop</h3>
              <p className="text-sm text-gray-500 mb-4">or browse for photos</p>
              <button
                onClick={handleBrowseClick}
                className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
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
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative rounded-lg overflow-hidden"
                >
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-auto object-cover"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
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
        <div className="border-t border-gray-200 px-4 py-4 flex justify-between items-center">
          <button
            onClick={handleClose}
            className="text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors"
          >
            {selectedFiles.length === 0 ? 'Done' : 'Cancel'}
          </button>
          <button
            onClick={handleUploadClick}
            disabled={selectedFiles.length === 0}
            className={`
              px-6 py-3 text-sm font-medium rounded-lg transition-colors
              ${selectedFiles.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800'
              }
            `}
          >
            Upload
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
