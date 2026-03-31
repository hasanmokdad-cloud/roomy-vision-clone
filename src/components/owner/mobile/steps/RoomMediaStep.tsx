import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ImagePlus, X, Upload, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { WizardRoomData } from './RoomNamesStep';
import { ImageEditorModal } from '@/components/owner/ImageEditorModal';
import { uploadFileWithProgress, generateFilePath, UploadHandle } from '@/utils/uploadWithProgress';

interface RoomMediaStepProps {
  rooms: WizardRoomData[];
  selectedIds: string[];
  onChange: (rooms: WizardRoomData[]) => void;
  propertyType?: string;
  blockSettings?: Record<string, { kitchenette_type: string; balcony_type: string; furnished_type: string }>;
  currentBlockNumber?: number;
}

interface SpaceConfig {
  key: string;
  label: string;
  emoji: string;
}

function getSpacesForRoom(room: WizardRoomData, balconyType: string): SpaceConfig[] {
  const spaces: SpaceConfig[] = [];
  const isSuite = room.capacityType === 'suite';
  const isStudio = room.baseType === 'studio';
  const hasBalcony = balconyType === 'all' || room.has_balcony;

  if (isSuite) {
    const bedrooms = room.suite_bedrooms || [];
    bedrooms.forEach((_, i) => {
      spaces.push({ key: `bedroom_${i + 1}`, label: `Bedroom ${i + 1}`, emoji: '🛏' });
    });
    if (bedrooms.length === 0) {
      spaces.push({ key: 'bedroom_1', label: 'Bedroom 1', emoji: '🛏' });
    }
    spaces.push({ key: 'living_room', label: 'Living room', emoji: '🛋' });
    if (room.suite_has_kitchenette) {
      spaces.push({ key: 'kitchenette', label: 'Kitchenette', emoji: '🍳' });
    }
    const bathroomCount = room.suite_bathroom_count || 1;
    for (let i = 0; i < bathroomCount; i++) {
      spaces.push({ key: bathroomCount > 1 ? `bathroom_${i + 1}` : 'bathroom', label: bathroomCount > 1 ? `Full bathroom ${i + 1}` : 'Full bathroom', emoji: '🚿' });
    }
  } else {
    spaces.push({ key: 'bedroom', label: 'Bedroom', emoji: '🛏' });
    if (isStudio) {
      spaces.push({ key: 'kitchenette', label: 'Kitchenette', emoji: '🍳' });
    }
    spaces.push({ key: 'bathroom', label: 'Full bathroom', emoji: '🚿' });
  }

  spaces.push({ key: 'workspace', label: 'Workspace / Study desk', emoji: '🖥' });
  if (hasBalcony) {
    spaces.push({ key: 'balcony', label: 'Balcony', emoji: '🌿' });
  }

  return spaces;
}

const IMAGE_ACCEPT = "image/*,.heic,.heif,.avif,.bmp,.tiff,.tif,.svg,.ico,.jfif";

export function RoomMediaStep({ rooms, selectedIds, onChange, propertyType = 'dorm', blockSettings = {}, currentBlockNumber = 1 }: RoomMediaStepProps) {
  const bs = blockSettings[String(currentBlockNumber)] || { kitchenette_type: 'room', balcony_type: 'none', furnished_type: 'furnished' };
  const balconyType = bs.balcony_type;

  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [bulkApplied, setBulkApplied] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [pendingUpload, setPendingUpload] = useState<{ targetKey: string; spaceKey: string; files: File[]; index: number } | null>(null);

  const effectiveSelectedIds = selectedIds.length > 0 ? selectedIds : rooms.map(r => r.id);
  const selectedRooms = rooms.filter(r => effectiveSelectedIds.includes(r.id));

  // Get canonical label for the first selected room to determine spaces for bulk
  const representativeRoom = selectedRooms[0];
  const bulkSpaces = representativeRoom ? getSpacesForRoom(representativeRoom, balconyType) : [];
  const canonicalLabel = representativeRoom?.type || 'units';

  // Bulk images state (temporary, before applying)
  const [bulkImages, setBulkImages] = useState<Record<string, string[]>>({});

  const uploadFile = async (file: File): Promise<string> => {
    const filePath = generateFilePath('wizard-rooms', file.name, false);
    const handleRef: { current: UploadHandle | null } = { current: null };
    return uploadFileWithProgress(file, 'room-images', filePath, () => {}, handleRef);
  };

  const handleUploadToSpace = async (targetKey: string, spaceKey: string, files: File[]) => {
    setUploading(prev => ({ ...prev, [`${targetKey}-${spaceKey}`]: true }));
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadFile(file);
        urls.push(url);
      }

      if (targetKey === 'bulk') {
        setBulkImages(prev => ({
          ...prev,
          [spaceKey]: [...(prev[spaceKey] || []), ...urls].slice(0, 5)
        }));
      } else {
        // Individual room
        const updated = rooms.map(r => {
          if (r.id !== targetKey) return r;
          const spaceImgs = { ...(r.space_images || {}) };
          spaceImgs[spaceKey] = [...(spaceImgs[spaceKey] || []), ...urls].slice(0, 5);
          return { ...r, space_images: spaceImgs };
        });
        onChange(updated);
      }
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(prev => ({ ...prev, [`${targetKey}-${spaceKey}`]: false }));
    }
  };

  const handleFileInput = (targetKey: string, spaceKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleUploadToSpace(targetKey, spaceKey, files);
    e.target.value = '';
  };

  const removeImage = (targetKey: string, spaceKey: string, url: string) => {
    if (targetKey === 'bulk') {
      setBulkImages(prev => ({
        ...prev,
        [spaceKey]: (prev[spaceKey] || []).filter(u => u !== url)
      }));
    } else {
      const updated = rooms.map(r => {
        if (r.id !== targetKey) return r;
        const spaceImgs = { ...(r.space_images || {}) };
        spaceImgs[spaceKey] = (spaceImgs[spaceKey] || []).filter(u => u !== url);
        return { ...r, space_images: spaceImgs };
      });
      onChange(updated);
    }
  };

  const applyBulkToAll = () => {
    const updated = rooms.map(r => {
      if (!effectiveSelectedIds.includes(r.id)) return r;
      const spaceImgs = { ...(r.space_images || {}) };
      Object.entries(bulkImages).forEach(([key, urls]) => {
        if (urls.length > 0) {
          spaceImgs[key] = [...urls]; // Independent copy
        }
      });
      return { ...r, space_images: spaceImgs };
    });
    onChange(updated);
    setBulkApplied(true);
    setTimeout(() => setBulkApplied(false), 2000);
    toast({ title: 'Applied', description: `Photos applied to ${effectiveSelectedIds.length} units` });
  };

  const getPhotoCount = (room: WizardRoomData): number => {
    return Object.values(room.space_images || {}).reduce((sum, urls) => sum + urls.length, 0);
  };

  const getSpaceCount = (room: WizardRoomData): number => {
    return Object.values(room.space_images || {}).filter(urls => urls.length > 0).length;
  };

  function SpaceUploadGrid({ spaces, targetKey, images }: { spaces: SpaceConfig[]; targetKey: string; images: Record<string, string[]> }) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {spaces.map(space => {
          const spaceImages = images[space.key] || [];
          const isUploading = uploading[`${targetKey}-${space.key}`];
          return (
            <div key={space.key} className="border border-border rounded-lg p-3">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-sm">{space.emoji}</span>
                <span className="text-xs font-medium text-foreground truncate">{space.label}</span>
              </div>

              {/* Thumbnails */}
              {spaceImages.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {spaceImages.map((url, i) => (
                    <div key={i} className="relative w-12 h-12 rounded overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(targetKey, space.key, url)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {spaceImages.length < 5 && (
                <label className="flex items-center gap-1 cursor-pointer text-primary hover:text-primary/80 transition-colors">
                  {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
                  <span className="text-[10px]">{isUploading ? 'Uploading...' : 'Add photos'}</span>
                  <input type="file" accept={IMAGE_ACCEPT} multiple className="hidden"
                    onChange={(e) => handleFileInput(targetKey, space.key, e)} disabled={isUploading} />
                </label>
              )}
              <p className="text-[9px] text-muted-foreground mt-1">{spaceImages.length}/5</p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">Showcase your rental units</h1>
          <p className="text-muted-foreground text-sm">Upload photos for your selected units — apply to all at once, then adjust individually if needed</p>
        </motion.div>

        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-4 pr-4">
            {/* Bulk apply section */}
            {bulkSpaces.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Upload photos for all {canonicalLabel} units</h3>
                  <p className="text-[10px] text-muted-foreground">These photos will be applied to all {selectedRooms.length} selected units</p>
                </div>

                <SpaceUploadGrid spaces={bulkSpaces} targetKey="bulk" images={bulkImages} />

                <Button onClick={applyBulkToAll} className="w-full rounded-xl gap-2"
                  disabled={Object.values(bulkImages).every(v => v.length === 0)}>
                  {bulkApplied ? <><Check className="w-4 h-4" /> Applied</> : 'Apply to all units'}
                </Button>
              </motion.div>
            )}

            {/* Individual room cards */}
            {selectedRooms.map((room, index) => {
              const expanded = expandedRoom === room.id;
              const photoCount = getPhotoCount(room);
              const spaceCount = getSpaceCount(room);
              const roomSpaces = getSpacesForRoom(room, balconyType);

              return (
                <motion.div key={room.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.15 + index * 0.02, 0.5) }}
                  className="bg-card border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setExpandedRoom(expanded ? null : room.id)}
                    className="w-full p-4 flex items-center justify-between text-left">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-sm text-foreground truncate block">{room.name}</span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{room.type || 'Untyped'}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {photoCount > 0 ? `${photoCount} photos · ${spaceCount} spaces` : 'No photos'}
                        </span>
                      </div>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      <SpaceUploadGrid spaces={roomSpaces} targetKey={room.id} images={room.space_images || {}} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
