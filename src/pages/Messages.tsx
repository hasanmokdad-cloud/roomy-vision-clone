import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import BottomNav from '@/components/BottomNav';

type Conversation = {
  id: string;
  dorm_id: string | null;
  owner_id: string;
  student_id: string;
  updated_at: string;
  other_user_name?: string;
  dorm_name?: string;
  last_message?: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read?: boolean;
};

type TypingStatus = {
  userId: string;
  conversationId: string;
  typing?: boolean;
};

export default function Messages() {
  const { loading: authLoading, userId } = useAuthGuard();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!userId) return;
    loadConversations();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const newMessage = payload.new as Message;
        if (newMessage.conversation_id === selectedConversation) {
          setMessages(prev => [...prev, newMessage]);
          // Mark as read if sender is not current user
          if (newMessage.sender_id !== userId) {
            markAsRead(newMessage.id);
          }
        }
      })
      .subscribe();

    // Subscribe to typing indicators using presence
    const presenceChannel = supabase.channel('typing-presence', {
      config: { presence: { key: userId } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typingSet = new Set<string>();
        Object.entries(state).forEach(([key, presences]) => {
          const presence = presences[0] as TypingStatus;
          if (presence?.conversationId === selectedConversation && presence?.userId !== userId) {
            typingSet.add(presence.userId);
          }
        });
        setTypingUsers(typingSet);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [userId, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);
  };

  const handleTyping = () => {
    if (!selectedConversation || !userId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Track presence for typing
    const channel = supabase.channel('typing-presence');
    channel.track({
      userId,
      conversationId: selectedConversation,
      typing: true
    });

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      channel.untrack();
    }, 2000);
  };

  const loadConversations = async () => {
    if (!userId) return;

    // Get user role
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: owner } = await supabase
      .from('owners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let query = supabase.from('conversations').select('*').order('updated_at', { ascending: false });

    if (student) {
      query = query.eq('student_id', student.id);
    } else if (owner) {
      query = query.eq('owner_id', owner.id);
    } else {
      return;
    }

    const { data } = await query;
    if (data) {
      // Enrich with dorm and user names
      const enriched = await Promise.all(data.map(async (conv) => {
        const { data: dorm } = await supabase
          .from('dorms')
          .select('dorm_name, name')
          .eq('id', conv.dorm_id || '')
          .maybeSingle();

        let otherUserName = 'User';
        if (student) {
          const { data: ownerData } = await supabase
            .from('owners')
            .select('full_name')
            .eq('id', conv.owner_id)
            .maybeSingle();
          otherUserName = ownerData?.full_name || 'Owner';
        } else {
          const { data: studentData } = await supabase
            .from('students')
            .select('full_name')
            .eq('id', conv.student_id)
            .maybeSingle();
          otherUserName = studentData?.full_name || 'Student';
        }

        // Get last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('body')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...conv,
          other_user_name: otherUserName,
          dorm_name: dorm?.dorm_name || dorm?.name || 'Dorm',
          last_message: lastMsg?.body
        };
      }));
      setConversations(enriched);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      // Mark all as read
      const unreadIds = data.filter(m => m.sender_id !== userId && !m.read).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadIds);
      }
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !userId) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation,
        sender_id: userId,
        body: messageInput.trim(),
      });

      if (error) throw error;

      setMessageInput('');
      
      // Stop typing indicator
      const channel = supabase.channel('typing-presence');
      channel.untrack();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-0 md:px-4 py-0 md:py-8 mt-16 md:mt-20 mb-16 md:mb-0">
        <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-12rem)] flex flex-col md:flex-row gap-0 md:gap-4">
          {/* Conversations List */}
          <Card className={`${isMobile && selectedConversation ? 'hidden' : 'flex'} flex-col w-full md:w-80 rounded-none md:rounded-lg border-0 md:border`}>
            <div className="p-4 border-b border-border">
              <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Messages
              </h2>
            </div>
            <ScrollArea className="flex-1">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-foreground/60">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Start chatting about dorms to see conversations here</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadMessages(conv.id)}
                    className={`w-full p-4 border-b border-border hover:bg-muted/50 transition-colors text-left ${
                      selectedConversation === conv.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {conv.other_user_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{conv.other_user_name}</p>
                        <p className="text-xs text-foreground/60 truncate">{conv.dorm_name}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </Card>

          {/* Chat Window */}
          <Card className={`${isMobile && !selectedConversation ? 'hidden' : 'flex'} flex-col flex-1 rounded-none md:rounded-lg border-0 md:border`}>
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-border flex items-center gap-2">
                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}>
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {conversations.find(c => c.id === selectedConversation)?.other_user_name}
                    </h3>
                    <p className="text-xs text-foreground/60">
                      {conversations.find(c => c.id === selectedConversation)?.dorm_name}
                    </p>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2 ${
                            msg.sender_id === userId
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm">{msg.body}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      disabled={sending}
                    />
                    <Button onClick={sendMessage} disabled={sending || !messageInput.trim()} size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-foreground/60">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>

      {isMobile && <BottomNav />}
    </div>
  );
}
