import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Check } from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
}

interface VoteWithUser {
  id: string;
  option_id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
}

interface PollResultsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollId: string;
  options: PollOption[];
  question: string;
}

export function PollResultsSheet({
  open,
  onOpenChange,
  pollId,
  options,
  question,
}: PollResultsSheetProps) {
  const [votes, setVotes] = useState<VoteWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string>('all');

  useEffect(() => {
    if (open) {
      loadVotes();
    }
  }, [open, pollId]);

  const loadVotes = async () => {
    setLoading(true);
    try {
      const { data: votesData } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', pollId);

      if (votesData) {
        // Get user info for each vote
        const userIds = [...new Set(votesData.map(v => v.user_id))];
        const votesWithUsers: VoteWithUser[] = [];

        for (const vote of votesData) {
          // Try to get user info from students table
          const { data: student } = await supabase
            .from('students')
            .select('full_name, profile_photo_url')
            .eq('user_id', vote.user_id)
            .single();

          votesWithUsers.push({
            ...vote,
            user_name: student?.full_name || 'User',
            user_avatar: student?.profile_photo_url || undefined,
          });
        }

        setVotes(votesWithUsers);
      }
    } catch (error) {
      console.error('Error loading votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVotes = selectedOption === 'all'
    ? votes
    : votes.filter(v => v.option_id === selectedOption);

  const getVoteCount = (optionId: string) => 
    votes.filter(v => v.option_id === optionId).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">{question}</SheetTitle>
        </SheetHeader>

        <Tabs value={selectedOption} onValueChange={setSelectedOption}>
          <TabsList className="w-full h-auto flex-wrap gap-1 bg-transparent p-0 mb-4">
            <TabsTrigger
              value="all"
              className="flex-shrink-0 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All ({votes.length})
            </TabsTrigger>
            {options.map(option => (
              <TabsTrigger
                key={option.id}
                value={option.id}
                className="flex-shrink-0 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {option.text} ({getVoteCount(option.id)})
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="h-[calc(70vh-180px)]">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No votes yet
              </div>
            ) : (
              <div className="space-y-2">
                {filteredVotes.map(vote => {
                  const option = options.find(o => o.id === vote.option_id);
                  return (
                    <div
                      key={vote.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={vote.user_avatar} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {vote.user_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{vote.user_name}</p>
                        {selectedOption === 'all' && option && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {option.text}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
