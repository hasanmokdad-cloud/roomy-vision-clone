import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ArrowLeft } from 'lucide-react';
import { OwnerCardListSkeleton } from '@/components/skeletons/OwnerSkeletons';
import { useToast } from '@/hooks/use-toast';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { OwnerBreadcrumb } from '@/components/owner/OwnerBreadcrumb';
import { motion } from 'framer-motion';

export default function ReviewManagement() {
  const navigate = useNavigate();
  const { loading, userId } = useRoleGuard('owner');
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadOwnerData();
    }
  }, [userId]);

  // Real-time subscription for reviews
  useEffect(() => {
    if (!ownerId) return;

    const channel = supabase
      .channel('reviews-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews'
        },
        () => {
          loadReviews(ownerId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'review_responses'
        },
        () => {
          loadReviews(ownerId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownerId]);

  const loadOwnerData = async () => {
    const { data: owner } = await supabase
      .from('owners')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (owner) {
      setOwnerId(owner.id);
      loadReviews(owner.id);
    }
    setDataLoading(false);
  };

  const loadReviews = async (ownerId: string) => {
    const { data: dorms } = await supabase
      .from('dorms')
      .select('id')
      .eq('owner_id', ownerId);

    if (!dorms || dorms.length === 0) {
      setReviews([]);
      return;
    }

    const dormIds = dorms.map(d => d.id);

    const { data } = await supabase
      .from('reviews')
      .select(`
        *,
        students(full_name),
        dorms(dorm_name, name),
        review_responses(*)
      `)
      .in('dorm_id', dormIds)
      .order('created_at', { ascending: false });

    setReviews(data || []);
  };

  const handleRespond = async (reviewId: string) => {
    if (!responseTexts[reviewId]?.trim() || !ownerId) return;

    try {
      const { error } = await supabase.from('review_responses').insert({
        review_id: reviewId,
        owner_id: ownerId,
        response_text: responseTexts[reviewId].trim(),
      });

      if (error) throw error;

      toast({
        title: 'Response posted',
        description: 'Your response has been added to the review',
      });

      setResponseTexts({ ...responseTexts, [reviewId]: '' });
      if (ownerId) loadReviews(ownerId);
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
            className={`w-4 h-4 ${star <= rating ? 'fill-primary text-primary' : 'text-muted'}`}
          />
        ))}
      </div>
    );
  };

  const filterReviews = (status: string) => {
    if (status === 'all') return reviews;
    return reviews.filter(r => r.status === status);
  };

  if (loading || dataLoading) {
    return (
      <OwnerLayout>
        <OwnerCardListSkeleton />
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <OwnerBreadcrumb items={[{ label: 'Reviews' }]} />
          
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" onClick={() => navigate('/owner')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-semibold text-foreground">Review Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Respond to reviews from your guests</p>
          </motion.div>

          {reviews.length === 0 ? (
            <Card className="p-8 text-center rounded-2xl">
              <p className="text-muted-foreground">No reviews yet. Reviews will appear here when students leave feedback.</p>
            </Card>
          ) : (
            <Tabs defaultValue="approved" className="w-full">
              <TabsList>
                <TabsTrigger value="approved">Approved ({filterReviews('approved').length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({filterReviews('pending').length})</TabsTrigger>
                <TabsTrigger value="all">All ({reviews.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="approved" className="space-y-4 mt-6">
                {filterReviews('approved').length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No approved reviews yet.</p>
                ) : (
                  filterReviews('approved').map((review, index) => (
                    <ReviewManagementCard
                      key={review.id}
                      review={review}
                      responseText={responseTexts[review.id] || ''}
                      onResponseChange={(text) => setResponseTexts({ ...responseTexts, [review.id]: text })}
                      onSubmitResponse={() => handleRespond(review.id)}
                      renderStars={renderStars}
                      index={index}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4 mt-6">
                {filterReviews('pending').length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No pending reviews.</p>
                ) : (
                  filterReviews('pending').map((review, index) => (
                    <ReviewManagementCard
                      key={review.id}
                      review={review}
                      responseText={responseTexts[review.id] || ''}
                      onResponseChange={(text) => setResponseTexts({ ...responseTexts, [review.id]: text })}
                      onSubmitResponse={() => handleRespond(review.id)}
                      renderStars={renderStars}
                      index={index}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-4 mt-6">
                {reviews.map((review, index) => (
                  <ReviewManagementCard
                    key={review.id}
                    review={review}
                    responseText={responseTexts[review.id] || ''}
                    onResponseChange={(text) => setResponseTexts({ ...responseTexts, [review.id]: text })}
                    onSubmitResponse={() => handleRespond(review.id)}
                    renderStars={renderStars}
                    index={index}
                  />
                ))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}

function ReviewManagementCard({ review, responseText, onResponseChange, onSubmitResponse, renderStars, index }: any) {
  const hasResponse = review.review_responses && review.review_responses.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-6 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">{review.students?.full_name || 'Anonymous'}</h3>
                <Badge variant={review.status === 'approved' ? 'default' : 'secondary'}>
                  {review.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{review.dorms?.dorm_name || review.dorms?.name}</p>
              <div className="flex items-center gap-2 mt-2">
                {renderStars(review.rating)}
                <span className="text-sm text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-1">{review.title}</h4>
            {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
          </div>

          {hasResponse ? (
            <div className="bg-muted/30 p-4 rounded-xl">
              <p className="text-sm font-medium text-foreground mb-1">Your Response</p>
              <p className="text-sm text-muted-foreground">{review.review_responses[0].response_text}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="Write your response..."
                value={responseText}
                onChange={(e) => onResponseChange(e.target.value)}
                rows={3}
                className="rounded-xl"
              />
              <Button 
                onClick={onSubmitResponse} 
                disabled={!responseText.trim()}
                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl"
              >
                Post Response
              </Button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
