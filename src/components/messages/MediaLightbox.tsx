import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { createPortal } from "react-dom";
import { 
  X, 
  Download, 
  Share2, 
  Forward, 
  Star, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { haptics } from "@/utils/haptics";

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  timestamp?: string;
  senderName?: string;
}

interface MediaLightboxProps {
  open: boolean;
  onClose: () => void;
  media: MediaItem[];
  initialIndex?: number;
  onForward?: (mediaId: string) => void;
  onStar?: (mediaId: string) => void;
  onDelete?: (mediaId: string) => void;
}

export function MediaLightbox({
  open,
  onClose,
  media,
  initialIndex = 0,
  onForward,
  onStar,
  onDelete,
}: MediaLightboxProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const initialDistanceRef = useRef<number>(0);
  const initialScaleRef = useRef<number>(1);

  const currentMedia = media[currentIndex];

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [open, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          navigatePrev();
          break;
        case 'ArrowRight':
          navigateNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, media.length]);

  const navigateNext = useCallback(() => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      haptics.light();
    }
  }, [currentIndex, media.length]);

  const navigatePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      haptics.light();
    }
  }, [currentIndex]);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      if (scale === 1) {
        setScale(2);
        haptics.medium();
      } else {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        haptics.light();
      }
    }
    lastTapRef.current = now;
  };

  const handlePinchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialDistanceRef.current = distance;
      initialScaleRef.current = scale;
    }
  };

  const handlePinchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleDelta = distance / initialDistanceRef.current;
      const newScale = Math.min(5, Math.max(1, initialScaleRef.current * scaleDelta));
      setScale(newScale);
    }
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    // If zoomed, update position
    if (scale > 1) {
      return;
    }

    // Swipe to navigate
    const threshold = 100;
    if (info.offset.x > threshold && currentIndex > 0) {
      navigatePrev();
    } else if (info.offset.x < -threshold && currentIndex < media.length - 1) {
      navigateNext();
    }

    // Swipe down to close
    if (info.offset.y > threshold) {
      onClose();
    }
  };

  const handleDownload = async () => {
    if (!currentMedia) return;
    
    try {
      haptics.medium();
      const response = await fetch(currentMedia.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `media-${currentMedia.id}.${currentMedia.type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Download started" });
    } catch (error) {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (!currentMedia) return;
    
    haptics.light();
    if (navigator.share) {
      try {
        await navigator.share({
          url: currentMedia.url
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(currentMedia.url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  if (!open || !currentMedia) return null;

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
          className="fixed inset-0 z-[200] bg-black flex flex-col"
          onClick={(e) => e.target === e.currentTarget && scale === 1 && onClose()}
        >
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10"
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
              {currentMedia.senderName && (
                <div>
                  <p className="text-white font-medium">{currentMedia.senderName}</p>
                  {currentMedia.timestamp && (
                    <p className="text-white/70 text-xs">{currentMedia.timestamp}</p>
                  )}
                </div>
              )}
            </div>

            {/* Zoom controls - desktop only */}
            {!isMobile && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setScale(Math.max(1, scale - 0.5))}
                  disabled={scale <= 1}
                  className="text-white hover:bg-white/20"
                >
                  <ZoomOut className="w-5 h-5" />
                </Button>
                <span className="text-white text-sm min-w-[3rem] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setScale(Math.min(5, scale + 0.5))}
                  disabled={scale >= 5}
                  className="text-white hover:bg-white/20"
                >
                  <ZoomIn className="w-5 h-5" />
                </Button>
              </div>
            )}
          </motion.header>

          {/* Media container */}
          <div 
            className="flex-1 flex items-center justify-center overflow-hidden"
            onTouchStart={handlePinchStart}
            onTouchMove={handlePinchMove}
          >
            <motion.div
              drag={scale > 1 || isMobile}
              dragConstraints={scale > 1 ? undefined : { left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              onClick={handleDoubleTap}
              animate={{
                scale,
                x: position.x,
                y: position.y,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
            >
              {currentMedia.type === 'image' ? (
                <img
                  src={currentMedia.url}
                  alt=""
                  className="max-w-full max-h-full object-contain select-none"
                  draggable={false}
                />
              ) : (
                <video
                  src={currentMedia.url}
                  controls
                  className="max-w-full max-h-full"
                  autoPlay
                />
              )}
            </motion.div>
          </div>

          {/* Navigation arrows - desktop only */}
          {!isMobile && media.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={navigatePrev}
                disabled={currentIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={navigateNext}
                disabled={currentIndex === media.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          {/* Bottom toolbar */}
          <motion.footer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="px-4 py-3 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0"
          >
            {/* Thumbnail strip */}
            {media.length > 1 && (
              <div className="flex items-center justify-center gap-2 mb-3 overflow-x-auto py-2">
                {media.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      setScale(1);
                      setPosition({ x: 0, y: 0 });
                    }}
                    className={`w-12 h-12 rounded-md overflow-hidden flex-shrink-0 transition-all ${
                      index === currentIndex 
                        ? 'ring-2 ring-white scale-110' 
                        : 'opacity-50 hover:opacity-75'
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img 
                        src={item.url} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                        <span className="text-white text-xs">▶</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="text-white hover:bg-white/20"
              >
                <Share2 className="w-6 h-6" />
              </Button>
              {onForward && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onForward(currentMedia.id)}
                  className="text-white hover:bg-white/20"
                >
                  <Forward className="w-6 h-6" />
                </Button>
              )}
              {onStar && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onStar(currentMedia.id)}
                  className="text-white hover:bg-white/20"
                >
                  <Star className="w-6 h-6" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
              >
                <Download className="w-6 h-6" />
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(currentMedia.id)}
                  className="text-white hover:bg-white/20"
                >
                  <Trash2 className="w-6 h-6" />
                </Button>
              )}
            </div>

            {/* Counter */}
            {media.length > 1 && (
              <p className="text-center text-white/70 text-sm mt-2">
                {currentIndex + 1} of {media.length}
              </p>
            )}
          </motion.footer>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
