import { Card, CardContent } from '@/components/ui/card';
import { ReviewList } from '@/components/reviews/ReviewList';

interface BuildingReviewsProps {
  dormId: string;
}

/**
 * BuildingReviews - Reviews & Ratings section for building pages.
 * 
 * Displays the reviews and ratings for a building.
 */
export function BuildingReviews({ dormId }: BuildingReviewsProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Reviews & Ratings</h2>
        <ReviewList dormId={dormId} />
      </CardContent>
    </Card>
  );
}

export default BuildingReviews;
