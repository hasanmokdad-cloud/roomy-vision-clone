import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePlus, Video, X, Upload, Eye, ChevronDown, ChevronUp, Play, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { WizardRoomData } from './RoomNamesStep';
import { WizardRoomPreviewModal } from '../WizardRoomPreviewModal';
import { RoomUploadProgressBar, RoomUploadProgress } from '../RoomUploadProgressBar';
import { MediaDropZone } from '../MediaDropZone';
import { DraggableRoomImages } from '../DraggableRoomImages';
import { ImageEditorModal } from '@/components/owner/ImageEditorModal';
import { VideoTrimmerModal } from '../VideoTrimmerModal';
import { uploadFileWithProgress, generateFilePath, UploadHandle } from '@/utils/uploadWithProgress';

interface RoomMediaStepProps {
  rooms: WizardRoomData[];
  selectedIds: string[];
  onChange: (rooms: WizardRoomData[]) => void;
}

// Comprehensive file type accepts
const IMAGE_ACCEPT = "image/*,.heic,.heif,.avif,.bmp,.tiff,.tif,.svg,.ico,.jfif,.raw,.cr2,.nef,.arw";
const VIDEO_ACCEPT = "video/*,.mov,.avi,.wmv,.mkv,.3gp,.3g2,.flv,.m4v,.mpg,.mpeg";

export function RoomMediaStep({ rooms, selectedIds, onChange }: RoomMediaStepProps) {
  // Per-room upload tracking
  const [roomUploads, setRoomUploads] = useState<Record<string, RoomUploadProgress[]>>({});
  const [bulkUploads, setBulkUploads] = useState<RoomUploadProgress[]>([]);
  
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [typeFilteredIds, setTypeFilteredIds] = useState<string[]>([]);
  const [previewRoom, setPreviewRoom] = useState<WizardRoomData | null>(null);
  
  // Image Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [pendingUpload, setPendingUpload] = useState<{
    roomId: string | 'bulk';
    files: File[];
    currentIndex: number;
  } | null>(null);
  
  // Video Trimmer state
  const [videoTrimmerOpen, setVideoTrimmerOpen] = useState(false);
  const [trimmingVideoFile, setTrimmingVideoFile] = useState<File | null>(null);
  const [pendingVideoUpload, setPendingVideoUpload] = useState<{
    roomId: string | 'bulk';
  } | null>(null);

  // File input refs for each room
  const imageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const videoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  // Upload abort handles
  const uploadHandlesRef = useRef<Map<string, UploadHandle>>(new Map());
  // Track cancelled files to prevent adding their URLs
  const cancelledFilesRef = useRef<Set<string>>(new Set());

  // Get unique room types
  const roomTypes = [...new Set(rooms.map(r => r.type).filter(Boolean))] as string[];

  // Handle type filter selection
  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    if (type && type !== 'all') {
      const filtered = rooms.filter(r => r.type === type).map(r => r.id);
      setTypeFilteredIds(filtered);
    } else {
      setTypeFilteredIds([]);
    }
  };

  // Get the effective selected IDs (type filter overrides if set)
  const effectiveSelectedIds = typeFilteredIds.length > 0 ? typeFilteredIds : selectedIds;

  const isRoomUploading = (roomId: string) => {
    const uploads = roomUploads[roomId] || [];
    return uploads.some(u => u.status === 'uploading');
  };

  const isBulkUploading = bulkUploads.some(u => u.status === 'uploading');

  // Upload single file with real-time progress
  const uploadFile = async (
    file: File,
    roomId: string,
    isVideo: boolean,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    const filePath = generateFilePath('wizard-rooms', file.name, isVideo);
    
    // Create a handle to track this upload
    const handleRef: { current: UploadHandle | null } = { current: null };
    
    const url = await uploadFileWithProgress(
      file,
      'room-images',
      filePath,
      onProgress,
      handleRef
    );
    
    // Store handle for potential cancellation
    if (handleRef.current) {
      uploadHandlesRef.current.set(file.name, handleRef.current);
    }

    return url;
  };

  // Cancel upload handler
  const handleCancelUpload = (fileName: string, roomId: string | 'bulk') => {
    // Mark as cancelled first - this prevents the URL from being added
    cancelledFilesRef.current.add(fileName);
    
    const handle = uploadHandlesRef.current.get(fileName);
    if (handle) {
      handle.abort();
      uploadHandlesRef.current.delete(fileName);
    }
    
    // Remove from progress state
    if (roomId === 'bulk') {
      setBulkUploads(prev => prev.filter(u => u.fileName !== fileName));
    } else {
      setRoomUploads(prev => ({
        ...prev,
        [roomId]: (prev[roomId] || []).filter(u => u.fileName !== fileName)
      }));
    }
  };

  // Open editor for file
  const openEditorForFile = (roomId: string | 'bulk', files: File[], index: number = 0) => {
    if (index >= files.length) {
      // All files edited, start upload
      startUpload(roomId, files);
      return;
    }
    
    const file = files[index];
    // Only edit images
    if (file.type.startsWith('image/')) {
      setEditingFile(file);
      setPendingUpload({ roomId, files, currentIndex: index });
      setEditorOpen(true);
    } else {
      // Skip to next or upload
      openEditorForFile(roomId, files, index + 1);
    }
  };

  const handleEditorSave = (editedFile: File) => {
    if (!pendingUpload) return;
    
    // Replace the file in the array with edited version
    const newFiles = [...pendingUpload.files];
    newFiles[pendingUpload.currentIndex] = editedFile;
    
    setEditorOpen(false);
    setEditingFile(null);
    
    // Move to next file or start upload
    const nextIndex = pendingUpload.currentIndex + 1;
    if (nextIndex < newFiles.length && newFiles[nextIndex].type.startsWith('image/')) {
      openEditorForFile(pendingUpload.roomId, newFiles, nextIndex);
    } else {
      startUpload(pendingUpload.roomId, newFiles);
      setPendingUpload(null);
    }
  };

  const handleEditorSkip = () => {
    if (!pendingUpload) return;
    
    setEditorOpen(false);
    setEditingFile(null);
    
    const nextIndex = pendingUpload.currentIndex + 1;
    if (nextIndex < pendingUpload.files.length) {
      const nextFile = pendingUpload.files[nextIndex];
      if (nextFile.type.startsWith('image/')) {
        openEditorForFile(pendingUpload.roomId, pendingUpload.files, nextIndex);
        return;
      }
    }
    
    startUpload(pendingUpload.roomId, pendingUpload.files);
    setPendingUpload(null);
  };

  const startUpload = async (roomId: string | 'bulk', files: File[]) => {
    const targetRoomIds = roomId === 'bulk' ? effectiveSelectedIds : [roomId];
    
    if (targetRoomIds.length === 0) {
      toast({
        title: 'No rooms selected',
        description: 'Please select rooms first',
        variant: 'destructive',
      });
      return;
    }

    // Separate images and videos
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const videoFiles = files.filter(f => f.type.startsWith('video/'));

    // Check video size
    for (const video of videoFiles) {
      if (video.size > 50 * 1024 * 1024) {
        toast({
          title: 'Video too large',
          description: `${video.name} exceeds 50MB limit`,
          variant: 'destructive',
        });
        return;
      }
    }

    // Initialize upload progress for all target rooms
    const initialProgress: RoomUploadProgress[] = [
      ...imageFiles.map((f, i) => ({
        roomId: roomId === 'bulk' ? 'bulk' : roomId,
        fileName: f.name,
        progress: 0,
        type: 'image' as const,
        status: 'uploading' as const,
      })),
      ...videoFiles.map(f => ({
        roomId: roomId === 'bulk' ? 'bulk' : roomId,
        fileName: f.name,
        progress: 0,
        type: 'video' as const,
        status: 'uploading' as const,
      })),
    ];

    if (roomId === 'bulk') {
      setBulkUploads(initialProgress);
    } else {
      setRoomUploads(prev => ({
        ...prev,
        [roomId]: initialProgress
      }));
    }

    try {
      const uploadedImageUrls: string[] = [];
      let uploadedVideoUrl: string | undefined;

      // Upload images
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        
        // Skip if already cancelled
        if (cancelledFilesRef.current.has(file.name)) {
          continue;
        }
        
        try {
          const url = await uploadFile(file, roomId.toString(), false, (progress) => {
            // Check if cancelled during upload
            if (cancelledFilesRef.current.has(file.name)) return;
            
            const updateProgress = (prev: RoomUploadProgress[]) =>
              prev.map((p, idx) => idx === i ? { ...p, progress } : p);
            
            if (roomId === 'bulk') {
              setBulkUploads(updateProgress);
            } else {
              setRoomUploads(prev => ({
                ...prev,
                [roomId]: updateProgress(prev[roomId] || [])
              }));
            }
          });
          
          // Only add URL if not cancelled
          if (!cancelledFilesRef.current.has(file.name)) {
            uploadedImageUrls.push(url);
            
            // Mark as complete
            const markComplete = (prev: RoomUploadProgress[]) =>
              prev.map((p, idx) => idx === i ? { ...p, status: 'complete' as const, progress: 100 } : p);
            
            if (roomId === 'bulk') {
              setBulkUploads(markComplete);
            } else {
              setRoomUploads(prev => ({
                ...prev,
                [roomId]: markComplete(prev[roomId] || [])
              }));
            }
          }
        } catch (error: any) {
          // Check if it was a cancellation (abort)
          if (error.message === 'Upload cancelled' || cancelledFilesRef.current.has(file.name)) {
            console.log('Upload cancelled for:', file.name);
            continue; // Skip to next file
          }
          
          const markError = (prev: RoomUploadProgress[]) =>
            prev.map((p, idx) => idx === i ? { ...p, status: 'error' as const } : p);
          
          if (roomId === 'bulk') {
            setBulkUploads(markError);
          } else {
            setRoomUploads(prev => ({
              ...prev,
              [roomId]: markError(prev[roomId] || [])
            }));
          }
        }
      }

      // Upload video (only first one)
      if (videoFiles.length > 0) {
        const videoFile = videoFiles[0];
        const videoIdx = imageFiles.length;
        
        // Skip if already cancelled
        if (!cancelledFilesRef.current.has(videoFile.name)) {
          try {
            uploadedVideoUrl = await uploadFile(videoFile, roomId.toString(), true, (progress) => {
              // Check if cancelled during upload
              if (cancelledFilesRef.current.has(videoFile.name)) return;
              
              const updateProgress = (prev: RoomUploadProgress[]) =>
                prev.map((p, idx) => idx === videoIdx ? { ...p, progress } : p);
              
              if (roomId === 'bulk') {
                setBulkUploads(updateProgress);
              } else {
                setRoomUploads(prev => ({
                  ...prev,
                  [roomId]: updateProgress(prev[roomId] || [])
                }));
              }
            });
            
            // Only mark complete if not cancelled
            if (!cancelledFilesRef.current.has(videoFile.name)) {
              const markComplete = (prev: RoomUploadProgress[]) =>
                prev.map((p, idx) => idx === videoIdx ? { ...p, status: 'complete' as const, progress: 100 } : p);
              
              if (roomId === 'bulk') {
                setBulkUploads(markComplete);
              } else {
                setRoomUploads(prev => ({
                  ...prev,
                  [roomId]: markComplete(prev[roomId] || [])
                }));
              }
            } else {
              // Cancelled - clear the URL
              uploadedVideoUrl = undefined;
            }
          } catch (error: any) {
            // Check if it was a cancellation (abort)
            if (error.message === 'Upload cancelled' || cancelledFilesRef.current.has(videoFile.name)) {
              console.log('Video upload cancelled for:', videoFile.name);
            } else {
              const markError = (prev: RoomUploadProgress[]) =>
                prev.map((p, idx) => idx === videoIdx ? { ...p, status: 'error' as const } : p);
              
              if (roomId === 'bulk') {
                setBulkUploads(markError);
              } else {
                setRoomUploads(prev => ({
                  ...prev,
                  [roomId]: markError(prev[roomId] || [])
                }));
              }
            }
          }
        }
      }
      
      // Clear cancelled files after processing
      cancelledFilesRef.current.clear();

      // Apply to rooms
      const updated = rooms.map(room => {
        if (targetRoomIds.includes(room.id)) {
          return {
            ...room,
            images: [...room.images, ...uploadedImageUrls],
            ...(uploadedVideoUrl ? { video_url: uploadedVideoUrl } : {})
          };
        }
        return room;
      });
      onChange(updated);

      toast({
        title: 'Upload complete',
        description: `${uploadedImageUrls.length} image(s)${uploadedVideoUrl ? ' and 1 video' : ''} added`,
      });

      // Clear progress after delay
      setTimeout(() => {
        if (roomId === 'bulk') {
          setBulkUploads([]);
        } else {
          setRoomUploads(prev => {
            const newState = { ...prev };
            delete newState[roomId];
            return newState;
          });
        }
      }, 2000);

    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFilesSelected = (roomId: string | 'bulk', files: File[], skipEditor: boolean = false) => {
    if (files.length === 0) return;
    
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const videoFiles = files.filter(f => f.type.startsWith('video/'));
    
    // Handle video files first with trimmer
    if (videoFiles.length > 0) {
      setTrimmingVideoFile(videoFiles[0]);
      setPendingVideoUpload({ roomId });
      setVideoTrimmerOpen(true);
      // If there are also images, we'll handle them after video
      if (imageFiles.length > 0) {
        setPendingUpload({ roomId, files: imageFiles, currentIndex: 0 });
      }
      return;
    }
    
    // If there are images and we're not skipping editor, open editor
    if (imageFiles.length > 0 && !skipEditor) {
      openEditorForFile(roomId, imageFiles, 0);
    } else if (imageFiles.length > 0) {
      startUpload(roomId, imageFiles);
    }
  };

  const handleVideoTrimSave = (trimmedFile: File) => {
    setVideoTrimmerOpen(false);
    setTrimmingVideoFile(null);
    
    if (pendingVideoUpload) {
      // Upload the trimmed video
      startUpload(pendingVideoUpload.roomId, [trimmedFile]);
      
      // If there are pending images, open editor for them
      if (pendingUpload) {
        setTimeout(() => {
          openEditorForFile(pendingUpload.roomId, pendingUpload.files, 0);
        }, 100);
      }
    }
    
    setPendingVideoUpload(null);
  };

  const handleVideoTrimSkip = () => {
    setVideoTrimmerOpen(false);
    
    if (pendingVideoUpload && trimmingVideoFile) {
      // Upload original video without trimming
      startUpload(pendingVideoUpload.roomId, [trimmingVideoFile]);
      
      // If there are pending images, open editor for them
      if (pendingUpload) {
        setTimeout(() => {
          openEditorForFile(pendingUpload.roomId, pendingUpload.files, 0);
        }, 100);
      }
    }
    
    setTrimmingVideoFile(null);
    setPendingVideoUpload(null);
  };

  const handleReorderImages = (roomId: string, newOrder: string[]) => {
    const updated = rooms.map(room =>
      room.id === roomId ? { ...room, images: newOrder } : room
    );
    onChange(updated);
  };

  const handleBulkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (effectiveSelectedIds.length === 0) {
      toast({
        title: 'No rooms selected',
        description: 'Please select rooms using the type filter first',
        variant: 'destructive',
      });
      return;
    }
    
    handleFilesSelected('bulk', files);
    e.target.value = '';
  };

  const handleBulkVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFilesSelected('bulk', files, true);
    e.target.value = '';
  };

  const handleSingleRoomImageUpload = (roomId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFilesSelected(roomId, files);
    e.target.value = '';
  };

  const handleSingleRoomVideoUpload = (roomId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFilesSelected(roomId, files, true);
    e.target.value = '';
  };

  const handleDroppedFiles = (roomId: string, files: File[]) => {
    handleFilesSelected(roomId, files);
  };

  const removeImage = (roomId: string, imageIndex: number) => {
    const updated = rooms.map(room =>
      room.id === roomId
        ? { ...room, images: room.images.filter((_, i) => i !== imageIndex) }
        : room
    );
    onChange(updated);
  };

  const removeVideo = (roomId: string) => {
    const updated = rooms.map(room =>
      room.id === roomId
        ? { ...room, video_url: undefined }
        : room
    );
    onChange(updated);
  };

  const roomsWithMedia = rooms.filter(r => r.images.length > 0 || r.video_url).length;

  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Showcase your rooms
        </h1>
        <p className="text-muted-foreground">
          Upload images and videos to help students see your rooms
        </p>
      </motion.div>

      {/* Bulk Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <MediaDropZone
          onFilesDropped={(files) => handleFilesSelected('bulk', files)}
          disabled={effectiveSelectedIds.length === 0 || isBulkUploading}
        >
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-5 h-5 text-primary" />
              <span className="font-semibold">Bulk Upload</span>
            </div>

            {/* Type Filter */}
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">Select by room type</label>
              <Select value={selectedType} onValueChange={handleTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select room type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rooms</SelectItem>
                  {roomTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type} ({rooms.filter(r => r.type === type).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {effectiveSelectedIds.length > 0 && (
                <Badge variant="secondary" className="mt-2">
                  {effectiveSelectedIds.length} rooms selected
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Upload media that will be added to all selected rooms. Drag & drop supported.
            </p>

            {/* Bulk Upload Progress */}
            {bulkUploads.length > 0 && (
              <RoomUploadProgressBar 
                uploads={bulkUploads} 
                onCancel={(fileName) => handleCancelUpload(fileName, 'bulk')}
              />
            )}

            <div className="flex gap-3">
              {/* Bulk Image Upload */}
              <label className="flex-1">
                <Input
                  type="file"
                  accept={IMAGE_ACCEPT}
                  multiple
                  onChange={handleBulkImageUpload}
                  disabled={isBulkUploading || effectiveSelectedIds.length === 0}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl gap-2"
                  disabled={isBulkUploading || effectiveSelectedIds.length === 0}
                  asChild
                >
                  <span>
                    {isBulkUploading && bulkUploads.some(u => u.type === 'image' && u.status === 'uploading') ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImagePlus className="w-4 h-4" />
                    )}
                    Images
                  </span>
                </Button>
              </label>

              {/* Bulk Video Upload */}
              <label className="flex-1">
                <Input
                  type="file"
                  accept={VIDEO_ACCEPT}
                  onChange={handleBulkVideoUpload}
                  disabled={isBulkUploading || effectiveSelectedIds.length === 0}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl gap-2"
                  disabled={isBulkUploading || effectiveSelectedIds.length === 0}
                  asChild
                >
                  <span>
                    {isBulkUploading && bulkUploads.some(u => u.type === 'video' && u.status === 'uploading') ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Video className="w-4 h-4" />
                    )}
                    Video
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </MediaDropZone>
      </motion.div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Individual Rooms</span>
        <Badge variant="outline">{roomsWithMedia} with media</Badge>
      </div>

      <ScrollArea className="h-[calc(100vh-560px)]">
        <div className="space-y-3 pr-4">
          {rooms.map((room, index) => {
            const hasMedia = room.images.length > 0 || room.video_url;
            const roomIsUploading = isRoomUploading(room.id);
            const uploads = roomUploads[room.id] || [];
            
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <MediaDropZone
                  onFilesDropped={(files) => handleDroppedFiles(room.id, files)}
                  disabled={roomIsUploading}
                >
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-4 flex items-center justify-between">
                      <button
                        onClick={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
                        className="flex items-center gap-3 text-left flex-1"
                      >
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          {room.images.length > 0 ? (
                            <img
                              src={room.images[0]}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : room.video_url ? (
                            <Play className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ImagePlus className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground truncate">
                              {room.name || `Room ${index + 1}`}
                            </span>
                            {room.type && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {room.type}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {room.images.length} image{room.images.length !== 1 ? 's' : ''}
                            {room.video_url && ' • 1 video'}
                          </span>
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        {hasMedia && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewRoom(room)}
                            className="gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
                        >
                          {expandedRoom === room.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {expandedRoom === room.id && (
                      <div className="px-4 pb-4 space-y-3 border-t pt-3">
                        {/* Upload Progress for this room */}
                        {uploads.length > 0 && (
                          <RoomUploadProgressBar 
                            uploads={uploads} 
                            onCancel={(fileName) => handleCancelUpload(fileName, room.id)}
                          />
                        )}

                        {/* Images with drag-and-drop reordering */}
                        {room.images.length > 0 && (
                          <DraggableRoomImages
                            images={room.images}
                            onReorder={(newOrder) => handleReorderImages(room.id, newOrder)}
                            onRemove={(index) => removeImage(room.id, index)}
                          />
                        )}

                        {/* Video */}
                        {room.video_url && (
                          <div className="relative inline-block">
                            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                              <Play className="w-4 h-4" />
                              <span className="text-sm">Video uploaded</span>
                              <button
                                onClick={() => removeVideo(room.id)}
                                className="w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center ml-2"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Upload buttons */}
                        <div className="flex gap-2">
                          <label className="flex-1">
                            <Input
                              type="file"
                              accept={IMAGE_ACCEPT}
                              multiple
                              onChange={(e) => handleSingleRoomImageUpload(room.id, e)}
                              disabled={roomIsUploading}
                              className="hidden"
                              ref={(el) => { imageInputRefs.current[room.id] = el; }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full rounded-lg gap-2"
                              disabled={roomIsUploading}
                              asChild
                            >
                              <span>
                                {roomIsUploading && uploads.some(u => u.type === 'image' && u.status === 'uploading') ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <ImagePlus className="w-4 h-4" />
                                )}
                                Add Images
                              </span>
                            </Button>
                          </label>

                          {!room.video_url && (
                            <label className="flex-1">
                              <Input
                                type="file"
                                accept={VIDEO_ACCEPT}
                                onChange={(e) => handleSingleRoomVideoUpload(room.id, e)}
                                disabled={roomIsUploading}
                                className="hidden"
                                ref={(el) => { videoInputRefs.current[room.id] = el; }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full rounded-lg gap-2"
                                disabled={roomIsUploading}
                                asChild
                              >
                                <span>
                                  {roomIsUploading && uploads.some(u => u.type === 'video' && u.status === 'uploading') ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Video className="w-4 h-4" />
                                  )}
                                  Add Video
                                </span>
                              </Button>
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </MediaDropZone>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Room Preview Modal */}
      {previewRoom && (
        <WizardRoomPreviewModal
          isOpen={!!previewRoom}
          onClose={() => setPreviewRoom(null)}
          room={previewRoom}
        />
      )}

      {/* Image Editor Modal */}
      {editingFile && (
        <ImageEditorModal
          isOpen={editorOpen}
          onClose={handleEditorSkip}
          imageFile={editingFile}
          onSave={handleEditorSave}
        />
      )}
      
      {/* Video Trimmer Modal */}
      {trimmingVideoFile && (
        <VideoTrimmerModal
          isOpen={videoTrimmerOpen}
          onClose={() => {
            setVideoTrimmerOpen(false);
            setTrimmingVideoFile(null);
            setPendingVideoUpload(null);
          }}
          videoFile={trimmingVideoFile}
          onSave={handleVideoTrimSave}
          onSkip={handleVideoTrimSkip}
        />
      )}
    </div>
  );
}
