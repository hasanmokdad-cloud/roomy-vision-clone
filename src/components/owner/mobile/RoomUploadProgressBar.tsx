import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, XCircle, ImageIcon, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface RoomUploadProgress {
  roomId: string;
  fileName: string;
  progress: number;
  type: 'image' | 'video';
  status: 'uploading' | 'complete' | 'error';
}

interface RoomUploadProgressBarProps {
  uploads: RoomUploadProgress[];
  onCancel?: (fileName: string) => void;
}

export function RoomUploadProgressBar({ uploads, onCancel }: RoomUploadProgressBarProps) {
  if (uploads.length === 0) return null;

  const activeUploads = uploads.filter(u => u.status === 'uploading');
  const completedCount = uploads.filter(u => u.status === 'complete').length;
  const errorCount = uploads.filter(u => u.status === 'error').length;
  const totalProgress = uploads.length > 0 
    ? Math.round(uploads.reduce((sum, u) => sum + (u.progress || 0), 0) / uploads.length)
    : 0;
  const isComplete = activeUploads.length === 0;

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium flex items-center gap-1">
          {!isComplete && <Loader2 className="w-3 h-3 animate-spin" />}
          {isComplete && completedCount > 0 && <CheckCircle className="w-3 h-3 text-green-600" />}
          {isComplete ? 'Complete' : 'Uploading...'}
        </span>
        <span className="text-muted-foreground">
          {completedCount}/{uploads.length}
        </span>
      </div>
      
      <Progress value={totalProgress} className="h-2 transition-all duration-300" />
      
      {activeUploads.length > 0 && (
        <div className="space-y-1">
          {activeUploads.slice(0, 3).map((upload, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
              {upload.type === 'image' ? (
                <ImageIcon className="w-3 h-3 flex-shrink-0" />
              ) : (
                <Video className="w-3 h-3 flex-shrink-0" />
              )}
              <span className="truncate flex-1">{upload.fileName}</span>
              <span className="flex-shrink-0">{upload.progress || 0}%</span>
              {onCancel && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 flex-shrink-0 hover:bg-destructive/10"
                  onClick={() => onCancel(upload.fileName)}
                >
                  <X className="w-3 h-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          {activeUploads.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{activeUploads.length - 3} more
            </span>
          )}
        </div>
      )}

      {errorCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <XCircle className="w-3 h-3" />
          {errorCount} failed
        </div>
      )}
    </div>
  );
}
