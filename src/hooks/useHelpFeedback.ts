import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useHelpFeedback(articleId: string) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitFeedback = async (isHelpful: boolean, feedbackText?: string) => {
    if (submitted || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate session ID for anonymous users
      const sessionId = !user ? 
        sessionStorage.getItem('help_session_id') || 
        (() => {
          const id = crypto.randomUUID();
          sessionStorage.setItem('help_session_id', id);
          return id;
        })() : null;

      const { error } = await supabase
        .from('help_article_feedback')
        .insert({
          article_id: articleId,
          user_id: user?.id || null,
          is_helpful: isHelpful,
          feedback_text: feedbackText || null,
          session_id: sessionId
        });

      if (error) {
        console.error('Failed to submit feedback:', error);
        toast({
          title: 'Error',
          description: 'Failed to submit feedback. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      setSubmitted(true);
      toast({
        title: 'Thank you!',
        description: 'Your feedback helps us improve our help articles.'
      });
    } catch (err) {
      console.error('Feedback submission error:', err);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitFeedback,
    submitted,
    isSubmitting
  };
}
