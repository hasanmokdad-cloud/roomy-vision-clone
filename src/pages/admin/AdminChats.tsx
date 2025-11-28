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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

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
  message_count: number;
  tour_status: 'pending' | 'accepted' | 'declined' | 'none';
};

type ChatFilters = {
  search: string;
  userType: 'all' | 'student' | 'owner';
  dormId: string | null;
  status: 'all' | 'unread' | 'pending_tour' | 'accepted_tour' | 'declined_tour' | 'no_tour';
  timeRange: 'all' | 'today' | '7days' | '30days' | 'custom';
  customDateRange: { from: Date | null; to: Date | null };
  sortBy: 'newest' | 'oldest' | 'student_name' | 'owner_name' | 'dorm_name' | 'message_count';
};

type DormOption = {
  id: string;
  name: string;
};

export default function AdminChats() {
  const { loading } = useRoleGuard('admin');
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationWithDetails[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dorms, setDorms] = useState<DormOption[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<ChatFilters>({
    search: '',
    userType: 'all',
    dormId: null,
    status: 'all',
    timeRange: 'all',
    customDateRange: { from: null, to: null },
    sortBy: 'newest',
  });

  useEffect(() => {
    loadAllConversations();
    loadDorms();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, conversations]);

  const loadDorms = async () => {
    const { data } = await supabase
      .from('dorms')
      .select('id, name, dorm_name')
      .eq('verification_status', 'Verified')
      .order('name');
    
    if (data) {
      setDorms(data.map(d => ({ id: d.id, name: d.name || d.dorm_name || 'Unnamed Dorm' })));
    }
  };

  const applyFilters = () => {
    let filtered = [...conversations];

    // Search filter
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter((conv) => {
        return (
          conv.student_name?.toLowerCase().includes(query) ||
          conv.owner_name?.toLowerCase().includes(query) ||
          conv.dorm_name?.toLowerCase().includes(query) ||
          conv.last_message?.toLowerCase().includes(query) ||
          conv.id.toLowerCase().includes(query)
        );
      });
    }

    // User type filter
    if (filters.userType === 'student') {
      filtered = filtered.filter(conv => conv.owner_id === null);
    } else if (filters.userType === 'owner') {
      filtered = filtered.filter(conv => conv.owner_id !== null);
    }

    // Dorm filter
    if (filters.dormId) {
      filtered = filtered.filter(conv => conv.dorm_id === filters.dormId);
    }

    // Status filter
    if (filters.status === 'unread') {
      filtered = filtered.filter(conv => conv.unread_count > 0);
    } else if (filters.status === 'pending_tour') {
      filtered = filtered.filter(conv => conv.tour_status === 'pending');
    } else if (filters.status === 'accepted_tour') {
      filtered = filtered.filter(conv => conv.tour_status === 'accepted');
    } else if (filters.status === 'declined_tour') {
      filtered = filtered.filter(conv => conv.tour_status === 'declined');
    } else if (filters.status === 'no_tour') {
      filtered = filtered.filter(conv => conv.tour_status === 'none');
    }

    // Time range filter
    if (filters.timeRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date | null = null;

      if (filters.timeRange === 'today') {
        cutoffDate = startOfDay(now);
      } else if (filters.timeRange === '7days') {
        cutoffDate = subDays(now, 7);
      } else if (filters.timeRange === '30days') {
        cutoffDate = subDays(now, 30);
      } else if (filters.timeRange === 'custom' && filters.customDateRange.from) {
        cutoffDate = filters.customDateRange.from;
      }

      if (cutoffDate) {
        filtered = filtered.filter(conv => {
          const convDate = new Date(conv.updated_at);
          const endDate = filters.timeRange === 'custom' && filters.customDateRange.to 
            ? filters.customDateRange.to 
            : now;
          return convDate >= cutoffDate! && convDate <= endDate;
        });
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'oldest':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'student_name':
          return a.student_name.localeCompare(b.student_name);
        case 'owner_name':
          return (a.owner_name || '').localeCompare(b.owner_name || '');
        case 'dorm_name':
          return (a.dorm_name || '').localeCompare(b.dorm_name || '');
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
      userType: 'all',
      dormId: null,
      status: 'all',
      timeRange: 'all',
      customDateRange: { from: null, to: null },
      sortBy: 'newest',
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.userType !== 'all') count++;
    if (filters.dormId) count++;
    if (filters.status !== 'all') count++;
    if (filters.timeRange !== 'all') count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  };

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

      // Fetch all messages for each conversation
      const conversationIds = convData.map(c => c.id);
      const { data: messagesData } = await supabase
        .from('messages')
        .select('conversation_id, body, created_at, read')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      // Fetch bookings for tour status
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('student_id, owner_id, dorm_id, status')
        .in('dorm_id', dormIds.length > 0 ? dormIds : ['00000000-0000-0000-0000-000000000000']);

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

      // Count unread and total messages by conversation
      const unreadByConv = new Map<string, number>();
      const messageCountByConv = new Map<string, number>();
      unreadData?.forEach(msg => {
        const count = unreadByConv.get(msg.conversation_id) || 0;
        unreadByConv.set(msg.conversation_id, count + 1);
      });
      messagesData?.forEach(msg => {
        const count = messageCountByConv.get(msg.conversation_id) || 0;
        messageCountByConv.set(msg.conversation_id, count + 1);
      });

      // Determine tour status per conversation
      const getTourStatus = (studentId: string, ownerId: string | null, dormId: string | null) => {
        if (!ownerId || !dormId) return 'none';
        const booking = bookingsData?.find(
          b => b.student_id === studentId && b.owner_id === ownerId && b.dorm_id === dormId
        );
        if (!booking) return 'none';
        if (booking.status === 'pending') return 'pending';
        if (booking.status === 'approved') return 'accepted';
        if (booking.status === 'declined') return 'declined';
        return 'none';
      };

      // Map conversations with enriched data
      const enriched: ConversationWithDetails[] = convData.map(conv => {
        const student = studentMap.get(conv.student_id);
        const owner = conv.owner_id ? ownerMap.get(conv.owner_id) : null;
        const dorm = conv.dorm_id ? dormMap.get(conv.dorm_id) : null;
        const lastMsg = messagesByConv.get(conv.id)?.[0];
        const unreadCount = unreadByConv.get(conv.id) || 0;
        const messageCount = messageCountByConv.get(conv.id) || 0;
        const tourStatus = getTourStatus(conv.student_id, conv.owner_id, conv.dorm_id);

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
          message_count: messageCount,
          tour_status: tourStatus as any,
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
                  placeholder="Search by student, owner, dorm, or message..."
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
                        {/* User Type */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">User Type</label>
                          <Select
                            value={filters.userType}
                            onValueChange={(value: any) => setFilters({ ...filters, userType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="student">Students Only</SelectItem>
                              <SelectItem value="owner">Owners Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Dorm Filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Dorm</label>
                          <Select
                            value={filters.dormId || 'all'}
                            onValueChange={(value) => setFilters({ ...filters, dormId: value === 'all' ? null : value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Dorms</SelectItem>
                              {dorms.map(dorm => (
                                <SelectItem key={dorm.id} value={dorm.id}>{dorm.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Status</label>
                          <Select
                            value={filters.status}
                            onValueChange={(value: any) => setFilters({ ...filters, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="unread">Unread</SelectItem>
                              <SelectItem value="pending_tour">Pending Tour</SelectItem>
                              <SelectItem value="accepted_tour">Accepted Tour</SelectItem>
                              <SelectItem value="declined_tour">Declined Tour</SelectItem>
                              <SelectItem value="no_tour">No Tour Activity</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Time Range */}
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
                              <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Sort By */}
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
                              <SelectItem value="newest">Newest Activity</SelectItem>
                              <SelectItem value="oldest">Oldest Activity</SelectItem>
                              <SelectItem value="student_name">Student Name (A-Z)</SelectItem>
                              <SelectItem value="owner_name">Owner Name (A-Z)</SelectItem>
                              <SelectItem value="dorm_name">Dorm Name (A-Z)</SelectItem>
                              <SelectItem value="message_count">Message Count</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Custom Date Range */}
                      {filters.timeRange === 'custom' && (
                        <div className="flex gap-4">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="flex-1">
                                {filters.customDateRange.from ? 
                                  filters.customDateRange.from.toLocaleDateString() : 
                                  'From Date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={filters.customDateRange.from || undefined}
                                onSelect={(date) => setFilters({
                                  ...filters,
                                  customDateRange: { ...filters.customDateRange, from: date || null }
                                })}
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="flex-1">
                                {filters.customDateRange.to ? 
                                  filters.customDateRange.to.toLocaleDateString() : 
                                  'To Date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={filters.customDateRange.to || undefined}
                                onSelect={(date) => setFilters({
                                  ...filters,
                                  customDateRange: { ...filters.customDateRange, to: date || null }
                                })}
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conversations List */}
            {filteredConversations.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-center text-muted-foreground">
                    {filters.search ? 'No conversations match your filters' : 'No conversations found'}
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
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
