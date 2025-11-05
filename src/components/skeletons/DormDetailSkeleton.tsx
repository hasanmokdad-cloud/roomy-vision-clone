import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function DormDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      <Skeleton className="h-10 w-32 mb-6" />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Skeleton className="h-12 w-3/4 mb-2" />
              <Skeleton className="h-5 w-1/2" />
            </div>
            <div className="text-right">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-4 w-20 mt-1" />
            </div>
          </div>
        </div>

        {/* Image carousel */}
        <Skeleton className="w-full h-[400px] md:h-[500px] rounded-lg mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-hover">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-hover">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="glass-hover">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>

            <Card className="glass-hover">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-7 w-40" />
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
