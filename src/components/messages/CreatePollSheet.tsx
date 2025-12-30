import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, X, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreatePollSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  userId: string;
  onPollCreated?: (pollId: string) => void;
}

interface PollOption {
  id: string;
  text: string;
}

export function CreatePollSheet({
  open,
  onOpenChange,
  conversationId,
  userId,
  onPollCreated,
}: CreatePollSheetProps) {
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([
    { id: crypto.randomUUID(), text: '' },
    { id: crypto.randomUUID(), text: '' },
  ]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [anonymousVotes, setAnonymousVotes] = useState(false);
  const [creating, setCreating] = useState(false);

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, { id: crypto.randomUUID(), text: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter(opt => opt.id !== id));
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, text } : opt
    ));
  };

  const isValid = question.trim() && options.filter(o => o.text.trim()).length >= 2;

  const handleCreate = async () => {
    if (!isValid) return;

    setCreating(true);
    try {
      // Create poll message first
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          body: `📊 Poll: ${question}`,
          type: 'poll',
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Create poll
      const validOptions = options
        .filter(o => o.text.trim())
        .map(o => ({ id: o.id, text: o.text.trim() }));

      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          conversation_id: conversationId,
          message_id: message.id,
          creator_id: userId,
          question: question.trim(),
          options: validOptions,
          allow_multiple_answers: allowMultiple,
          anonymous_votes: anonymousVotes,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      toast({ title: 'Poll created' });
      onPollCreated?.(poll.id);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating poll:', error);
      toast({
        title: 'Failed to create poll',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setQuestion('');
    setOptions([
      { id: crypto.randomUUID(), text: '' },
      { id: crypto.randomUUID(), text: '' },
    ]);
    setAllowMultiple(false);
    setAnonymousVotes(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Create Poll
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto pb-20">
          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    maxLength={100}
                  />
                </div>
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(option.id)}
                    className="shrink-0 h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            {options.length < 10 && (
              <Button
                variant="outline"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add option
              </Button>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="multiple" className="text-sm">
                Allow multiple answers
              </Label>
              <Switch
                id="multiple"
                checked={allowMultiple}
                onCheckedChange={setAllowMultiple}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="anonymous" className="text-sm">
                Anonymous votes
              </Label>
              <Switch
                id="anonymous"
                checked={anonymousVotes}
                onCheckedChange={setAnonymousVotes}
              />
            </div>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={!isValid || creating}
            className="w-full"
          >
            {creating ? 'Creating...' : 'Create Poll'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
