import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star, Send, ThumbsUp } from "lucide-react";

interface FeedbackCardProps {
  matchId: string;
  matchType: 'dorm' | 'roommate';
  onSubmit?: () => void;
}

export function FeedbackCard({ matchId, matchType, onSubmit }: FeedbackCardProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "Rate this match from 1 to 5 stars",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to submit feedback",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from('ai_feedback').insert({
        user_id: user.id,
        ai_action: matchType === 'dorm' ? 'match_dorm' : 'match_roommate',
        target_id: matchId,
        helpful_score: rating,
        feedback_text: comment || null,
        context: {
          match_type: matchType,
          timestamp: new Date().toISOString(),
        }
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating helps improve our AI matching",
      });

      if (onSubmit) onSubmit();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Failed to submit feedback",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center p-6 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl"
      >
        <div className="text-center">
          <ThumbsUp className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
          <p className="text-lg font-semibold text-foreground">Feedback Submitted!</p>
          <p className="text-sm text-muted-foreground">Thank you for helping us improve</p>
        </div>
      </motion.div>
    );
  }

  return (
    <Card className="shadow-md border border-muted/40 bg-card/80 backdrop-blur-md">
      <CardContent className="pt-6 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            How helpful was this match?
          </h3>
          <p className="text-sm text-muted-foreground">
            Your feedback helps our AI learn and improve
          </p>
        </div>

        {/* Star Rating */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 transition-all ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-500 text-yellow-500'
                    : 'text-muted-foreground/30'
                }`}
              />
            </motion.button>
          ))}
        </div>

        {/* Optional Comment */}
        <AnimatePresence>
          {rating > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-foreground">
                Additional comments (optional)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us more about your experience..."
                className="resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {comment.length}/500
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold"
        >
          {isSubmitting ? (
            "Submitting..."
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Feedback
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
