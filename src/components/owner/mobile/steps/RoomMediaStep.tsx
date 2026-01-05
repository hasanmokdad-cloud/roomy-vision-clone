import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ImagePlus, Video, X, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { WizardRoomData } from './RoomNamesStep';

interface RoomMediaStepProps {
  rooms: WizardRoomData[];
  selectedIds: string[];
  onChange: (rooms: WizardRoomData[]) => void;
}

export function RoomMediaStep({ rooms, selectedIds, onChange }: RoomMediaStepProps) {
  const [uploading, setUploading] = useState(false);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      // Apply to all selected rooms
      const updated = rooms.map(room =>
        selectedIds.includes(room.id)
          ? { ...room, images: [...room.images, ...uploadedUrls] }
          : room
      );
      onChange(updated);
      
      toast({
        title: 'Images uploaded',
        description: `${uploadedUrls.length} images added to ${selectedIds.length} room(s)`,
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
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

  const selectedCount = selectedIds.length;
  const roomsWithImages = rooms.filter(r => r.images.length > 0).length;

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
          Upload images to help students see your rooms
        </p>
      </motion.div>

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
            <Badge variant="secondary">{selectedCount} rooms selected</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Upload images that will be added to all selected rooms
          </p>
          <label className="block">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleBulkImageUpload}
              disabled={uploading || selectedCount === 0}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl gap-2"
              disabled={uploading || selectedCount === 0}
              asChild
            >
              <span>
                <ImagePlus className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Choose Images'}
              </span>
            </Button>
          </label>
        </div>
      </motion.div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Individual Rooms</span>
        <Badge variant="outline">{roomsWithImages} with images</Badge>
      </div>

      <ScrollArea className="h-[calc(100vh-480px)]">
        <div className="space-y-3 pr-4">
          {rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    {room.images.length > 0 ? (
                      <img
                        src={room.images[0]}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <ImagePlus className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-foreground block">
                      {room.name || `Room ${index + 1}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {room.images.length} image{room.images.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {expandedRoom === room.id ? 'Collapse' : 'Expand'}
                </Badge>
              </button>

              {expandedRoom === room.id && (
                <div className="px-4 pb-4 space-y-3">
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
                  <label className="block">
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
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
