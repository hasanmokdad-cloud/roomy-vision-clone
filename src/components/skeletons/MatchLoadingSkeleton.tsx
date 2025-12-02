import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const MatchLoadingSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* AI Thinking Animation */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-4">
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity }
              }}
              className="relative"
            >
              <Sparkles className="w-8 h-8 text-primary" />
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Roomy AI is analyzing...</h3>
              <p className="text-sm text-muted-foreground">Finding your perfect matches</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-6 space-y-4">
                {/* Header with avatar/image */}
                <div className="flex items-start gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-full" />
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Tags */}
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-18" />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
