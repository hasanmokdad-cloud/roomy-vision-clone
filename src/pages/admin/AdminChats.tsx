import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

type ConversationWithDetails = {
  id: string;
  student_id: string;
  owner_id: string | null;
  dorm_id: string | null;
  updated_at: string;
  student_name: string;
  student_photo: string | null;
  owner_name: string | null;
  owner_photo: string | null;
  dorm_name: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
};

export default function AdminChats() {
  const { loading } = useRoleGuard('admin');
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadAllConversations();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter((conv) => {
      return (
        conv.student_name?.toLowerCase().includes(query) ||
        conv.owner_name?.toLowerCase().includes(query) ||
        conv.dorm_name?.toLowerCase().includes(query) ||
        conv.last_message?.toLowerCase().includes(query)
      );
    });
    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  const loadAllConversations = async () => {
    setLoadingData(true);
    try {
      // Fetch all conversations with related data
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          student_id,
          owner_id,
          dorm_id,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      if (!convData || convData.length === 0) {
        setConversations([]);
        setFilteredConversations([]);
        setLoadingData(false);
        return;
      }

      // Get all student IDs
      const studentIds = [...new Set(convData.map(c => c.student_id).filter(Boolean))];
      const ownerIds = [...new Set(convData.map(c => c.owner_id).filter(Boolean))];
      const dormIds = [...new Set(convData.map(c => c.dorm_id).filter(Boolean))];

      // Fetch students
      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, profile_photo_url')
        .in('id', studentIds);

      // Fetch owners
      const { data: owners } = await supabase
        .from('owners')
        .select('id, full_name, profile_photo_url')
        .in('id', ownerIds);

      // Fetch dorms
      const { data: dorms } = await supabase
        .from('dorms')
        .select('id, name, dorm_name')
        .in('id', dormIds);

      // Fetch last message for each conversation
      const conversationIds = convData.map(c => c.id);
      const { data: messagesData } = await supabase
        .from('messages')
        .select('conversation_id, body, created_at, read')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      // Count unread messages per conversation
      const { data: unreadData } = await supabase
        .from('messages')
        .select('conversation_id, read')
        .in('conversation_id', conversationIds)
        .eq('read', false);

      // Build lookup maps
      const studentMap = new Map(students?.map(s => [s.id, s]) || []);
      const ownerMap = new Map(owners?.map(o => [o.id, o]) || []);
      const dormMap = new Map(dorms?.map(d => [d.id, d]) || []);
      
      // Group messages by conversation
      const messagesByConv = new Map<string, any[]>();
      messagesData?.forEach(msg => {
        if (!messagesByConv.has(msg.conversation_id)) {
          messagesByConv.set(msg.conversation_id, []);
        }
        messagesByConv.get(msg.conversation_id)!.push(msg);
      });

      // Count unread by conversation
      const unreadByConv = new Map<string, number>();
      unreadData?.forEach(msg => {
        const count = unreadByConv.get(msg.conversation_id) || 0;
        unreadByConv.set(msg.conversation_id, count + 1);
      });

      // Map conversations with enriched data
      const enriched: ConversationWithDetails[] = convData.map(conv => {
        const student = studentMap.get(conv.student_id);
        const owner = conv.owner_id ? ownerMap.get(conv.owner_id) : null;
        const dorm = conv.dorm_id ? dormMap.get(conv.dorm_id) : null;
        const lastMsg = messagesByConv.get(conv.id)?.[0];
        const unreadCount = unreadByConv.get(conv.id) || 0;

        return {
          id: conv.id,
          student_id: conv.student_id,
          owner_id: conv.owner_id,
          dorm_id: conv.dorm_id,
          updated_at: conv.updated_at,
          student_name: student?.full_name || 'Unknown Student',
          student_photo: student?.profile_photo_url || null,
          owner_name: owner?.full_name || null,
          owner_photo: owner?.profile_photo_url || null,
          dorm_name: dorm?.name || dorm?.dorm_name || null,
          last_message: lastMsg?.body || null,
          last_message_time: lastMsg?.created_at || null,
          unread_count: unreadCount,
        };
      });

      setConversations(enriched);
      setFilteredConversations(enriched);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <p className="text-foreground/60">Loading chats...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-background to-muted/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-12 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold gradient-text">All Chats</h2>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-12 py-8 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by student, owner, dorm, or message content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/50 backdrop-blur-sm border-primary/20"
          />
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-center text-muted-foreground">
                {searchQuery ? 'No conversations match your search' : 'No conversations found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conv) => (
              <motion.div
                key={conv.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all bg-card/80 backdrop-blur-sm border-primary/20"
                  onClick={() => navigate(`/admin/chats/${conv.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatars */}
                      <div className="flex -space-x-3">
                        <Avatar className="w-12 h-12 border-2 border-background">
                          <AvatarImage src={conv.student_photo || undefined} />
                          <AvatarFallback className="bg-primary/10">
                            {conv.student_name?.charAt(0) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        {conv.owner_photo && (
                          <Avatar className="w-12 h-12 border-2 border-background">
                            <AvatarImage src={conv.owner_photo} />
                            <AvatarFallback className="bg-secondary/10">
                              {conv.owner_name?.charAt(0) || 'O'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>

                      {/* Conversation Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">
                              {conv.student_name} {conv.owner_name && `↔ ${conv.owner_name}`}
                            </h3>
                            {conv.dorm_name && (
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.dorm_name}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {conv.last_message_time && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(conv.last_message_time), {
                                  addSuffix: true,
                                })}
                              </span>
                            )}
                            {conv.unread_count > 0 && (
                              <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {conv.last_message && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {conv.last_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
