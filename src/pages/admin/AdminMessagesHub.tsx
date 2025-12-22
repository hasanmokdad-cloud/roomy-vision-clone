import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MessageSquare, ArrowLeft, Filter, X, BarChart3, Users, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, subDays, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type SupportConversation = {
  id: string;
  user_id: string;
  user_name: string;
  user_photo: string | null;
  user_role: 'student' | 'owner';
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  updated_at: string;
};

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

export default function AdminMessagesHub() {
  const { loading } = useRoleGuard('admin');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [supportChats, setSupportChats] = useState<SupportConversation[]>([]);
  const [allConversations, setAllConversations] = useState<ConversationWithDetails[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationWithDetails[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [supportTab, setSupportTab] = useState<'all' | 'students' | 'owners'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [busiestDorms, setBusiestDorms] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<string>('30days');
  
  const [filters, setFilters] = useState<ChatFilters>({
    search: '',
    chatType: 'all',
    timeRange: 'all',
    sortBy: 'newest',
  });

  const activeTab = searchParams.get('tab') || 'support';

  useEffect(() => {
    loadAdminUserId();
  }, []);

  useEffect(() => {
    if (adminUserId) {
      loadAllData();
    }
  }, [adminUserId]);

  useEffect(() => {
    applyFilters();
  }, [filters, allConversations]);

  useEffect(() => {
    if (!loading && activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [dateRange, loading, activeTab]);

  const loadAdminUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setAdminUserId(user.id);
    }
  };

  const loadAllData = async () => {
    setLoadingData(true);
    await Promise.all([
      loadSupportConversations(),
      loadAllConversations(),
    ]);
    setLoadingData(false);
  };

  const loadSupportConversations = async () => {
    if (!adminUserId) return;
    
    try {
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id, user_a_id, user_b_id, updated_at')
        .or(`user_a_id.eq.${adminUserId},user_b_id.eq.${adminUserId}`)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      if (!convData || convData.length === 0) {
        setSupportChats([]);
        return;
      }

      const { data: students } = await supabase.from('students').select('id, user_id, full_name, profile_photo_url');
      const { data: owners } = await supabase.from('owners').select('id, user_id, full_name, profile_photo_url');

      const studentByUserId = new Map(students?.map(s => [s.user_id, s]) || []);
      const ownerByUserId = new Map(owners?.map(o => [o.user_id, o]) || []);

      const conversationIds = convData.map(c => c.id);
      const { data: messagesData } = await supabase
        .from('messages')
        .select('conversation_id, body, created_at, read, sender_id')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      const messagesByConv = new Map<string, any[]>();
      const unreadByConv = new Map<string, number>();
      
      messagesData?.forEach(msg => {
        if (!messagesByConv.has(msg.conversation_id)) {
          messagesByConv.set(msg.conversation_id, []);
        }
        messagesByConv.get(msg.conversation_id)!.push(msg);
        
        if (!msg.read && msg.sender_id !== adminUserId) {
          const unread = unreadByConv.get(msg.conversation_id) || 0;
          unreadByConv.set(msg.conversation_id, unread + 1);
        }
      });

      const enriched: SupportConversation[] = convData.map(conv => {
        const otherUserId = conv.user_a_id === adminUserId ? conv.user_b_id : conv.user_a_id;
        
        let userName = 'Unknown User';
        let userPhoto: string | null = null;
        let userRole: 'student' | 'owner' = 'student';

        const student = studentByUserId.get(otherUserId || '');
        const owner = ownerByUserId.get(otherUserId || '');

        if (student) {
          userName = student.full_name || 'Student';
          userPhoto = student.profile_photo_url;
          userRole = 'student';
        } else if (owner) {
          userName = owner.full_name || 'Owner';
          userPhoto = owner.profile_photo_url;
          userRole = 'owner';
        }

        const lastMsg = messagesByConv.get(conv.id)?.[0];

        return {
          id: conv.id,
          user_id: otherUserId || '',
          user_name: userName,
          user_photo: userPhoto,
          user_role: userRole,
          last_message: lastMsg?.body || null,
          last_message_time: lastMsg?.created_at || null,
          unread_count: unreadByConv.get(conv.id) || 0,
          updated_at: conv.updated_at,
        };
      });

      setSupportChats(enriched);
    } catch (error) {
      console.error('Error loading support conversations:', error);
    }
  };

  const loadAllConversations = async () => {
    if (!adminUserId) return;
    
    try {
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id, user_a_id, user_b_id, student_id, owner_id, dorm_id, updated_at')
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      if (!convData || convData.length === 0) {
        setAllConversations([]);
        setFilteredConversations([]);
        return;
      }

      const nonAdminConversations = convData.filter(c => 
        c.user_a_id !== adminUserId && c.user_b_id !== adminUserId
      );

      if (nonAdminConversations.length === 0) {
        setAllConversations([]);
        setFilteredConversations([]);
        return;
      }

      const dormIds = [...new Set(nonAdminConversations.map(c => c.dorm_id).filter(Boolean))] as string[];

      const { data: students } = await supabase.from('students').select('id, user_id, full_name, profile_photo_url');
      const { data: owners } = await supabase.from('owners').select('id, user_id, full_name, profile_photo_url');
      const { data: dormsData } = await supabase.from('dorms').select('id, name, dorm_name').in('id', dormIds.length > 0 ? dormIds : ['00000000-0000-0000-0000-000000000000']);

      const studentByUserId = new Map(students?.map(s => [s.user_id, s]) || []);
      const ownerByUserId = new Map(owners?.map(o => [o.user_id, o]) || []);
      const dormMap = new Map(dormsData?.map(d => [d.id, d]) || []);

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

      setAllConversations(enriched);
      setFilteredConversations(enriched);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data: conversations } = await supabase.from('conversations').select(`id, dorm_id, updated_at, messages(id)`).order('updated_at', { ascending: false }).limit(100);
      const dormIds = [...new Set(conversations?.map(c => c.dorm_id).filter(Boolean))];
      const { data: dorms } = await supabase.from('dorms').select('id, name, dorm_name').in('id', dormIds);

      const dormMap = new Map(dorms?.map(d => [d.id, d.name || d.dorm_name]) || []);
      const stats = new Map<string, any>();
      conversations?.forEach(conv => {
        if (!conv.dorm_id) return;
        const dormName = dormMap.get(conv.dorm_id) || 'Unknown Dorm';
        const existing = stats.get(conv.dorm_id) || { name: dormName, conversations: 0, messages: 0 };
        existing.conversations += 1;
        existing.messages += conv.messages?.length || 0;
        stats.set(conv.dorm_id, existing);
      });
      setBusiestDorms(Array.from(stats.values()).sort((a, b) => b.messages - a.messages).slice(0, 5));
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...allConversations];

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

  const getFilteredSupportChats = () => {
    if (supportTab === 'students') {
      return supportChats.filter(c => c.user_role === 'student');
    } else if (supportTab === 'owners') {
      return supportChats.filter(c => c.user_role === 'owner');
    }
    return supportChats;
  };

  const supportStats = {
    total: supportChats.length,
    students: supportChats.filter(c => c.user_role === 'student').length,
    owners: supportChats.filter(c => c.user_role === 'owner').length,
    unread: supportChats.filter(c => c.unread_count > 0).length,
  };

  const allChatsStats = {
    total: allConversations.length,
    studentStudent: allConversations.filter(c => c.participant_a_role === 'student' && c.participant_b_role === 'student').length,
    studentOwner: allConversations.filter(c => 
      (c.participant_a_role === 'student' && c.participant_b_role === 'owner') ||
      (c.participant_a_role === 'owner' && c.participant_b_role === 'student')
    ).length,
  };

  if (loading || loadingData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Messages Hub</h1>
              <p className="text-foreground/60">Manage support inbox, user chats, and analytics</p>
            </div>
          </div>
          <Button onClick={loadAllData} variant="outline">Refresh</Button>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })}>
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="support" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Support Inbox
            </TabsTrigger>
            <TabsTrigger value="chats" className="gap-2">
              <Users className="h-4 w-4" />
              All Chats
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* SUPPORT INBOX TAB */}
          <TabsContent value="support" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-sm text-foreground/60">Total Conversations</div>
                <div className="text-2xl font-bold">{supportStats.total}</div>
              </Card>
              <Card className="p-4 border-blue-500/20 bg-blue-500/5">
                <div className="text-sm text-blue-500 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  With Students
                </div>
                <div className="text-2xl font-bold text-blue-500">{supportStats.students}</div>
              </Card>
              <Card className="p-4 border-purple-500/20 bg-purple-500/5">
                <div className="text-sm text-purple-500 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  With Owners
                </div>
                <div className="text-2xl font-bold text-purple-500">{supportStats.owners}</div>
              </Card>
              <Card className="p-4 border-orange-500/20 bg-orange-500/5">
                <div className="text-sm text-orange-500 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Unread
                </div>
                <div className="text-2xl font-bold text-orange-500">{supportStats.unread}</div>
              </Card>
            </div>

            <Tabs value={supportTab} onValueChange={(v) => setSupportTab(v as any)}>
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="all">All ({supportStats.total})</TabsTrigger>
                <TabsTrigger value="students">Students ({supportStats.students})</TabsTrigger>
                <TabsTrigger value="owners">Owners ({supportStats.owners})</TabsTrigger>
              </TabsList>

              <TabsContent value={supportTab} className="mt-6">
                <div className="space-y-3">
                  {getFilteredSupportChats().length === 0 ? (
                    <Card className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 mx-auto text-foreground/20 mb-4" />
                      <p className="text-foreground/60">No support conversations yet</p>
                    </Card>
                  ) : (
                    getFilteredSupportChats().map((chat) => (
                      <motion.div key={chat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Card 
                          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${chat.unread_count > 0 ? 'border-primary/50 bg-primary/5' : ''}`}
                          onClick={() => navigate('/messages', { state: { selectedConversationId: chat.id } })}
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={chat.user_photo || undefined} />
                                <AvatarFallback>{chat.user_name[0]}</AvatarFallback>
                              </Avatar>
                              {chat.unread_count > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                  <span className="text-xs text-white font-bold">{chat.unread_count}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{chat.user_name}</span>
                                <Badge variant={chat.user_role === 'student' ? 'default' : 'secondary'}>{chat.user_role}</Badge>
                              </div>
                              {chat.last_message && (
                                <p className="text-sm text-foreground/60 truncate mt-1">{chat.last_message}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <div className="flex items-center gap-1 text-xs text-foreground/40">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ALL CHATS TAB */}
          <TabsContent value="chats" className="space-y-6 mt-6">
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
                    <Badge className="ml-2 px-1.5 py-0.5 text-xs" variant="secondary">{getActiveFilterCount()}</Badge>
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
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Chat Type</label>
                          <Select value={filters.chatType} onValueChange={(value: any) => setFilters({ ...filters, chatType: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Chats</SelectItem>
                              <SelectItem value="student-student">Student ↔ Student</SelectItem>
                              <SelectItem value="student-owner">Student ↔ Owner</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Time Range</label>
                          <Select value={filters.timeRange} onValueChange={(value: any) => setFilters({ ...filters, timeRange: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
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
                          <Select value={filters.sortBy} onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-sm text-foreground/60">Total Chats</p>
                <p className="text-2xl font-bold">{allChatsStats.total}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-foreground/60">Student ↔ Student</p>
                <p className="text-2xl font-bold">{allChatsStats.studentStudent}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-foreground/60">Student ↔ Owner</p>
                <p className="text-2xl font-bold">{allChatsStats.studentOwner}</p>
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
                filteredConversations.slice(0, 50).map((conv) => (
                  <motion.div key={conv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card 
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/admin/chats/${conv.id}`)}
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{conv.participant_a_name}</span>
                            <Badge variant="outline" className="text-xs">{conv.participant_a_role}</Badge>
                            <span className="text-foreground/40">↔</span>
                            <span className="font-semibold">{conv.participant_b_name}</span>
                            <Badge variant="outline" className="text-xs">{conv.participant_b_role}</Badge>
                          </div>
                          {conv.last_message && (
                            <p className="text-sm text-foreground/60 truncate mt-1">{conv.last_message}</p>
                          )}
                          {conv.dorm_name && (
                            <p className="text-xs text-foreground/40 mt-1">Dorm: {conv.dorm_name}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <Badge variant="secondary" className="text-xs">{conv.message_count} msgs</Badge>
                          <div className="flex items-center gap-1 text-xs text-foreground/40">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-8 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Chat Analytics
              </h2>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Busiest Dorms
                </CardTitle>
              </CardHeader>
              <CardContent>
                {busiestDorms.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={busiestDorms}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="conversations" fill="#8b5cf6" name="Conversations" />
                      <Bar dataKey="messages" fill="#ec4899" name="Messages" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No chat data available for the selected period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
