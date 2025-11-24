import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { MatchCardSkeleton } from "@/components/skeletons/MatchCardSkeleton";

export const LoadingState = () => {
  return (
    <div className="space-y-8">
      {/* AI Thinking Animation */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Roomy AI is analyzing your preferences...</h3>
              <p className="text-sm text-muted-foreground">Finding your perfect matches</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MatchCardSkeleton />
        <MatchCardSkeleton />
        <MatchCardSkeleton />
      </div>
    </div>
  );
};
