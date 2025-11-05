import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function MatchCardSkeleton() {
  return (
    <Card className="overflow-hidden glass-hover">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar skeleton */}
          <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
          
          <div className="flex-1 space-y-3">
            {/* Name */}
            <Skeleton className="h-6 w-48" />
            
            {/* Location */}
            <Skeleton className="h-4 w-32" />
            
            {/* Match percentage */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 flex-1 max-w-xs" />
              <Skeleton className="h-4 w-12" />
            </div>
            
            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-18" />
            </div>
            
            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
