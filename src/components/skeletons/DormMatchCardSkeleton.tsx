import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const DormMatchCardSkeleton = () => {
  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-0">
        {/* Image */}
        <Skeleton className="w-full h-48" />
        
        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title and location */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          
          {/* Price */}
          <Skeleton className="h-8 w-32" />
          
          {/* Badges */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>

          {/* Explanation section */}
          <Skeleton className="h-20 w-full" />
          
          {/* Button */}
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
};
