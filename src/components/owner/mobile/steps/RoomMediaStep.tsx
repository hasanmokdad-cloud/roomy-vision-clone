import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePlus, Video, X, Upload, Eye, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { WizardRoomData } from './RoomNamesStep';
import { WizardRoomPreviewModal } from '../WizardRoomPreviewModal';

interface RoomMediaStepProps {
  rooms: WizardRoomData[];
  selectedIds: string[];
  onChange: (rooms: WizardRoomData[]) => void;
}

export function RoomMediaStep({ rooms, selectedIds, onChange }: RoomMediaStepProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [typeFilteredIds, setTypeFilteredIds] = useState<string[]>([]);
  const [previewRoom, setPreviewRoom] = useState<WizardRoomData | null>(null);

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

  const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (effectiveSelectedIds.length === 0) {
      toast({
        title: 'No rooms selected',
        description: 'Please select rooms using the type filter first',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `wizard-rooms/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('room-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('room-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      // Apply to all selected rooms
      const updated = rooms.map(room =>
        effectiveSelectedIds.includes(room.id)
          ? { ...room, images: [...room.images, ...uploadedUrls] }
          : room
      );
      onChange(updated);
      
      toast({
        title: 'Images uploaded',
        description: `${uploadedUrls.length} images added to ${effectiveSelectedIds.length} room(s)`,
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleBulkVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (effectiveSelectedIds.length === 0) {
      toast({
        title: 'No rooms selected',
        description: 'Please select rooms using the type filter first',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Video must be under 50MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingVideo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `wizard-rooms/videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('room-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('room-images')
        .getPublicUrl(filePath);

      // Apply video to all selected rooms
      const updated = rooms.map(room =>
        effectiveSelectedIds.includes(room.id)
          ? { ...room, video_url: urlData.publicUrl }
          : room
      );
      onChange(updated);
      
      toast({
        title: 'Video uploaded',
        description: `Video added to ${effectiveSelectedIds.length} room(s)`,
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleSingleRoomImageUpload = async (roomId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `wizard-rooms/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('room-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('room-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      const updated = rooms.map(room =>
        room.id === roomId
          ? { ...room, images: [...room.images, ...uploadedUrls] }
          : room
      );
      onChange(updated);
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSingleRoomVideoUpload = async (roomId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Video must be under 50MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingVideo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `wizard-rooms/videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('room-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('room-images')
        .getPublicUrl(filePath);

      const updated = rooms.map(room =>
        room.id === roomId
          ? { ...room, video_url: urlData.publicUrl }
          : room
      );
      onChange(updated);
      
      toast({
        title: 'Video uploaded',
        description: 'Video added to room',
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
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
            Upload media that will be added to all selected rooms
          </p>

          <div className="flex gap-3">
            {/* Bulk Image Upload */}
            <label className="flex-1">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleBulkImageUpload}
                disabled={uploading || effectiveSelectedIds.length === 0}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl gap-2"
                disabled={uploading || effectiveSelectedIds.length === 0}
                asChild
              >
                <span>
                  <ImagePlus className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Images'}
                </span>
              </Button>
            </label>

            {/* Bulk Video Upload */}
            <label className="flex-1">
              <Input
                type="file"
                accept="video/*"
                onChange={handleBulkVideoUpload}
                disabled={uploadingVideo || effectiveSelectedIds.length === 0}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl gap-2"
                disabled={uploadingVideo || effectiveSelectedIds.length === 0}
                asChild
              >
                <span>
                  <Video className="w-4 h-4" />
                  {uploadingVideo ? 'Uploading...' : 'Video'}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Individual Rooms</span>
        <Badge variant="outline">{roomsWithMedia} with media</Badge>
      </div>

      <ScrollArea className="h-[calc(100vh-560px)]">
        <div className="space-y-3 pr-4">
          {rooms.map((room, index) => {
            const hasMedia = room.images.length > 0 || room.video_url;
            
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
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
                    {/* Images */}
                    {room.images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {room.images.map((img, imgIndex) => (
                          <div key={imgIndex} className="relative">
                            <img
                              src={img}
                              alt=""
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <button
                              onClick={() => removeImage(room.id, imgIndex)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
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
                          accept="image/*"
                          multiple
                          onChange={(e) => handleSingleRoomImageUpload(room.id, e)}
                          disabled={uploading}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full rounded-lg gap-2"
                          disabled={uploading}
                          asChild
                        >
                          <span>
                            <ImagePlus className="w-4 h-4" />
                            Add Images
                          </span>
                        </Button>
                      </label>

                      {!room.video_url && (
                        <label className="flex-1">
                          <Input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleSingleRoomVideoUpload(room.id, e)}
                            disabled={uploadingVideo}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg gap-2"
                            disabled={uploadingVideo}
                            asChild
                          >
                            <span>
                              <Video className="w-4 h-4" />
                              Add Video
                            </span>
                          </Button>
                        </label>
                      )}
                    </div>
                  </div>
                )}
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
    </div>
  );
}
