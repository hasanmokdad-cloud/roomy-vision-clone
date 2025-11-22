import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Crop, Sliders, Sparkles, RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';
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
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && imageFile) {
      loadImageToCanvas(imageFile).then(canvas => {
        setOriginalCanvas(canvas);
        setPreviewUrl(URL.createObjectURL(imageFile));
      });
    }
    
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [isOpen, imageFile]);

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
  };

  const handleSave = async () => {
    if (!originalCanvas) return;

    try {
      const finalCanvas = applyAdjustmentsToCanvas(
        originalCanvas,
        adjustments,
        completedCrop
      );
      
      const editedFile = await canvasToFile(
        finalCanvas,
        imageFile.name.replace(/\.[^/.]+$/, '-edited.jpg')
      );
      
      onSave(editedFile);
      onClose();
    } catch (error) {
      console.error('Error saving edited image:', error);
    }
  };

  const updateAdjustment = (key: keyof ImageAdjustments, value: any) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>

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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="crop">
                <Crop className="w-4 h-4 mr-2" />
                Crop
              </TabsTrigger>
              <TabsTrigger value="adjust">
                <Sliders className="w-4 h-4 mr-2" />
                Adjust
              </TabsTrigger>
              <TabsTrigger value="filters">
                <Sparkles className="w-4 h-4 mr-2" />
                Filters
              </TabsTrigger>
              <TabsTrigger value="transform">
                <RotateCw className="w-4 h-4 mr-2" />
                Transform
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
          </Tabs>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Reset All
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
