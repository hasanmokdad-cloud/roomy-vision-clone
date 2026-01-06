import { useState, useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Crop, Sliders, Sparkles, RotateCw, FlipHorizontal, FlipVertical, FileDown } from 'lucide-react';
import ReactCrop, { Crop as CropType, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  ImageAdjustments,
  defaultAdjustments,
  FILTER_PRESETS,
  applyAdjustmentsToCanvas,
  canvasToFile,
  loadImageToCanvas,
} from '@/utils/imageEditor';
import { compressImage } from '@/utils/imageCompression';

interface CompressionSettings {
  quality: number;
  maxDimension: number; // 0 = original
}

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File;
  onSave: (editedFile: File) => void;
}

export function ImageEditorModal({ isOpen, onClose, imageFile, onSave }: ImageEditorModalProps) {
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(defaultAdjustments);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [originalCanvas, setOriginalCanvas] = useState<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [compression, setCompression] = useState<CompressionSettings>({ quality: 80, maxDimension: 1920 });
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [estimatedSize, setEstimatedSize] = useState<number>(0);
  const [showStickyBar, setShowStickyBar] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastContentLineRef = useRef<HTMLDivElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);

  // Track if any changes have been made
  const hasChanges = useMemo(() => {
    const hasAdjustmentChanges = 
      adjustments.brightness !== 100 ||
      adjustments.contrast !== 100 ||
      adjustments.saturation !== 100 ||
      adjustments.rotation !== 0 ||
      adjustments.flipHorizontal ||
      adjustments.flipVertical ||
      adjustments.filter !== 'none';
    
    const hasCropChanges = completedCrop !== undefined;
    
    const hasCompressionChanges = 
      compression.quality !== 80 || 
      compression.maxDimension !== 1920;
    
    return hasAdjustmentChanges || hasCropChanges || hasCompressionChanges;
  }, [adjustments, completedCrop, compression]);

  useEffect(() => {
    if (isOpen && imageFile) {
      setOriginalSize(imageFile.size);
      loadImageToCanvas(imageFile).then(canvas => {
        setOriginalCanvas(canvas);
        setPreviewUrl(URL.createObjectURL(imageFile));
      });
    }
    
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [isOpen, imageFile]);

  // Scroll handler for sticky bar (like StudentProfileEditPage)
  useEffect(() => {
    const scrollContainer = dialogContentRef.current;
    if (!scrollContainer || !isOpen) return;
    
    const handleScroll = () => {
      if (!lastContentLineRef.current) return;
      
      const containerRect = scrollContainer.getBoundingClientRect();
      const lastLineRect = lastContentLineRef.current.getBoundingClientRect();
      const bottomBarHeight = 72;
      
      // When the last content line is above where bottom bar would be, hide the sticky bar
      if (lastLineRect.bottom <= containerRect.bottom - bottomBarHeight) {
        setShowStickyBar(false);
      } else {
        setShowStickyBar(true);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  // Estimate compressed size when compression settings change
  useEffect(() => {
    if (!originalSize) return;
    
    // Rough estimation: quality affects size roughly proportionally
    // Dimension reduction has quadratic effect on file size
    let sizeFactor = compression.quality / 100;
    
    if (compression.maxDimension > 0 && originalCanvas) {
      const originalMaxDim = Math.max(originalCanvas.width, originalCanvas.height);
      if (originalMaxDim > compression.maxDimension) {
        const dimRatio = compression.maxDimension / originalMaxDim;
        sizeFactor *= dimRatio * dimRatio; // Quadratic for area
      }
    }
    
    setEstimatedSize(Math.round(originalSize * sizeFactor * 0.7)); // 0.7 for JPEG baseline
  }, [compression, originalSize, originalCanvas]);

  useEffect(() => {
    if (!originalCanvas || !previewCanvasRef.current) return;
    
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply adjustments to preview
    const adjustedCanvas = applyAdjustmentsToCanvas(
      originalCanvas,
      adjustments,
      completedCrop
    );
    
    canvas.width = adjustedCanvas.width;
    canvas.height = adjustedCanvas.height;
    ctx.drawImage(adjustedCanvas, 0, 0);
  }, [adjustments, completedCrop, originalCanvas]);

  const handleReset = () => {
    setAdjustments(defaultAdjustments);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCompression({ quality: 80, maxDimension: 1920 });
  };

  const handleSave = async () => {
    if (!originalCanvas) return;

    try {
      const finalCanvas = applyAdjustmentsToCanvas(
        originalCanvas,
        adjustments,
        completedCrop
      );
      
      let editedFile = await canvasToFile(
        finalCanvas,
        imageFile.name.replace(/\.[^/.]+$/, '-edited.jpg')
      );
      
      // Apply compression if settings are not default
      if (compression.quality < 100 || compression.maxDimension > 0) {
        editedFile = await compressImage(editedFile, {
          maxSizeMB: compression.quality < 50 ? 0.5 : compression.quality < 80 ? 1 : 2,
          maxWidthOrHeight: compression.maxDimension || undefined,
          useWebWorker: true,
        });
      }
      
      onSave(editedFile);
      onClose();
    } catch (error) {
      console.error('Error saving edited image:', error);
    }
  };

  const updateAdjustment = (key: keyof ImageAdjustments, value: any) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
  };

  const buttonText = hasChanges ? 'Apply Changes' : 'Upload';

  const ActionButtons = () => (
    <>
      <Button variant="outline" onClick={handleReset}>
        Reset All
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {buttonText}
        </Button>
      </div>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-6 pb-4 shrink-0">
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>

        {/* Scrollable content area */}
        <div ref={dialogContentRef} className="flex-1 overflow-y-auto px-6">
          <div className="space-y-4">
          {/* Preview Area */}
          <div className="relative bg-muted rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
            {previewUrl && (
              <div className="max-w-full max-h-[500px] overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  onComplete={c => setCompletedCrop(c)}
                  aspect={undefined}
                >
                  <img
                    ref={imgRef}
                    src={previewUrl}
                    alt="Edit preview"
                    style={{
                      filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) ${
                        adjustments.filter !== 'none'
                          ? FILTER_PRESETS.find(f => f.name === adjustments.filter)?.filter || ''
                          : ''
                      }`,
                      transform: `rotate(${adjustments.rotation}deg) scaleX(${adjustments.flipHorizontal ? -1 : 1}) scaleY(${adjustments.flipVertical ? -1 : 1})`,
                    }}
                  />
                </ReactCrop>
              </div>
            )}
            <canvas ref={previewCanvasRef} className="hidden" />
          </div>

          {/* Tools */}
          <Tabs defaultValue="adjust" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="crop" className="text-xs px-2">
                <Crop className="w-4 h-4 mr-1" />
                Crop
              </TabsTrigger>
              <TabsTrigger value="adjust" className="text-xs px-2">
                <Sliders className="w-4 h-4 mr-1" />
                Adjust
              </TabsTrigger>
              <TabsTrigger value="filters" className="text-xs px-2">
                <Sparkles className="w-4 h-4 mr-1" />
                Filters
              </TabsTrigger>
              <TabsTrigger value="transform" className="text-xs px-2">
                <RotateCw className="w-4 h-4 mr-1" />
                Transform
              </TabsTrigger>
              <TabsTrigger value="compress" className="text-xs px-2">
                <FileDown className="w-4 h-4 mr-1" />
                Compress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="crop" className="space-y-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Drag on the image above to select the area you want to crop.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCrop(undefined);
                    setCompletedCrop(undefined);
                  }}
                >
                  Clear Crop
                </Button>
              </Card>
            </TabsContent>

            <TabsContent value="adjust" className="space-y-4">
              <Card className="p-4 space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Brightness</label>
                    <span className="text-sm text-muted-foreground">{adjustments.brightness}%</span>
                  </div>
                  <Slider
                    value={[adjustments.brightness]}
                    onValueChange={([value]) => updateAdjustment('brightness', value)}
                    min={50}
                    max={150}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Contrast</label>
                    <span className="text-sm text-muted-foreground">{adjustments.contrast}%</span>
                  </div>
                  <Slider
                    value={[adjustments.contrast]}
                    onValueChange={([value]) => updateAdjustment('contrast', value)}
                    min={50}
                    max={150}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Saturation</label>
                    <span className="text-sm text-muted-foreground">{adjustments.saturation}%</span>
                  </div>
                  <Slider
                    value={[adjustments.saturation]}
                    onValueChange={([value]) => updateAdjustment('saturation', value)}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <Card className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {FILTER_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant={adjustments.filter === preset.name ? 'default' : 'outline'}
                      onClick={() => updateAdjustment('filter', preset.name)}
                      className="h-auto flex flex-col gap-2 py-3"
                    >
                      <span className="text-sm font-medium">{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="transform" className="space-y-4">
              <Card className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rotate</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => updateAdjustment('rotation', (adjustments.rotation + 90) % 360)}
                    >
                      <RotateCw className="w-4 h-4 mr-2" />
                      90°
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updateAdjustment('rotation', (adjustments.rotation + 180) % 360)}
                    >
                      <RotateCw className="w-4 h-4 mr-2" />
                      180°
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updateAdjustment('rotation', 0)}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Flip</label>
                  <div className="flex gap-2">
                    <Button
                      variant={adjustments.flipHorizontal ? 'default' : 'outline'}
                      onClick={() => updateAdjustment('flipHorizontal', !adjustments.flipHorizontal)}
                    >
                      <FlipHorizontal className="w-4 h-4 mr-2" />
                      Horizontal
                    </Button>
                    <Button
                      variant={adjustments.flipVertical ? 'default' : 'outline'}
                      onClick={() => updateAdjustment('flipVertical', !adjustments.flipVertical)}
                    >
                      <FlipVertical className="w-4 h-4 mr-2" />
                      Vertical
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="compress" className="space-y-4">
              <Card className="p-4 space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Quality</label>
                    <span className="text-sm text-muted-foreground">{compression.quality}%</span>
                  </div>
                  <Slider
                    value={[compression.quality]}
                    onValueChange={([value]) => setCompression(prev => ({ ...prev, quality: value }))}
                    min={10}
                    max={100}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Smaller file</span>
                    <span>Higher quality</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Max Dimension</label>
                  <RadioGroup
                    value={compression.maxDimension.toString()}
                    onValueChange={(value) => setCompression(prev => ({ ...prev, maxDimension: parseInt(value) }))}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="0" id="dim-original" />
                      <Label htmlFor="dim-original" className="text-sm">Original size</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1920" id="dim-1920" />
                      <Label htmlFor="dim-1920" className="text-sm">1920px (recommended)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1280" id="dim-1280" />
                      <Label htmlFor="dim-1280" className="text-sm">1280px</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="800" id="dim-800" />
                      <Label htmlFor="dim-800" className="text-sm">800px (thumbnail)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <FileDown className="w-4 h-4" />
                    Size Estimate
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Original:</span>
                      <span className="ml-2 font-medium">{(originalSize / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Output:</span>
                      <span className="ml-2 font-medium text-primary">
                        ~{estimatedSize > 1024 * 1024 
                          ? `${(estimatedSize / 1024 / 1024).toFixed(2)} MB`
                          : `${Math.round(estimatedSize / 1024)} KB`}
                      </span>
                    </div>
                  </div>
                  {originalSize > 0 && estimatedSize > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Reduction: ~{Math.round((1 - estimatedSize / originalSize) * 100)}%
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>

            {/* Last content line - marks end of content for dynamic bottom bar */}
            <div ref={lastContentLineRef} className="border-b border-border" />

            {/* Inline Actions - shown when sticky bar is hidden */}
            {!showStickyBar && (
              <div className="flex justify-between py-4 pb-6">
                <ActionButtons />
              </div>
            )}
          </div>
        </div>

        {/* Fixed action bar at bottom - outside scroll container */}
        {showStickyBar && (
          <div className="shrink-0 p-4 bg-background border-t flex justify-between">
            <ActionButtons />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}