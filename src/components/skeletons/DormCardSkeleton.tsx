import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function DormCardSkeleton() {
  return (
    <Card className="overflow-hidden h-[400px] glass-hover">
      <CardContent className="p-0 h-full flex flex-col">
        {/* Image skeleton */}
        <Skeleton className="w-full h-48" />
        
        {/* Content skeleton */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Title */}
            <Skeleton className="h-6 w-3/4" />
            
            {/* Location */}
            <Skeleton className="h-4 w-1/2" />
            
            {/* Price */}
            <Skeleton className="h-8 w-24" />
            
            {/* Badges */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          
          {/* Button */}
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      </CardContent>
    </Card>
  );
}
