import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

interface AIInsightsCardProps {
  insights: string;
  isLoading?: boolean;
}

// Filter out placeholder text that shouldn't be displayed
const isPlaceholderText = (text: string): boolean => {
  if (!text) return true;
  const lower = text.toLowerCase();
  return (
    lower.includes('looking for options') ||
    lower.includes('searching for') ||
    lower.includes('no data') ||
    lower.includes('no matches found') ||
    lower.includes('ai insights are currently unavailable')
  );
};

export const AIInsightsCard = ({ insights, isLoading }: AIInsightsCardProps) => {
  // Show loading skeleton
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="flex-shrink-0 w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't render if no insights or if it's placeholder text
  if (!insights || isPlaceholderText(insights)) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-bold text-lg flex items-center gap-2">
              Roomy AI Insights
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-normal">
                Powered by Gemini
              </span>
            </h3>
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {insights}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
