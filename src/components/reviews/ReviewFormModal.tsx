import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dormId: string;
  dormName: string;
  roomId?: string;
  bookingId?: string;
  onSubmitSuccess?: () => void;
}

export function ReviewFormModal({ 
  open, 
  onOpenChange, 
  dormId, 
  dormName,
  roomId,
  bookingId,
  onSubmitSuccess 
}: ReviewFormModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Rating states
  const [overallRating, setOverallRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [locationRating, setLocationRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [amenitiesRating, setAmenitiesRating] = useState(0);
  
  // Review content
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const renderStars = (rating: number, setRating: (rating: number) => void, label: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= rating 
                  ? 'fill-primary text-primary' 
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (overallRating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please provide an overall rating',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ 
          title: 'Sign in required', 
          description: 'Please sign in to submit a review',
          variant: 'destructive' 
        });
        navigate('/auth');
        return;
      }

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!student) {
        toast({ 
          title: 'Profile error', 
          description: 'Please complete your student profile',
          variant: 'destructive' 
        });
        return;
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          dorm_id: dormId,
          room_id: roomId || null,
          student_id: student.id,
          booking_id: bookingId || null,
          rating: overallRating,
          cleanliness_rating: cleanlinessRating || null,
          location_rating: locationRating || null,
          value_rating: valueRating || null,
          amenities_rating: amenitiesRating || null,
          title: title.trim(),
          comment: comment.trim() || null,
          status: 'pending',
          verified_stay: !!bookingId
        });

      if (error) throw error;

      toast({
        title: 'Review Submitted!',
        description: 'Your review is pending admin approval and will appear soon.'
      });
      
      onOpenChange(false);
      onSubmitSuccess?.();
      
      // Reset form
      setOverallRating(0);
      setCleanlinessRating(0);
      setLocationRating(0);
      setValueRating(0);
      setAmenitiesRating(0);
      setTitle('');
      setComment('');
    } catch (error: any) {
      console.error('Review submission error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate & Review {dormName}</DialogTitle>
          <DialogDescription>
            Share your experience to help other students make informed decisions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          {renderStars(overallRating, setOverallRating, 'Overall Rating *')}

          {/* Category Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderStars(cleanlinessRating, setCleanlinessRating, 'Cleanliness')}
            {renderStars(locationRating, setLocationRating, 'Location')}
            {renderStars(valueRating, setValueRating, 'Value for Money')}
            {renderStars(amenitiesRating, setAmenitiesRating, 'Amenities')}
          </div>

          {/* Review Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Review Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum up your experience in one line"
              required
              maxLength={100}
            />
          </div>

          {/* Review Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Review</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about your experience, what you liked or didn't like..."
              rows={5}
              maxLength={1000}
            />
            <p className="text-xs text-foreground/60">
              {comment.length}/1000 characters
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
