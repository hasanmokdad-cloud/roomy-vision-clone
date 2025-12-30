import { useState, useEffect } from 'react';
import { Check, BarChart3, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface PollOption {
  id: string;
  text: string;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allow_multiple_answers: boolean;
  anonymous_votes: boolean;
  is_closed: boolean;
  creator_id: string;
}

interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  option_id: string;
}

interface PollMessageProps {
  messageId: string;
  userId: string;
  onViewResults?: () => void;
}

export function PollMessage({
  messageId,
  userId,
  onViewResults,
}: PollMessageProps) {
  const { toast } = useToast();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    loadPoll();
  }, [messageId]);

  const loadPoll = async () => {
    try {
      // Get poll by message_id
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('message_id', messageId)
        .single();

      if (pollError || !pollData) {
        setLoading(false);
        return;
      }

      setPoll({
        ...pollData,
        options: (pollData.options as unknown as PollOption[]) || [],
      });

      // Get votes
      const { data: votesData } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', pollData.id);

      if (votesData) {
        setVotes(votesData);
        setUserVotes(votesData.filter(v => v.user_id === userId).map(v => v.option_id));
      }

      // Subscribe to vote changes
      const channel = supabase
        .channel(`poll-votes-${pollData.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'poll_votes',
            filter: `poll_id=eq.${pollData.id}`,
          },
          () => {
            loadVotes(pollData.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error loading poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVotes = async (pollId: string) => {
    const { data: votesData } = await supabase
      .from('poll_votes')
      .select('*')
      .eq('poll_id', pollId);

    if (votesData) {
      setVotes(votesData);
      setUserVotes(votesData.filter(v => v.user_id === userId).map(v => v.option_id));
    }
  };

  const handleVote = async (optionId: string) => {
    if (!poll || poll.is_closed) return;

    setVoting(optionId);
    try {
      const hasVoted = userVotes.includes(optionId);

      if (hasVoted) {
        // Remove vote
        await supabase
          .from('poll_votes')
          .delete()
          .eq('poll_id', poll.id)
          .eq('user_id', userId)
          .eq('option_id', optionId);

        setUserVotes(prev => prev.filter(id => id !== optionId));
        setVotes(prev => prev.filter(v => !(v.user_id === userId && v.option_id === optionId)));
      } else {
        // Add vote (or replace if not multiple)
        if (!poll.allow_multiple_answers && userVotes.length > 0) {
          // Remove existing vote first
          await supabase
            .from('poll_votes')
            .delete()
            .eq('poll_id', poll.id)
            .eq('user_id', userId);

          setVotes(prev => prev.filter(v => v.user_id !== userId));
        }

        const { data: newVote } = await supabase
          .from('poll_votes')
          .insert({
            poll_id: poll.id,
            user_id: userId,
            option_id: optionId,
          })
          .select()
          .single();

        if (newVote) {
          if (!poll.allow_multiple_answers) {
            setUserVotes([optionId]);
          } else {
            setUserVotes(prev => [...prev, optionId]);
          }
          setVotes(prev => [...prev.filter(v => poll.allow_multiple_answers || v.user_id !== userId), newVote]);
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Failed to vote',
        variant: 'destructive',
      });
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-card/50 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-3" />
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const totalVotes = votes.length;
  const uniqueVoters = new Set(votes.map(v => v.user_id)).size;

  return (
    <div className="bg-card/50 dark:bg-[#1f2c33] rounded-lg p-4 max-w-xs">
      <div className="flex items-start gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <h4 className="font-medium text-sm leading-snug">{poll.question}</h4>
      </div>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const optionVotes = votes.filter(v => v.option_id === option.id).length;
          const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
          const hasVoted = userVotes.includes(option.id);
          const isVoting = voting === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={poll.is_closed || isVoting}
              className={`w-full relative rounded-lg overflow-hidden transition-all ${
                poll.is_closed 
                  ? 'cursor-default' 
                  : 'hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {/* Background bar */}
              <motion.div
                className={`absolute inset-0 ${
                  hasVoted 
                    ? 'bg-primary/30 dark:bg-primary/20' 
                    : 'bg-muted/50'
                }`}
                initial={{ width: '0%' }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.3 }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between px-3 py-2 min-h-[40px]">
                <div className="flex items-center gap-2 min-w-0">
                  {hasVoted && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                  <span className={`text-sm truncate ${hasVoted ? 'font-medium' : ''}`}>
                    {option.text}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{uniqueVoters} vote{uniqueVoters !== 1 ? 's' : ''}</span>
        </div>
        {!poll.anonymous_votes && uniqueVoters > 0 && (
          <button
            onClick={onViewResults}
            className="text-primary hover:underline"
          >
            View votes
          </button>
        )}
      </div>

      {poll.is_closed && (
        <div className="mt-2 text-xs text-center text-muted-foreground bg-muted/50 py-1 rounded">
          Poll closed
        </div>
      )}
    </div>
  );
}
