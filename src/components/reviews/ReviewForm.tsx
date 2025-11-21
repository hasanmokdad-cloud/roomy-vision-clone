import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReviewFormProps {
  dormId: string;
  roomId?: string;
  bookingId?: string;
  onClose: () => void;
  onSubmit: () => void;
}

export function ReviewForm({ dormId, roomId, bookingId, onClose, onSubmit }: ReviewFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [ratings, setRatings] = useState({
    cleanliness: 0,
    location: 0,
    value: 0,
    amenities: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please provide an overall rating',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Get student ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) throw new Error('Student profile not found');

      const { error } = await supabase.from('reviews').insert({
        dorm_id: dormId,
        room_id: roomId || null,
        booking_id: bookingId || null,
        student_id: student.id,
        rating,
        title,
        comment,
        cleanliness_rating: ratings.cleanliness || null,
        location_rating: ratings.location || null,
        value_rating: ratings.value || null,
        amenities_rating: ratings.amenities || null,
        verified_stay: !!bookingId,
      });

      if (error) throw error;

      toast({
        title: 'Review submitted',
        description: 'Your review is pending approval',
      });

      onSubmit();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (value: number, onChange: (val: number) => void, hover: number = 0) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => onChange === setRating && setHoverRating(star)}
            onMouseLeave={() => onChange === setRating && setHoverRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                star <= (hover || value) ? 'fill-primary text-primary' : 'text-muted'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Overall Rating *</Label>
        <div className="mt-2">
          {renderStars(rating, setRating, hoverRating)}
        </div>
      </div>

      <div>
        <Label htmlFor="title">Review Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          required
          maxLength={100}
        />
      </div>

      <div>
        <Label htmlFor="comment">Your Review</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about your stay..."
          rows={4}
          maxLength={500}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Cleanliness</Label>
          {renderStars(ratings.cleanliness, (val) => setRatings({ ...ratings, cleanliness: val }))}
        </div>
        <div>
          <Label className="text-sm">Location</Label>
          {renderStars(ratings.location, (val) => setRatings({ ...ratings, location: val }))}
        </div>
        <div>
          <Label className="text-sm">Value</Label>
          {renderStars(ratings.value, (val) => setRatings({ ...ratings, value: val }))}
        </div>
        <div>
          <Label className="text-sm">Amenities</Label>
          {renderStars(ratings.amenities, (val) => setRatings({ ...ratings, amenities: val }))}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
}
