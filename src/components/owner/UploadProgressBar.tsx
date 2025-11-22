import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';

interface UploadProgressBarProps {
  total: number;
  completed: number;
  failed: number;
}

export function UploadProgressBar({ total, completed, failed }: UploadProgressBarProps) {
  const progress = (completed / total) * 100;
  const isComplete = completed + failed === total;

  if (total === 0) return null;

  return (
    <Card className="p-4 mb-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {isComplete ? 'Upload Complete' : 'Uploading...'}
          </span>
          <span className="text-muted-foreground">
            {completed + failed} / {total}
          </span>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {!isComplete && (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Uploading
              </span>
            )}
            {isComplete && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3 h-3" />
                {completed} succeeded
              </span>
            )}
            {failed > 0 && (
              <span className="text-destructive">{failed} failed</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
