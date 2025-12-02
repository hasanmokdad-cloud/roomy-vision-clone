import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorRetryBubbleProps {
  errorMessage?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ErrorRetryBubble({ 
  errorMessage = "Something went wrong while generating that answer.",
  onRetry,
  isRetrying = false,
}: ErrorRetryBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2.5 justify-start"
    >
      {/* AI Avatar with error state */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-destructive/80 to-destructive flex items-center justify-center ring-2 ring-destructive/20">
          <Sparkles className="w-4 h-4 text-destructive-foreground" />
        </div>
      </div>

      {/* Error Bubble */}
      <div className="max-w-[85%] sm:max-w-[75%] bg-destructive/10 border border-destructive/30 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-foreground">{errorMessage}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try again, or ask a simpler question like "Show me dorms near LAU Byblos under $300"
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="border-destructive/30 hover:bg-destructive/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Retrying..." : "Retry"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
