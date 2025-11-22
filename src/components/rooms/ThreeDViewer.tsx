import { useEffect, useRef } from 'react';
import '@google/model-viewer';
import { Card, CardContent } from '@/components/ui/card';
import { Box } from 'lucide-react';

interface ThreeDViewerProps {
  modelUrl: string;
  alt?: string;
  autoRotate?: boolean;
  cameraControls?: boolean;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

export function ThreeDViewer({ 
  modelUrl, 
  alt = "3D Room Model",
  autoRotate = true,
  cameraControls = true 
}: ThreeDViewerProps) {
  const viewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!customElements.get('model-viewer')) {
      import('@google/model-viewer');
    }
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
            <Box className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">3D View</span>
          </div>
          
          <model-viewer
            ref={viewerRef}
            src={modelUrl}
            alt={alt}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls={cameraControls}
            auto-rotate={autoRotate}
            shadow-intensity="1"
            style={{
              width: '100%',
              height: '500px',
              backgroundColor: 'hsl(var(--muted))'
            }}
          >
            <div slot="progress-bar" className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </model-viewer>

          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-foreground/60">
            Drag to rotate • Pinch to zoom
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
