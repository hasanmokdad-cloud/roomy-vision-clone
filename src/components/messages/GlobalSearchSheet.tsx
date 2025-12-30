import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, MessageSquare, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  body: string;
  created_at: string;
  conversation_id: string;
  conversation_name: string;
  conversation_photo?: string | null;
  is_group?: boolean;
}

interface GlobalSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onSelectResult: (conversationId: string, messageId: string) => void;
}

export function GlobalSearchSheet({ 
  open, 
  onOpenChange, 
  userId, 
  onSelectResult 
}: GlobalSearchSheetProps) {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationMap, setConversationMap] = useState<Map<string, { name: string; photo?: string | null; is_group?: boolean }>>(new Map());

  // Load conversation metadata
  useEffect(() => {
    if (!open || !userId) return;

    const loadConversations = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('id, group_name, group_photo_url, is_group, user_a_id, user_b_id')
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

      if (data) {
        const map = new Map<string, { name: string; photo?: string | null; is_group?: boolean }>();
        
        for (const conv of data) {
          if (conv.is_group) {
            map.set(conv.id, {
              name: conv.group_name || 'Group',
              photo: conv.group_photo_url,
              is_group: true
            });
          } else {
            // Get other user info
            const otherUserId = conv.user_a_id === userId ? conv.user_b_id : conv.user_a_id;
            if (otherUserId) {
              const { data: student } = await supabase
                .from('students')
                .select('full_name, profile_photo_url')
                .eq('user_id', otherUserId)
                .single();
              
              if (student) {
                map.set(conv.id, {
                  name: student.full_name,
                  photo: student.profile_photo_url,
                  is_group: false
                });
              } else {
                const { data: owner } = await supabase
                  .from('owners')
                  .select('full_name, profile_photo_url')
                  .eq('user_id', otherUserId)
                  .single();
                
                if (owner) {
                  map.set(conv.id, {
                    name: owner.full_name,
                    photo: owner.profile_photo_url,
                    is_group: false
                  });
                }
              }
            }
          }
        }
        
        setConversationMap(map);
      }
    };

    loadConversations();
  }, [open, userId]);

  // Search messages
  const searchMessages = useCallback(async (query: string) => {
    if (!query.trim() || !userId) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, body, created_at, conversation_id')
        .ilike('body', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        // Filter to only conversations the user is part of
        const filteredResults = data
          .filter(msg => conversationMap.has(msg.conversation_id))
          .map(msg => {
            const convInfo = conversationMap.get(msg.conversation_id);
            return {
              id: msg.id,
              body: msg.body || '',
              created_at: msg.created_at,
              conversation_id: msg.conversation_id,
              conversation_name: convInfo?.name || 'Unknown',
              conversation_photo: convInfo?.photo,
              is_group: convInfo?.is_group
            };
          });

        setResults(filteredResults);
      }
    } catch (error) {
      console.error('Search error:', error);
    }

    setLoading(false);
  }, [userId, conversationMap]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchMessages(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchMessages]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setResults([]);
    }
  }, [open]);

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark>
        : part
    );
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search all messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Searching...
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No messages found' : 'Search across all conversations'}
          </div>
        ) : (
          <div className="divide-y">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => {
                  onSelectResult(result.conversation_id, result.id);
                  onOpenChange(false);
                }}
                className="w-full flex items-start gap-3 p-4 hover:bg-accent text-left transition-colors"
              >
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={result.conversation_photo || undefined} />
                  <AvatarFallback className="bg-primary/20">
                    {result.is_group ? (
                      <Users className="w-5 h-5 text-primary" />
                    ) : (
                      result.conversation_name.charAt(0)
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{result.conversation_name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(result.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {highlightMatch(result.body, searchQuery)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>Search Messages</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[500px] p-0 flex flex-col">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
