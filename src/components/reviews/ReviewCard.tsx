import { useState } from 'react';
import { Star, ThumbsUp, Flag, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewCardProps {
  review: any;
  onHelpful?: () => void;
}

export function ReviewCard({ review, onHelpful }: ReviewCardProps) {
  const { toast } = useToast();
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
  const [hasVoted, setHasVoted] = useState(false);

  const handleHelpful = async () => {
    if (hasVoted) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to mark reviews as helpful',
        });
        return;
      }

      const { error } = await supabase.from('review_helpful_votes').insert({
        review_id: review.id,
        user_id: user.id,
      });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: 'Already voted',
            description: 'You have already marked this review as helpful',
          });
        } else {
          throw error;
        }
        return;
      }

      setHelpfulCount(prev => prev + 1);
      setHasVoted(true);
      onHelpful?.();

      toast({
        title: 'Thank you!',
        description: 'Your feedback has been recorded',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-primary text-primary' : 'text-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-primary/20 text-primary">
            {review.students?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{review.students?.full_name || 'Anonymous'}</h4>
                {review.verified_stay && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified Stay
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {renderStars(review.rating)}
                <span className="text-sm text-foreground/60">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <h5 className="font-medium mb-2">{review.title}</h5>
          
          {review.comment && (
            <p className="text-sm text-foreground/80 mb-3">{review.comment}</p>
          )}

          {/* Category Ratings */}
          {(review.cleanliness_rating || review.location_rating || review.value_rating || review.amenities_rating) && (
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              {review.cleanliness_rating && (
                <div className="flex items-center justify-between">
                  <span className="text-foreground/60">Cleanliness:</span>
                  {renderStars(review.cleanliness_rating)}
                </div>
              )}
              {review.location_rating && (
                <div className="flex items-center justify-between">
                  <span className="text-foreground/60">Location:</span>
                  {renderStars(review.location_rating)}
                </div>
              )}
              {review.value_rating && (
                <div className="flex items-center justify-between">
                  <span className="text-foreground/60">Value:</span>
                  {renderStars(review.value_rating)}
                </div>
              )}
              {review.amenities_rating && (
                <div className="flex items-center justify-between">
                  <span className="text-foreground/60">Amenities:</span>
                  {renderStars(review.amenities_rating)}
                </div>
              )}
            </div>
          )}

          {/* Owner Response */}
          {review.review_responses && review.review_responses.length > 0 && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg border-l-2 border-primary">
              <p className="text-sm font-medium mb-1">Owner Response</p>
              <p className="text-sm text-foreground/80">
                {review.review_responses[0].response_text}
              </p>
              <p className="text-xs text-foreground/60 mt-2">
                {new Date(review.review_responses[0].created_at).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHelpful}
              disabled={hasVoted}
              className="text-foreground/60"
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Helpful ({helpfulCount})
            </Button>
            <Button variant="ghost" size="sm" className="text-foreground/60">
              <Flag className="w-4 h-4 mr-1" />
              Report
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
