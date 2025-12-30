import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2, Image, Video, FileText, Filter, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchFilterPanel, MediaFilterType, DateRangeFilter, SenderOption } from './search/SearchFilterPanel';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

interface SearchResult {
  messageId: string;
  conversationId: string;
  conversationName: string;
  conversationAvatar?: string;
  messageBody: string;
  timestamp: string;
  senderId: string;
  attachmentType?: string;
  isGroup?: boolean;
}

interface GlobalSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onSelectResult: (conversationId: string, messageId: string) => void;
}

export function GlobalSearchSheet({ open, onOpenChange, userId, onSelectResult }: GlobalSearchSheetProps) {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationMap, setConversationMap] = useState<Map<string, { name: string; avatar?: string; isGroup?: boolean }>>(new Map());
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<MediaFilterType>('all');
  const [dateRange, setDateRange] = useState<DateRangeFilter>({});
  const [senderFilter, setSenderFilter] = useState<string | null>(null);
  const [senderOptions, setSenderOptions] = useState<SenderOption[]>([]);

  const activeFilterCount = [
    mediaFilter !== 'all',
    dateRange.from || dateRange.to,
    senderFilter
  ].filter(Boolean).length;

  // Load conversation details and sender options
  useEffect(() => {
    if (!open || !userId) return;

    const loadConversationDetails = async () => {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, group_name, group_photo_url, is_group, user_a_id, user_b_id')
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

      if (!conversations) return;

      const otherUserIds = new Set<string>();
      conversations.forEach(conv => {
        if (conv.user_a_id && conv.user_a_id !== userId) otherUserIds.add(conv.user_a_id);
        if (conv.user_b_id && conv.user_b_id !== userId) otherUserIds.add(conv.user_b_id);
      });

      // Fetch students
      const { data: students } = await supabase
        .from('students')
        .select('user_id, full_name, profile_photo_url')
        .in('user_id', Array.from(otherUserIds));

      // Fetch owners
      const { data: owners } = await supabase
        .from('owners')
        .select('user_id, full_name, profile_photo_url')
        .in('user_id', Array.from(otherUserIds));

      const userMap = new Map<string, { name: string; avatar?: string }>();
      students?.forEach(s => userMap.set(s.user_id, { name: s.full_name, avatar: s.profile_photo_url || undefined }));
      owners?.forEach(o => userMap.set(o.user_id, { name: o.full_name, avatar: o.profile_photo_url || undefined }));

      // Build sender options
      const senders: SenderOption[] = [];
      userMap.forEach((value, key) => {
        senders.push({ id: key, name: value.name, photo: value.avatar });
      });
      setSenderOptions(senders);

      const convMap = new Map<string, { name: string; avatar?: string; isGroup?: boolean }>();
      conversations.forEach(conv => {
        if (conv.is_group || conv.group_name) {
          convMap.set(conv.id, { 
            name: conv.group_name || 'Group', 
            avatar: conv.group_photo_url || undefined,
            isGroup: true
          });
        } else {
          const otherUserId = conv.user_a_id === userId ? conv.user_b_id : conv.user_a_id;
          if (otherUserId) {
            const userInfo = userMap.get(otherUserId);
            if (userInfo) {
              convMap.set(conv.id, { ...userInfo, isGroup: false });
            }
          }
        }
      });
      setConversationMap(convMap);
    };

    loadConversationDetails();
  }, [open, userId]);

  const searchMessages = useCallback(async (query: string) => {
    if (!userId) return;

    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('messages')
        .select('id, body, created_at, conversation_id, sender_id, attachment_type, attachment_url')
        .order('created_at', { ascending: false })
        .limit(100);

      // Text search (only if query provided)
      if (query.trim()) {
        queryBuilder = queryBuilder.ilike('body', `%${query}%`);
      }

      // Date range filter
      if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        queryBuilder = queryBuilder.gte('created_at', fromDate.toISOString());
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        queryBuilder = queryBuilder.lte('created_at', toDate.toISOString());
      }

      // Sender filter
      if (senderFilter) {
        queryBuilder = queryBuilder.eq('sender_id', senderFilter);
      }

      const { data: messages } = await queryBuilder;

      if (!messages) {
        setResults([]);
        return;
      }

      // Filter to only include messages from user's conversations
      let filtered = messages.filter(msg => conversationMap.has(msg.conversation_id));

      // Filter by media type
      if (mediaFilter !== 'all') {
        filtered = filtered.filter(msg => {
          if (!msg.attachment_type) return false;
          
          if (mediaFilter === 'photos') {
            return msg.attachment_type.startsWith('image/') || msg.attachment_type === 'image';
          }
          if (mediaFilter === 'videos') {
            return msg.attachment_type.startsWith('video/') || msg.attachment_type === 'video';
          }
          if (mediaFilter === 'documents') {
            return msg.attachment_type.includes('pdf') || 
                   msg.attachment_type.includes('document') ||
                   msg.attachment_type === 'file' ||
                   msg.attachment_type.includes('application');
          }
          return true;
        });
      }

      const searchResults: SearchResult[] = filtered.map(msg => {
        const convInfo = conversationMap.get(msg.conversation_id);
        return {
          messageId: msg.id,
          conversationId: msg.conversation_id,
          conversationName: convInfo?.name || 'Unknown',
          conversationAvatar: convInfo?.avatar,
          messageBody: msg.body || (msg.attachment_type ? `[${getAttachmentLabel(msg.attachment_type)}]` : ''),
          timestamp: msg.created_at,
          senderId: msg.sender_id,
          attachmentType: msg.attachment_type || undefined,
          isGroup: convInfo?.isGroup,
        };
      });

      setResults(searchResults.slice(0, 50));
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [userId, conversationMap, mediaFilter, dateRange, senderFilter]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    
    // If filters are active, search even with empty query
    const shouldSearch = searchQuery.trim() || mediaFilter !== 'all' || dateRange.from || dateRange.to || senderFilter;
    
    if (!shouldSearch) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchMessages(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchMessages, open, mediaFilter, dateRange, senderFilter]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setResults([]);
      setShowFilters(false);
      setMediaFilter('all');
      setDateRange({});
      setSenderFilter(null);
    }
  }, [open]);

  const clearFilters = () => {
    setMediaFilter('all');
    setDateRange({});
    setSenderFilter(null);
  };

  const getAttachmentLabel = (type: string): string => {
    if (type.startsWith('image') || type === 'image') return 'Photo';
    if (type.startsWith('video') || type === 'video') return 'Video';
    if (type.startsWith('audio') || type === 'audio') return 'Audio';
    return 'File';
  };

  const getAttachmentIcon = (type?: string) => {
    if (!type) return null;
    if (type.startsWith('image') || type === 'image') return <Image className="w-3 h-3 text-blue-500" />;
    if (type.startsWith('video') || type === 'video') return <Video className="w-3 h-3 text-purple-500" />;
    return <FileText className="w-3 h-3 text-orange-500" />;
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="px-4 pb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-muted/50"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2 w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <SearchFilterPanel
              mediaFilter={mediaFilter}
              onMediaFilterChange={setMediaFilter}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              senderFilter={senderFilter}
              onSenderFilterChange={setSenderFilter}
              senderOptions={senderOptions}
              onClearFilters={clearFilters}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1 px-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2 pb-4">
            {results.map((result) => (
              <motion.button
                key={result.messageId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  onSelectResult(result.conversationId, result.messageId);
                  onOpenChange(false);
                }}
                className="w-full p-3 rounded-lg bg-muted/50 hover:bg-muted text-left transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={result.conversationAvatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {result.isGroup ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        result.conversationName.charAt(0)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">
                        {result.conversationName}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(result.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5 flex items-center gap-1">
                      {getAttachmentIcon(result.attachmentType)}
                      {highlightMatch(result.messageBody, searchQuery)}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (searchQuery || activeFilterCount > 0) ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No messages found</p>
            {activeFilterCount > 0 && (
              <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Search across all your conversations</p>
            <p className="text-xs mt-1">Use filters to narrow down results</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0 pt-4">
          <SheetHeader className="px-4 pb-2">
            <SheetTitle>Search Messages</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[600px] p-0 pt-6 flex flex-col">
        <DialogHeader className="px-4 pb-2">
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

export default GlobalSearchSheet;
