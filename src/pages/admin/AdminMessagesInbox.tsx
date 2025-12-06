import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  ArrowLeft,
  Users,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLayout } from '@/components/admin/AdminLayout';

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

export default function AdminMessagesInbox() {
  const { loading } = useRoleGuard('admin');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [supportChats, setSupportChats] = useState<SupportConversation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'students' | 'owners'>('all');

  useEffect(() => {
    loadAdminUserId();
  }, []);

  useEffect(() => {
    if (adminUserId) {
      loadSupportConversations();
    }
  }, [adminUserId]);

  const loadAdminUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setAdminUserId(user.id);
    }
  };

  const loadSupportConversations = async () => {
    if (!adminUserId) return;
    
    setLoadingData(true);
    try {
      // Get conversations where admin is a participant
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id, user_a_id, user_b_id, updated_at')
        .or(`user_a_id.eq.${adminUserId},user_b_id.eq.${adminUserId}`)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      if (!convData || convData.length === 0) {
        setSupportChats([]);
        setLoadingData(false);
        return;
      }

      // Get other user IDs (the ones who are not admin)
      const otherUserIds = convData.map(c => 
        c.user_a_id === adminUserId ? c.user_b_id : c.user_a_id
      ).filter(Boolean) as string[];

      // Fetch students
      const { data: students } = await supabase
        .from('students')
        .select('id, user_id, full_name, profile_photo_url');

      // Fetch owners  
      const { data: owners } = await supabase
        .from('owners')
        .select('id, user_id, full_name, profile_photo_url');

      const studentByUserId = new Map(students?.map(s => [s.user_id, s]) || []);
      const ownerByUserId = new Map(owners?.map(o => [o.user_id, o]) || []);

      // Fetch messages for all conversations
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
        
        // Count unread messages from the other user
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
      toast({
        title: 'Error',
        description: 'Failed to load support conversations',
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const getFilteredChats = () => {
    if (activeTab === 'students') {
      return supportChats.filter(c => c.user_role === 'student');
    } else if (activeTab === 'owners') {
      return supportChats.filter(c => c.user_role === 'owner');
    }
    return supportChats;
  };

  const stats = {
    total: supportChats.length,
    students: supportChats.filter(c => c.user_role === 'student').length,
    owners: supportChats.filter(c => c.user_role === 'owner').length,
    unread: supportChats.filter(c => c.unread_count > 0).length,
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

  const filteredChats = getFilteredChats();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Support Inbox</h1>
            <p className="text-foreground/60">Messages between admin and users (students/owners)</p>
          </div>
          <Button onClick={loadSupportConversations} variant="outline">
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-foreground/60">Total Conversations</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4 border-blue-500/20 bg-blue-500/5">
            <div className="text-sm text-blue-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              With Students
            </div>
            <div className="text-2xl font-bold text-blue-500">{stats.students}</div>
          </Card>
          <Card className="p-4 border-purple-500/20 bg-purple-500/5">
            <div className="text-sm text-purple-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              With Owners
            </div>
            <div className="text-2xl font-bold text-purple-500">{stats.owners}</div>
          </Card>
          <Card className="p-4 border-orange-500/20 bg-orange-500/5">
            <div className="text-sm text-orange-500 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Unread
            </div>
            <div className="text-2xl font-bold text-orange-500">{stats.unread}</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="students">Students ({stats.students})</TabsTrigger>
            <TabsTrigger value="owners">Owners ({stats.owners})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Conversations List */}
            <div className="space-y-3">
              {filteredChats.length === 0 ? (
                <Card className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-foreground/20 mb-4" />
                  <p className="text-foreground/60">No support conversations yet</p>
                  <p className="text-sm text-foreground/40 mt-2">
                    Users can contact support via the Contact Form on /contact
                  </p>
                </Card>
              ) : (
                filteredChats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card 
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        chat.unread_count > 0 ? 'border-primary/50 bg-primary/5' : ''
                      }`}
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
                            <Badge variant={chat.user_role === 'student' ? 'default' : 'secondary'}>
                              {chat.user_role}
                            </Badge>
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
      </div>
    </AdminLayout>
  );
}