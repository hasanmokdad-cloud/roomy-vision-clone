import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface AIInsightsCardProps {
  insights: string;
}

export const AIInsightsCard = ({ insights }: AIInsightsCardProps) => {
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
