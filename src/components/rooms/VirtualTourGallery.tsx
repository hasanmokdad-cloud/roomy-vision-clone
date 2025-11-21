import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Upload, X, Image as ImageIcon } from "lucide-react";
import PanoramaViewer from "@/components/shared/PanoramaViewer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/utils/imageCompression";

interface VirtualTourGalleryProps {
  roomId?: string;
  dormId?: string;
  panoramaUrls?: string[];
  editable?: boolean;
  onUpdate?: (urls: string[]) => void;
}

export function VirtualTourGallery({
  roomId,
  dormId,
  panoramaUrls = [],
  editable = false,
  onUpdate,
}: VirtualTourGalleryProps) {
  const { toast } = useToast();
  const [selectedPanorama, setSelectedPanorama] = useState<string | null>(null);
  const [panoramas, setPanoramas] = useState<string[]>(panoramaUrls);
  const [uploading, setUploading] = useState(false);

  const handlePanoramaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImage(file); // Compress panorama image
        const fileName = `${Date.now()}-${i}-${file.name}`;
        const filePath = `panoramas/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("dorm-uploads")
          .upload(filePath, compressed);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("dorm-uploads").getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      const updatedUrls = [...panoramas, ...newUrls];
      setPanoramas(updatedUrls);

      if (onUpdate) {
        onUpdate(updatedUrls);
      }

      // Update database if roomId provided
      if (roomId) {
        await supabase
          .from("rooms")
          .update({ panorama_urls: updatedUrls })
          .eq("id", roomId);
      }

      toast({
        title: "Success",
        description: `${newUrls.length} panoramic image(s) uploaded`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removePanorama = async (url: string) => {
    const updatedUrls = panoramas.filter((u) => u !== url);
    setPanoramas(updatedUrls);

    if (onUpdate) {
      onUpdate(updatedUrls);
    }

    if (roomId) {
      await supabase
        .from("rooms")
        .update({ panorama_urls: updatedUrls })
        .eq("id", roomId);
    }

    toast({
      title: "Success",
      description: "Panoramic image removed",
    });
  };

  return (
    <>
      <Card className="glass-hover">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Virtual 360° Tour
              {panoramas.length > 0 && (
                <Badge variant="secondary">{panoramas.length} panoramas</Badge>
              )}
            </div>
            {editable && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePanoramaUpload}
                  className="hidden"
                  id="panorama-upload"
                  disabled={uploading}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => document.getElementById("panorama-upload")?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload Panorama"}
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {panoramas.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-foreground/30" />
              <p className="text-foreground/60 mb-4">
                No panoramic images yet
              </p>
              {editable && (
                <Button
                  variant="outline"
                  onClick={() =>
                    document.getElementById("panorama-upload")?.click()
                  }
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload First Panorama
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {panoramas.map((url, index) => (
                <div key={index} className="relative group">
                  <div
                    className="aspect-video rounded-lg overflow-hidden cursor-pointer border-2 border-border hover:border-primary transition-colors"
                    onClick={() => setSelectedPanorama(url)}
                  >
                    <img
                      src={url}
                      alt={`Panorama ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-center">
                        <Eye className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">View 360°</p>
                      </div>
                    </div>
                  </div>
                  {editable && (
                    <button
                      onClick={() => removePanorama(url)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <p className="text-xs text-center mt-2 text-foreground/60">
                    Panorama {index + 1}
                  </p>
                </div>
              ))}
            </div>
          )}

          {panoramas.length > 0 && !editable && (
            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-sm text-foreground/70">
                ✨ Click any image to explore in 360°. Drag to look around!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPanorama && (
        <PanoramaViewer
          imageUrl={selectedPanorama}
          onClose={() => setSelectedPanorama(null)}
          title="360° Virtual Tour"
        />
      )}
    </>
  );
}
