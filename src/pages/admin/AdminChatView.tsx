import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Building2, Home, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { TourMessageCard } from '@/components/messages/TourMessageCard';

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  attachment_type?: string | null;
  attachment_url?: string | null;
  attachment_metadata?: any;
};

type ConversationDetails = {
  id: string;
  student_id: string;
  owner_id: string | null;
  dorm_id: string | null;
  student: any;
  owner: any | null;
  dorm: any | null;
};

type Booking = {
  id: string;
  requested_date: string;
  requested_time: string;
  status: string;
  meeting_link: string | null;
  meeting_platform: string | null;
  decline_reason: string | null;
  created_at: string;
};

export default function AdminChatView() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { loading } = useRoleGuard('admin');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      loadConversationData();
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversationData = async () => {
    if (!conversationId) return;
    setLoadingData(true);

    try {
      // Fetch conversation details
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id, student_id, owner_id, dorm_id')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Fetch student details
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', convData.student_id)
        .single();

      // Fetch owner details if exists
      let owner = null;
      if (convData.owner_id) {
        const { data: ownerData } = await supabase
          .from('owners')
          .select('*')
          .eq('id', convData.owner_id)
          .single();
        owner = ownerData;
      }

      // Fetch dorm details if exists
      let dorm = null;
      if (convData.dorm_id) {
        const { data: dormData } = await supabase
          .from('dorms')
          .select('*')
          .eq('id', convData.dorm_id)
          .single();
        dorm = dormData;
      }

      setConversation({
        ...convData,
        student,
        owner,
        dorm,
      });

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Fetch bookings related to this conversation
      if (convData.dorm_id && convData.owner_id && convData.student_id) {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*')
          .eq('dorm_id', convData.dorm_id)
          .eq('owner_id', convData.owner_id)
          .eq('student_id', convData.student_id)
          .order('created_at', { ascending: false });

        setBookings(bookingsData || []);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const renderMessage = (msg: Message, isCurrentUser: boolean) => {
    const isTourMessage = msg.attachment_metadata?.type === 'tour_booking';

    if (isTourMessage) {
      return (
        <TourMessageCard
          metadata={msg.attachment_metadata}
          message={{
            id: msg.id,
            body: msg.body || '',
            created_at: msg.created_at,
            sender_id: msg.sender_id,
          }}
        />
      );
    }

    return (
      <div
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3`}
      >
        <div
          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
            isCurrentUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          }`}
        >
          {msg.attachment_type === 'audio' && msg.attachment_url ? (
            <audio controls src={msg.attachment_url} className="w-48" />
          ) : (
            <p className="text-sm break-words">{msg.body}</p>
          )}
          <p
            className={`text-xs mt-1 ${
              isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            }`}
          >
            {format(new Date(msg.created_at), 'HH:mm')}
          </p>
        </div>
      </div>
    );
  };

  if (loading || loadingData || !conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <p className="text-foreground/60">Loading conversation...</p>
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/chats')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={conversation.student?.profile_photo_url || undefined} />
              <AvatarFallback>{conversation.student?.full_name?.charAt(0) || 'S'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">
                {conversation.student?.full_name || 'Student'}
              </h2>
              {conversation.dorm && (
                <p className="text-xs text-muted-foreground">
                  {conversation.dorm.name || conversation.dorm.dorm_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat History - 70% on large screens */}
          <div className="lg:col-span-2">
            <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle>Conversation History (Read-Only)</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No messages in this conversation
                    </p>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isStudentMessage = msg.sender_id === conversation.student?.user_id;
                        return (
                          <div key={msg.id}>
                            {renderMessage(msg, isStudentMessage)}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Metadata Sidebar - 30% on large screens */}
          <div className="space-y-4">
            {/* Student Profile */}
            <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Student Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={conversation.student?.profile_photo_url || undefined} />
                    <AvatarFallback>
                      {conversation.student?.full_name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{conversation.student?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{conversation.student?.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{' '}
                    <span className="font-medium">
                      {conversation.student?.phone_number || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">University:</span>{' '}
                    <span className="font-medium">
                      {conversation.student?.university || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget:</span>{' '}
                    <span className="font-medium">
                      ${conversation.student?.budget || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gender:</span>{' '}
                    <span className="font-medium">
                      {conversation.student?.gender || 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner Profile */}
            {conversation.owner && (
              <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Owner Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={conversation.owner?.profile_photo_url || undefined} />
                      <AvatarFallback>
                        {conversation.owner?.full_name?.charAt(0) || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{conversation.owner?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{conversation.owner?.email}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Phone:</span>{' '}
                      <span className="font-medium">
                        {conversation.owner?.phone_number || 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dorm Details */}
            {conversation.dorm && (
              <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Dorm Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold text-lg">
                      {conversation.dorm.name || conversation.dorm.dorm_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{conversation.dorm.address}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Price:</span>{' '}
                      <span className="font-semibold text-primary">
                        ${conversation.dorm.monthly_price || conversation.dorm.price}/mo
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{' '}
                      <Badge
                        variant={
                          conversation.dorm.verification_status === 'Verified'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {conversation.dorm.verification_status || 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tour Bookings */}
            {bookings.length > 0 && (
              <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Tour Booking Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="mt-1">
                          {booking.status === 'approved' && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                          {booking.status === 'declined' && (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          {booking.status === 'pending' && (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">
                            {format(new Date(booking.requested_date), 'MMM dd, yyyy')} at{' '}
                            {booking.requested_time}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {booking.status}
                          </Badge>
                          {booking.meeting_link && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {booking.meeting_platform}: {booking.meeting_link}
                            </p>
                          )}
                          {booking.decline_reason && (
                            <p className="text-xs text-red-500 mt-1">{booking.decline_reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
