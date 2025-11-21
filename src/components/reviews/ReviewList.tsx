import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReviewCard } from './ReviewCard';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReviewListProps {
  dormId: string;
  roomId?: string;
}

export function ReviewList({ dormId, roomId }: ReviewListProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    loadReviews();
  }, [dormId, roomId, filter, sortBy]);

  const loadReviews = async () => {
    setLoading(true);
    
    let query = supabase
      .from('reviews')
      .select('*, students(full_name), review_responses(*)')
      .eq('dorm_id', dormId)
      .eq('status', 'approved');

    if (roomId) {
      query = query.eq('room_id', roomId);
    }

    // Apply filter
    if (filter !== 'all') {
      query = query.eq('rating', parseInt(filter));
    }

    // Apply sorting
    if (sortBy === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'highest') {
      query = query.order('rating', { ascending: false });
    } else if (sortBy === 'helpful') {
      query = query.order('helpful_count', { ascending: false });
    }

    const { data, error } = await query;

    if (!error && data) {
      setReviews(data);
      calculateStats(data);
    }

    setLoading(false);
  };

  const calculateStats = (reviewData: any[]) => {
    if (reviewData.length === 0) {
      setAverageRating(0);
      setRatingCounts({});
      return;
    }

    const avg = reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length;
    setAverageRating(Math.round(avg * 10) / 10);

    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviewData.forEach(r => {
      counts[r.rating] = (counts[r.rating] || 0) + 1;
    });
    setRatingCounts(counts);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= Math.round(rating) ? 'fill-primary text-primary' : 'text-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {reviews.length > 0 && (
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="text-center">
            <div className="text-5xl font-bold gradient-text mb-2">{averageRating}</div>
            {renderStars(averageRating)}
            <p className="text-sm text-foreground/60 mt-2">{reviews.length} reviews</p>
          </div>

          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-sm w-12">{star} star</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${reviews.length > 0 ? (ratingCounts[star] / reviews.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-foreground/60 w-8">{ratingCounts[star] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            <SelectItem value="5">5 stars</SelectItem>
            <SelectItem value="4">4 stars</SelectItem>
            <SelectItem value="3">3 stars</SelectItem>
            <SelectItem value="2">2 stars</SelectItem>
            <SelectItem value="1">1 star</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="highest">Highest rated</SelectItem>
            <SelectItem value="helpful">Most helpful</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-center text-foreground/60 py-8">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} onHelpful={loadReviews} />
          ))
        )}
      </div>
    </div>
  );
}
