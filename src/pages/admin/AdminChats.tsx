import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageSquare, ArrowLeft, Filter, X, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, subDays, startOfDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/AdminLayout';

type ConversationWithDetails = {
  id: string;
  user_a_id: string | null;
  user_b_id: string | null;
  student_id: string | null;
  owner_id: string | null;
  dorm_id: string | null;
  updated_at: string;
  participant_a_name: string;
  participant_a_photo: string | null;
  participant_a_role: string;
  participant_b_name: string;
  participant_b_photo: string | null;
  participant_b_role: string;
  dorm_name: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  message_count: number;
};

type ChatFilters = {
  search: string;
  chatType: 'all' | 'student-student' | 'student-owner';
  timeRange: 'all' | 'today' | '7days' | '30days';
  sortBy: 'newest' | 'oldest' | 'message_count';
};

export default function AdminChats() {
  const { loading } = useRoleGuard('admin');
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationWithDetails[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<ChatFilters>({
    search: '',
    chatType: 'all',
    timeRange: 'all',
    sortBy: 'newest',
  });

  useEffect(() => {
    loadAdminUserId();
  }, []);

  useEffect(() => {
    if (adminUserId) {
      loadAllConversations();
    }
  }, [adminUserId]);

  useEffect(() => {
    applyFilters();
  }, [filters, conversations]);

  const loadAdminUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setAdminUserId(user.id);
    }
  };

  const applyFilters = () => {
    let filtered = [...conversations];

    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter((conv) => {
        return (
          conv.participant_a_name?.toLowerCase().includes(query) ||
          conv.participant_b_name?.toLowerCase().includes(query) ||
          conv.dorm_name?.toLowerCase().includes(query) ||
          conv.last_message?.toLowerCase().includes(query)
        );
      });
    }

    if (filters.chatType === 'student-student') {
      filtered = filtered.filter(conv => 
        conv.participant_a_role === 'student' && conv.participant_b_role === 'student'
      );
    } else if (filters.chatType === 'student-owner') {
      filtered = filtered.filter(conv => 
        (conv.participant_a_role === 'student' && conv.participant_b_role === 'owner') ||
        (conv.participant_a_role === 'owner' && conv.participant_b_role === 'student')
      );
    }

    if (filters.timeRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date | null = null;

      if (filters.timeRange === 'today') {
        cutoffDate = startOfDay(now);
      } else if (filters.timeRange === '7days') {
        cutoffDate = subDays(now, 7);
      } else if (filters.timeRange === '30days') {
        cutoffDate = subDays(now, 30);
      }

      if (cutoffDate) {
        filtered = filtered.filter(conv => new Date(conv.updated_at) >= cutoffDate!);
      }
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'oldest':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'message_count':
          return b.message_count - a.message_count;
        default:
          return 0;
      }
    });

    setFilteredConversations(filtered);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      chatType: 'all',
      timeRange: 'all',
      sortBy: 'newest',
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.chatType !== 'all') count++;
    if (filters.timeRange !== 'all') count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  };

  const loadAllConversations = async () => {
    if (!adminUserId) return;
    
    setLoadingData(true);
    try {
      // Get all conversations EXCLUDING admin conversations
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id, user_a_id, user_b_id, student_id, owner_id, dorm_id, updated_at')
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      if (!convData || convData.length === 0) {
        setConversations([]);
        setFilteredConversations([]);
        setLoadingData(false);
        return;
      }

      // Filter out admin conversations (where admin is user_a or user_b)
      const nonAdminConversations = convData.filter(c => 
        c.user_a_id !== adminUserId && c.user_b_id !== adminUserId
      );

      if (nonAdminConversations.length === 0) {
        setConversations([]);
        setFilteredConversations([]);
        setLoadingData(false);
        return;
      }

      // Get all unique user IDs
      const userIds = [...new Set([
        ...nonAdminConversations.map(c => c.user_a_id).filter(Boolean),
        ...nonAdminConversations.map(c => c.user_b_id).filter(Boolean),
      ])] as string[];

      const dormIds = [...new Set(nonAdminConversations.map(c => c.dorm_id).filter(Boolean))] as string[];

      // Fetch students
      const { data: students } = await supabase
        .from('students')
        .select('id, user_id, full_name, profile_photo_url');

      // Fetch owners
      const { data: owners } = await supabase
        .from('owners')
        .select('id, user_id, full_name, profile_photo_url');

      // Fetch dorms
      const { data: dormsData } = await supabase
        .from('dorms')
        .select('id, name, dorm_name')
        .in('id', dormIds.length > 0 ? dormIds : ['00000000-0000-0000-0000-000000000000']);

      // Create user lookup maps
      const studentByUserId = new Map(students?.map(s => [s.user_id, s]) || []);
      const ownerByUserId = new Map(owners?.map(o => [o.user_id, o]) || []);
      const dormMap = new Map(dormsData?.map(d => [d.id, d]) || []);

      // Fetch messages for all conversations
      const conversationIds = nonAdminConversations.map(c => c.id);
      const { data: messagesData } = await supabase
        .from('messages')
        .select('conversation_id, body, created_at, read')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      const messagesByConv = new Map<string, any[]>();
      const messageCountByConv = new Map<string, number>();
      const unreadByConv = new Map<string, number>();
      
      messagesData?.forEach(msg => {
        if (!messagesByConv.has(msg.conversation_id)) {
          messagesByConv.set(msg.conversation_id, []);
        }
        messagesByConv.get(msg.conversation_id)!.push(msg);
        
        const count = messageCountByConv.get(msg.conversation_id) || 0;
        messageCountByConv.set(msg.conversation_id, count + 1);
        
        if (!msg.read) {
          const unread = unreadByConv.get(msg.conversation_id) || 0;
          unreadByConv.set(msg.conversation_id, unread + 1);
        }
      });

      // Helper to get user info
      const getUserInfo = (userId: string | null) => {
        if (!userId) return { name: 'Unknown', photo: null, role: 'unknown' };
        
        const student = studentByUserId.get(userId);
        if (student) return { name: student.full_name || 'Student', photo: student.profile_photo_url, role: 'student' };
        
        const owner = ownerByUserId.get(userId);
        if (owner) return { name: owner.full_name || 'Owner', photo: owner.profile_photo_url, role: 'owner' };
        
        return { name: 'Unknown User', photo: null, role: 'unknown' };
      };

      const enriched: ConversationWithDetails[] = nonAdminConversations.map(conv => {
        const participantA = getUserInfo(conv.user_a_id);
        const participantB = getUserInfo(conv.user_b_id);
        const dorm = conv.dorm_id ? dormMap.get(conv.dorm_id) : null;
        const lastMsg = messagesByConv.get(conv.id)?.[0];

        return {
          id: conv.id,
          user_a_id: conv.user_a_id,
          user_b_id: conv.user_b_id,
          student_id: conv.student_id,
          owner_id: conv.owner_id,
          dorm_id: conv.dorm_id,
          updated_at: conv.updated_at,
          participant_a_name: participantA.name,
          participant_a_photo: participantA.photo,
          participant_a_role: participantA.role,
          participant_b_name: participantB.name,
          participant_b_photo: participantB.photo,
          participant_b_role: participantB.role,
          dorm_name: dorm?.name || dorm?.dorm_name || null,
          last_message: lastMsg?.body || null,
          last_message_time: lastMsg?.created_at || null,
          unread_count: unreadByConv.get(conv.id) || 0,
          message_count: messageCountByConv.get(conv.id) || 0,
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
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-foreground/60">Loading chats...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold gradient-text">All User Chats</h2>
          </div>
          <p className="text-foreground/60 text-sm ml-4">
            (Excludes admin/support conversations)
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="conversations" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="analytics" onClick={() => navigate('/admin/chats/analytics')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversations" className="space-y-6 mt-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, dorm, or message..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 bg-card/50 backdrop-blur-sm border-primary/20"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {getActiveFilterCount() > 0 && (
                    <Badge className="ml-2 px-1.5 py-0.5 text-xs" variant="secondary">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                </Button>
                {getActiveFilterCount() > 0 && (
                  <Button variant="ghost" size="icon" onClick={clearFilters}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Chat Type</label>
                          <Select
                            value={filters.chatType}
                            onValueChange={(value: any) => setFilters({ ...filters, chatType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Chats</SelectItem>
                              <SelectItem value="student-student">Student ↔ Student</SelectItem>
                              <SelectItem value="student-owner">Student ↔ Owner</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Time Range</label>
                          <Select
                            value={filters.timeRange}
                            onValueChange={(value: any) => setFilters({ ...filters, timeRange: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Time</SelectItem>
                              <SelectItem value="today">Today</SelectItem>
                              <SelectItem value="7days">Last 7 Days</SelectItem>
                              <SelectItem value="30days">Last 30 Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Sort By</label>
                          <Select
                            value={filters.sortBy}
                            onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="newest">Newest First</SelectItem>
                              <SelectItem value="oldest">Oldest First</SelectItem>
                              <SelectItem value="message_count">Most Messages</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-sm text-foreground/60">Total Chats</p>
                <p className="text-2xl font-bold">{conversations.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-foreground/60">Student ↔ Student</p>
                <p className="text-2xl font-bold">
                  {conversations.filter(c => c.participant_a_role === 'student' && c.participant_b_role === 'student').length}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-foreground/60">Student ↔ Owner</p>
                <p className="text-2xl font-bold">
                  {conversations.filter(c => 
                    (c.participant_a_role === 'student' && c.participant_b_role === 'owner') ||
                    (c.participant_a_role === 'owner' && c.participant_b_role === 'student')
                  ).length}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-foreground/60">Total Messages</p>
                <p className="text-2xl font-bold">
                  {conversations.reduce((sum, c) => sum + c.message_count, 0)}
                </p>
              </Card>
            </div>

            {/* Conversations List */}
            <div className="space-y-3">
              {filteredConversations.length === 0 ? (
                <Card className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-foreground/20 mb-4" />
                  <p className="text-foreground/60">No conversations found</p>
                </Card>
              ) : (
                filteredConversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card 
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate('/admin/chats/view', { state: { conversationId: conv.id } })}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                          <Avatar className="w-10 h-10 border-2 border-background">
                            <AvatarImage src={conv.participant_a_photo || undefined} />
                            <AvatarFallback>{conv.participant_a_name[0]}</AvatarFallback>
                          </Avatar>
                          <Avatar className="w-10 h-10 border-2 border-background">
                            <AvatarImage src={conv.participant_b_photo || undefined} />
                            <AvatarFallback>{conv.participant_b_name[0]}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{conv.participant_a_name}</span>
                            <span className="text-foreground/40">↔</span>
                            <span className="font-medium truncate">{conv.participant_b_name}</span>
                          </div>
                          {conv.last_message && (
                            <p className="text-sm text-foreground/60 truncate">{conv.last_message}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex gap-1 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {conv.participant_a_role}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {conv.participant_b_role}
                            </Badge>
                          </div>
                          <p className="text-xs text-foreground/40">
                            {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                          </p>
                          <p className="text-xs text-foreground/40">{conv.message_count} messages</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}