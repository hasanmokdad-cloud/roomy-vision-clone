import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Scissors, Loader2, SkipForward } from 'lucide-react';
import { 
  getVideoMetadata, 
  trimVideo, 
  formatTime,
  TrimRange,
  VideoMetadata 
} from '@/utils/videoTrimmer';

interface VideoTrimmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoFile: File;
  onSave: (trimmedFile: File) => void;
  onSkip: () => void;
}

export function VideoTrimmerModal({ 
  isOpen, 
  onClose, 
  videoFile, 
  onSave,
  onSkip 
}: VideoTrimmerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  // Load video metadata
  useEffect(() => {
    if (isOpen && videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      
      getVideoMetadata(videoFile).then(meta => {
        setMetadata(meta);
        setTrimRange({ start: 0, end: meta.duration });
      });
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [isOpen, videoFile]);

  // Update current time display
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Stop at end of trim range in preview mode
      if (previewMode && video.currentTime >= trimRange.end) {
        video.pause();
        video.currentTime = trimRange.start;
        setIsPlaying(false);
        setPreviewMode(false);
      }
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [trimRange, previewMode]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video || !metadata) return;
    
    const time = (value[0] / 100) * metadata.duration;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleTrimStartChange = (value: number[]) => {
    if (!metadata) return;
    const start = (value[0] / 100) * metadata.duration;
    setTrimRange(prev => ({ ...prev, start: Math.min(start, prev.end - 1) }));
  };

  const handleTrimEndChange = (value: number[]) => {
    if (!metadata) return;
    const end = (value[0] / 100) * metadata.duration;
    setTrimRange(prev => ({ ...prev, end: Math.max(end, prev.start + 1) }));
  };

  const handlePreviewTrim = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = trimRange.start;
    video.play();
    setIsPlaying(true);
    setPreviewMode(true);
  };

  const handleTrimAndSave = async () => {
    if (!metadata) return;
    
    // If no trimming needed, just pass the original file
    if (trimRange.start === 0 && trimRange.end === metadata.duration) {
      onSave(videoFile);
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      const trimmedFile = await trimVideo(videoFile, trimRange, (progress) => {
        setProcessingProgress(progress);
      });
      
      onSave(trimmedFile);
    } catch (error) {
      console.error('Error trimming video:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const outputDuration = trimRange.end - trimRange.start;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Trim Video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
              />
            )}
            
            {/* Play/Pause Overlay */}
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-12 h-12 text-white drop-shadow-lg" />
              ) : (
                <Play className="w-12 h-12 text-white drop-shadow-lg" />
              )}
            </button>
            
            {/* Current Time Display */}
            <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm px-2 py-1 rounded">
              {formatTime(currentTime)} / {metadata ? formatTime(metadata.duration) : '0:00'}
            </div>
          </div>

          {/* Playback Scrubber */}
          {metadata && (
            <div className="space-y-2">
              <Slider
                value={[(currentTime / metadata.duration) * 100]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full"
              />
            </div>
          )}

          {/* Trim Controls */}
          {metadata && (
            <div className="space-y-4 bg-muted/50 rounded-lg p-4">
              <div className="text-sm font-medium">Select trim range:</div>
              
              {/* Visual Timeline */}
              <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                {/* Full duration background */}
                <div className="absolute inset-0 bg-muted" />
                
                {/* Selected range highlight */}
                <div
                  className="absolute top-0 bottom-0 bg-primary/30"
                  style={{
                    left: `${(trimRange.start / metadata.duration) * 100}%`,
                    width: `${((trimRange.end - trimRange.start) / metadata.duration) * 100}%`,
                  }}
                />
                
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary"
                  style={{ left: `${(currentTime / metadata.duration) * 100}%` }}
                />
              </div>

              {/* Start/End Sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Start: {formatTime(trimRange.start)}
                  </label>
                  <Slider
                    value={[(trimRange.start / metadata.duration) * 100]}
                    onValueChange={handleTrimStartChange}
                    max={100}
                    step={0.1}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    End: {formatTime(trimRange.end)}
                  </label>
                  <Slider
                    value={[(trimRange.end / metadata.duration) * 100]}
                    onValueChange={handleTrimEndChange}
                    max={100}
                    step={0.1}
                  />
                </div>
              </div>

              {/* Output Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Output duration: <strong>{formatTime(outputDuration)}</strong>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewTrim}
                  disabled={isProcessing}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Preview Trim
                </Button>
              </div>
            </div>
          )}

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing video... {Math.round(processingProgress)}%
              </div>
              <Progress value={processingProgress} className="h-2" />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onSkip} disabled={isProcessing}>
              <SkipForward className="w-4 h-4 mr-2" />
              Skip Trimming
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleTrimAndSave} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4 mr-2" />
                    {trimRange.start === 0 && metadata && trimRange.end === metadata.duration
                      ? 'Continue Without Trimming'
                      : 'Trim & Continue'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
