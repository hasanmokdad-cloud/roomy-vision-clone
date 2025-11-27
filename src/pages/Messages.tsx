import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, MessageSquare, Check, CheckCheck, Paperclip, Mic, Loader2, Pin, BellOff, Archive } from 'lucide-react';
import { ConversationContextMenu } from '@/components/messages/ConversationContextMenu';
import { VoiceRecordingOverlay } from '@/components/messages/VoiceRecordingOverlay';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import BottomNav from '@/components/BottomNav';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { subscribeTo, unsubscribeFrom } from '@/lib/supabaseRealtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Conversation = {
  id: string;
  dorm_id: string | null;
  owner_id: string | null;
  student_id: string;
  conversation_type?: string;
  updated_at: string;
  other_user_name?: string;
  dorm_name?: string;
  last_message?: string;
  other_user_photo?: string | null;
  unreadCount?: number;
  is_pinned?: boolean;
  is_archived?: boolean;
  muted_until?: string | null;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read?: boolean;
  status?: 'sent' | 'delivered' | 'seen';
  delivered_at?: string | null;
  seen_at?: string | null;
  attachment_type?: 'image' | 'video' | 'audio' | null;
  attachment_url?: string | null;
  attachment_duration?: number | null;
  attachment_metadata?: {
    type?: 'room_inquiry' | string;
    roomId?: string;
    roomName?: string;
    roomType?: string;
    price?: number;
    deposit?: number;
    dormId?: string;
    dormName?: string;
  } | null;
};

type TypingStatus = {
  userId: string;
  conversationId: string;
  typing?: boolean;
};

// Format message body to handle old contact form submissions
const formatMessageBody = (msg: Message): string => {
  if (!msg.body) return '';
  
  // Detect old contact form format
  if (msg.body.includes('**Contact Form Submission**')) {
    const messageMatch = msg.body.match(/\*\*Message:\*\*\s*(.+)$/s);
    if (messageMatch) {
      return messageMatch[1].trim();
    }
  }
  
  return msg.body;
};

const MessageStatusIcon = ({ status }: { status?: 'sent' | 'delivered' | 'seen' }) => {
  switch (status) {
    case 'sent':
      return <Check className="w-3 h-3 text-muted-foreground" />;
    case 'delivered':
      return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
    case 'seen':
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    default:
      return null;
  }
};

const AudioPlayer = ({ url }: { url: string }) => {
  const [audioError, setAudioError] = useState(false);

  if (audioError) {
    return (
      <div className="flex items-center gap-2 text-xs opacity-70">
        <span>Audio unavailable</span>
        <a href={url} download className="underline hover:text-primary">
          Download
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
      <audio 
        controls 
        src={url} 
        className="w-48"
        onError={() => setAudioError(true)}
      />
    </div>
  );
};

const RoomPreviewCard = ({ metadata }: { metadata: Message['attachment_metadata'] }) => {
  const navigate = useNavigate();
  
  if (!metadata || metadata.type !== 'room_inquiry') return null;

  return (
    <Card className="mt-2 max-w-xs bg-card/50 backdrop-blur-sm border-primary/20">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{metadata.roomName}</h4>
            <p className="text-xs text-muted-foreground truncate">{metadata.dormName}</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="font-bold text-sm text-primary">${metadata.price}/mo</span>
            {metadata.deposit && (
              <span className="text-xs text-muted-foreground">${metadata.deposit} deposit</span>
            )}
          </div>
        </div>
        
        {metadata.roomType && (
          <div className="text-xs">
            <span className="text-muted-foreground">Type: </span>
            <span className="font-medium">{metadata.roomType}</span>
          </div>
        )}
        
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            if (metadata.dormId) {
              navigate(`/dorm/${metadata.dormId}`);
            }
          }}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default function Messages() {
  const { loading: authLoading, userId } = useAuthGuard();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { setHideBottomNav } = useBottomNav();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [shouldUploadVoice, setShouldUploadVoice] = useState(true);
  const [slideOffset, setSlideOffset] = useState({ x: 0, y: 0 });
  const [isLocked, setIsLocked] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartTimeRef = useRef<number>(0);
  const touchStartPosRef = useRef({ x: 0, y: 0 });

  // Debug log for cache verification
  useEffect(() => {
    console.log('[Messages] Component mounted - version 3.0 with typing & status');
  }, []);

  // Handle auto-open from navigation state
  useEffect(() => {
    if (!userId) return;

    // Check for pre-selected conversation from navigation state (e.g., from admin inbox)
    if (location.state?.selectedConversationId) {
      setSelectedConversation(location.state.selectedConversationId);
      loadMessages(location.state.selectedConversationId);
      // Clear state
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    // Handle auto-open conversation with room preview (from Contact button)
    if (location.state?.openConversationId) {
      const openConversationWithPreview = async () => {
        const conversationId = location.state.openConversationId;
        const roomPreview = location.state.roomPreview;

        setSelectedConversation(conversationId);
        await loadMessages(conversationId);

        // Send initial message with room metadata if provided
        if (roomPreview) {
          const messageText = `Hi, I'm interested in the ${roomPreview.roomType} at ${roomPreview.dormName}. Is it still available?`;
          
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: userId,
            body: messageText,
            read: false,
            status: 'sent',
            attachment_metadata: {
              type: 'room_inquiry',
              ...roomPreview
            }
          });
        }

        // Clear location state
        navigate(location.pathname, { replace: true, state: {} });
      };

      openConversationWithPreview();
      return;
    }

    // Handle auto-open/auto-send from match links or Contact button
    if (location.state?.openThreadWithUserId) {
      const openAndSendMessage = async () => {
        const targetUserId = location.state.openThreadWithUserId;
        const initialMessage = location.state.initialMessage || 'Hi there!';
        const roomPreview = location.state.roomPreview;

        console.log('🎯 Opening conversation with:', { 
          targetUserId, 
          currentUserId: userId,
          hasRoomPreview: !!roomPreview 
        });

        // Get current user's student profile
        console.log('📋 Fetching student profile for user_id:', userId);
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        console.log('📋 Student query result:', { student, studentError });

        if (!student) {
          console.error('❌ No student profile found for user:', userId);
          toast({
            title: 'Error',
            description: 'Could not find your student profile',
            variant: 'destructive'
          });
          return;
        }

        let conversationId: string | null = null;

        // Check if target is an owner
        console.log('🔍 Checking if target is an owner:', targetUserId);
        const { data: targetOwner, error: ownerError } = await supabase
          .from('owners')
          .select('id')
          .eq('user_id', targetUserId)
          .maybeSingle();

        console.log('🔍 Owner query result:', { targetOwner, ownerError });

        if (targetOwner) {
          // Student → Owner conversation
          console.log('🔍 Checking for existing conversation between student:', student.id, 'and owner:', targetOwner.id);
          
          const { data: existingConv, error: convCheckError } = await supabase
            .from('conversations')
            .select('id')
            .eq('student_id', student.id)
            .eq('owner_id', targetOwner.id)
            .maybeSingle();

          if (convCheckError) {
            console.error('❌ Error checking conversation:', convCheckError);
            toast({
              title: 'Error',
              description: 'Failed to check existing conversation',
              variant: 'destructive'
            });
            navigate(location.pathname, { replace: true, state: {} });
            return;
          }

          if (existingConv) {
            conversationId = existingConv.id;
            console.log('✅ Found existing conversation:', conversationId);
          } else {
            // Create new student-owner conversation
            console.log('📝 Creating new conversation with data:', {
              student_id: student.id,
              owner_id: targetOwner.id,
              user_a_id: userId,
              user_b_id: targetUserId,
              dorm_id: roomPreview?.dormId || null
            });
            
            const { data: newConv, error: createError } = await supabase
              .from('conversations')
              .insert({
                student_id: student.id,
                owner_id: targetOwner.id,
                user_a_id: userId,              // Current user's auth.uid()
                user_b_id: targetUserId,        // Target owner's auth.uid()
                dorm_id: roomPreview?.dormId || null,
                conversation_type: 'dorm'
              })
              .select('id')
              .single();

            if (createError) {
              console.error('❌ Error creating conversation:', {
                error: createError,
                code: createError.code,
                message: createError.message,
                details: createError.details,
                hint: createError.hint
              });
              toast({
                title: 'Error',
                description: 'Failed to create conversation with owner',
                variant: 'destructive'
              });
              navigate(location.pathname, { replace: true, state: {} });
              return;
            }
            
            if (newConv) {
              conversationId = newConv.id;
              console.log('✅ Created new conversation:', conversationId);
              
              // Reload conversations list to show the new conversation
              console.log('🔄 Reloading conversations list...');
              await loadConversations();
              console.log('✅ Conversations reloaded');
              
              // Wait for UI to update, then select the conversation
              setTimeout(() => {
                console.log('🎯 Setting active conversation:', conversationId);
                setSelectedConversation(conversationId);
              }, 300);
            }
          }
        } else {
          // Check if target is a student (roommate matching)
          const { data: targetStudent } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', targetUserId)
            .maybeSingle();

          if (!targetStudent) return;

          // Student → Student conversation
          const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .or(`and(student_id.eq.${student.id},owner_id.eq.${targetStudent.id}),and(student_id.eq.${targetStudent.id},owner_id.eq.${student.id})`)
            .maybeSingle();

          if (existingConv) {
            conversationId = existingConv.id;
          } else {
            // Create new conversation (treating as peer-to-peer)
            const { data: newConv } = await supabase
              .from('conversations')
              .insert({
                student_id: student.id,
                owner_id: targetStudent.id,
                dorm_id: null
              })
              .select('id')
              .single();
            
            if (newConv) conversationId = newConv.id;
          }
        }

        if (conversationId) {
          console.log('📤 Loading conversation and sending initial message');
          setSelectedConversation(conversationId);

          // Send initial message FIRST with room preview metadata if provided
          if (initialMessage) {
            const { data: messageData, error: messageError } = await supabase.from('messages').insert({
              conversation_id: conversationId,
              sender_id: userId,
              body: initialMessage,
              read: false,
              status: 'sent',
              attachment_metadata: roomPreview ? {
                type: 'room_inquiry',
                ...roomPreview
              } : null
            }).select('id').single();

            if (messageError) {
              console.error('❌ Error sending message:', messageError);
              toast({
                title: 'Error',
                description: 'Failed to send initial message',
                variant: 'destructive'
              });
            } else {
              console.log('✅ Message sent successfully:', messageData?.id);
              toast({
                title: 'Success',
                description: 'Conversation started with owner',
              });
            }
          }
          
          // THEN load messages to display them immediately
          await loadMessages(conversationId);
        } else {
          console.error('❌ No conversation ID available');
          toast({
            title: 'Error',
            description: 'Failed to start conversation',
            variant: 'destructive'
          });
        }

        // Clear location state
        navigate(location.pathname, { replace: true, state: {} });
      };

      openAndSendMessage();
    }
  }, [userId, location.state]);

  // Hide bottom nav when in conversation view on mobile (Instagram-style)
  useEffect(() => {
    if (isMobile && selectedConversation) {
      setHideBottomNav(true);
    } else {
      setHideBottomNav(false);
    }
    
    // Cleanup when leaving the page
    return () => setHideBottomNav(false);
  }, [isMobile, selectedConversation, setHideBottomNav]);

  useEffect(() => {
    if (!userId) return;
    loadConversations();

    // Subscribe to new messages using realtime utility
    const messagesChannel = subscribeTo("messages", async (payload) => {
      const newMessage = payload.new as Message;
      
      if (newMessage.conversation_id === selectedConversation) {
        // Only add messages from OTHER users - sender's messages already added optimistically
        if (newMessage.sender_id !== userId) {
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
          
          // Automatically mark as delivered when received
          await supabase
            .from('messages')
            .update({ 
              status: 'delivered',
              delivered_at: new Date().toISOString()
            })
            .eq('id', newMessage.id);
          
          // Mark as seen since conversation is open
          markAsRead(newMessage.id);
        } else {
          // Update the sender's own message status if it was updated
          setMessages(prev =>
            prev.map(m => (m.id === newMessage.id ? { ...m, ...newMessage } : m))
          );
        }
      } else {
        // Message in different conversation, just mark as delivered
        if (newMessage.sender_id !== userId && newMessage.status === 'sent') {
          await supabase
            .from('messages')
            .update({ 
              status: 'delivered',
              delivered_at: new Date().toISOString()
            })
            .eq('id', newMessage.id);
        }
      }
      
      // Reload conversations to update last message & unread counts
      loadConversations();
    });

    // Subscribe to message updates - only update status fields to prevent flickering
    const messagesUpdateChannel = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          
          // Only update if this message belongs to current conversation
          if (updatedMessage.conversation_id === selectedConversation) {
            setMessages(prev =>
              prev.map(m => {
                if (m.id === updatedMessage.id) {
                  // Preserve local state, only update status-related fields
                  return {
                    ...m,
                    status: updatedMessage.status,
                    read: updatedMessage.read,
                    delivered_at: updatedMessage.delivered_at,
                    seen_at: updatedMessage.seen_at,
                  };
                }
                return m;
              })
            );
          }
        }
      )
      .subscribe();

    const conversationsChannel = subscribeTo("conversations", () => {
      loadConversations();
    });

    return () => {
      unsubscribeFrom(messagesChannel);
      supabase.removeChannel(messagesUpdateChannel);
      unsubscribeFrom(conversationsChannel);
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [userId, selectedConversation]);

  // Setup typing presence
  useEffect(() => {
    if (!selectedConversation || !userId) {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      return;
    }

    const channel = supabase.channel(`typing-${selectedConversation}`);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingSet = new Set<string>();
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence) => {
            if (presence.userId !== userId && presence.typing) {
              typingSet.add(presence.userId);
            }
          });
        });
        setTypingUsers(typingSet);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          presenceChannelRef.current = channel;
        }
      });

    return () => {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [selectedConversation, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, [showArchived]);

  const markAsRead = async (messageId: string) => {
    if (!userId || !selectedConversation) return;
    
    await supabase
      .from('messages')
      .update({ 
        read: true,
        status: 'seen',
        seen_at: new Date().toISOString()
      })
      .eq('id', messageId);
    
    // Update user_thread_state to reflect the latest read time
    await supabase.from('user_thread_state').upsert(
      {
        thread_id: selectedConversation,
        user_id: userId,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: 'thread_id,user_id' }
    );
  };

  const handleTyping = () => {
    if (!selectedConversation || !userId || !presenceChannelRef.current) return;

    presenceChannelRef.current.track({
      userId,
      typing: true,
      timestamp: Date.now()
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      presenceChannelRef.current?.untrack();
    }, 2000);
  };

  const loadConversations = async () => {
    if (!userId) return;
    
    console.log('🔄 Loading conversations for user:', userId);

    // Get user role - check admin first
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

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

    console.log('👤 User role:', { admin: !!admin, student: !!student, owner: !!owner });

    let query = supabase.from('conversations').select('*');

    if (admin) {
      // Admins see all support conversations
      query = query.eq('conversation_type', 'support');
    } else {
      // For students and owners: find conversations where user is a participant
      query = query.or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);
    }

    // Filter archived
    if (!showArchived) {
      query = query.or('is_archived.is.null,is_archived.eq.false');
    }

    // Sort pinned first, then by updated_at
    query = query.order('is_pinned', { ascending: false }).order('updated_at', { ascending: false });

    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error loading conversations:', error);
      return;
    }
    
    console.log(`✅ Loaded ${data?.length || 0} conversations`);
    
    if (data) {
      // Enrich with dorm and user names
      const enriched = await Promise.all(data.map(async (conv) => {
        // Phase 1: Explicit dorm query protection - never executes for support conversations
        let dorm = null;
        if (conv.dorm_id && conv.conversation_type !== 'support') {
          const { data: dormData } = await supabase
            .from('dorms')
            .select('dorm_name, name')
            .eq('id', conv.dorm_id)
            .maybeSingle();
          dorm = dormData;
        }

        let otherUserName = 'User';
        let otherUserPhoto: string | null = null;

        // Handle support conversations differently
        if (conv.conversation_type === 'support') {
          if (admin) {
            // Admin sees the other participant (non-admin user)
            const otherUserId = conv.user_a_id === userId ? conv.user_b_id : conv.user_a_id;
            
            // Try to find in students first
            const { data: studentData } = await supabase
              .from('students')
              .select('full_name, profile_photo_url')
              .eq('user_id', otherUserId)
              .maybeSingle();
            
            if (studentData) {
              otherUserName = studentData.full_name || 'Student';
              otherUserPhoto = studentData.profile_photo_url;
            } else {
              // Try owners
              const { data: ownerData } = await supabase
                .from('owners')
                .select('full_name, profile_photo_url')
                .eq('user_id', otherUserId)
                .maybeSingle();
              otherUserName = ownerData?.full_name || 'Owner';
              otherUserPhoto = ownerData?.profile_photo_url;
            }
          } else {
            // User viewing: show "Roomy Support"
            otherUserName = 'Roomy Support';
          }
        } else {
          // Regular dorm conversations
          if (student) {
            if (conv.owner_id) {
              const { data: ownerData } = await supabase
                .from('owners')
                .select('full_name')
                .eq('id', conv.owner_id)
                .maybeSingle();
              otherUserName = ownerData?.full_name || 'Owner';
            } else {
              otherUserName = 'Support';
            }
          } else {
            const { data: studentData } = await supabase
              .from('students')
              .select('full_name, profile_photo_url')
              .eq('id', conv.student_id)
              .maybeSingle();
            otherUserName = studentData?.full_name || 'Student';
            otherUserPhoto = studentData?.profile_photo_url || null;
          }
        }

        // Get last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('body, attachment_type')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count from user_thread_state
        const { data: threadState } = await supabase
          .from('user_thread_state')
          .select('last_read_at')
          .eq('thread_id', conv.id)
          .eq('user_id', userId!)
          .maybeSingle();

        let unreadCount = 0;
        if (threadState?.last_read_at) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', userId!)
            .gt('created_at', threadState.last_read_at);
          unreadCount = count || 0;
        } else {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', userId!);
          unreadCount = count || 0;
        }

        // Format last message preview with emojis
        let lastMessage = '';
        if (lastMsg) {
          if (lastMsg.attachment_type === 'audio') {
            lastMessage = '🎤 Voice message';
          } else if (lastMsg.attachment_type === 'image') {
            lastMessage = '📷 Photo';
          } else if (lastMsg.attachment_type === 'video') {
            lastMessage = '🎥 Video';
          } else {
            lastMessage = lastMsg.body?.substring(0, 50) || '';
          }
        }

        return {
          ...conv,
          other_user_name: otherUserName,
          other_user_photo: otherUserPhoto,
          dorm_name: dorm?.dorm_name || dorm?.name || (conv.conversation_type === 'support' ? 'Support' : 'Dorm'),
          last_message: lastMessage,
          unreadCount
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
      setMessages(data as Message[]);
      
      // Mark all unseen messages as seen
      const unseenIds = data.filter(m => m.sender_id !== userId && m.status !== 'seen').map(m => m.id);
      if (unseenIds.length > 0) {
        await supabase
          .from('messages')
          .update({ 
            read: true,
            status: 'seen',
            seen_at: new Date().toISOString()
          })
          .in('id', unseenIds);
      }

      // Update user_thread_state
      if (userId) {
        await supabase.from('user_thread_state').upsert(
          {
            thread_id: conversationId,
            user_id: userId,
            last_read_at: new Date().toISOString(),
          },
          { onConflict: 'thread_id,user_id' }
        );
        loadConversations();
      }
    }
  };

  const handleAutoMessage = async () => {
    const { openThreadWithUserId, initialMessage, matchProfile } = location.state || {};
    if (!openThreadWithUserId || !initialMessage || !userId) return;

    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: targetStudent } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', openThreadWithUserId)
        .maybeSingle();

      if (!student || !targetStudent) {
        toast({
          title: "Error",
          description: "Could not initiate conversation",
          variant: "destructive",
        });
        return;
      }

      let conversationId = selectedConversation;
      if (!conversationId) {
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .or(`student_id.eq.${student.id},student_id.eq.${targetStudent.id}`)
          .maybeSingle();

        if (existingConv) {
          conversationId = existingConv.id;
          setSelectedConversation(conversationId);
        } else {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              student_id: student.id,
              owner_id: targetStudent.id,
            })
            .select()
            .single();

          if (newConv) {
            conversationId = newConv.id;
            setSelectedConversation(conversationId);
          }
        }
      }

      if (conversationId) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: userId,
          body: initialMessage,
          status: 'sent',
        });

        await loadMessages(conversationId);
        await loadConversations();
      }
    } catch (error: any) {
      console.error("Auto-message error:", error);
      toast({
        title: "Error",
        description: "Failed to send automatic message",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation || !userId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('message-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('message-media')
        .getPublicUrl(filePath);

      const attachmentType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : null;

      await supabase.from('messages').insert({
        conversation_id: selectedConversation,
        sender_id: userId,
        body: '',
        attachment_type: attachmentType,
        attachment_url: publicUrl,
        status: 'sent',
      });

      toast({ title: 'File sent successfully' });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Detect iOS Safari
  const isIOSSafari = () => {
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const webkit = /WebKit/.test(ua);
    return iOS && webkit && !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
  };

  // Enhanced format detection for better iOS compatibility
  const getSupportedMimeType = () => {
    // iOS Safari prefers mp4 with AAC codec
    if (isIOSSafari()) {
      if (MediaRecorder.isTypeSupported('audio/mp4;codecs=mp4a.40.2')) {
        return 'audio/mp4;codecs=mp4a.40.2';
      }
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        return 'audio/mp4';
      }
      return undefined; // Let browser choose default
    }
    
    // Other browsers prefer WebM
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      return 'audio/webm;codecs=opus';
    }
    if (MediaRecorder.isTypeSupported('audio/webm')) {
      return 'audio/webm';
    }
    if (MediaRecorder.isTypeSupported('audio/mp4')) {
      return 'audio/mp4';
    }
    
    return undefined; // Let browser choose
  };

  const startRecording = async () => {
    // Prevent multiple recordings
    if (isRecordingActive || recording) {
      console.log('Recording already in progress, skipping...');
      return;
    }

    try {
      setIsRecordingActive(true);
      setShouldUploadVoice(true); // Reset flag for new recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = getSupportedMimeType();
      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream); // Use browser default
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecordingActive(false);
        
        // Only upload if not cancelled
        if (shouldUploadVoice && audioChunksRef.current.length > 0) {
          const actualMimeType = mimeType || mediaRecorder.mimeType;
          const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
          
          if (audioBlob.size > 0) {
            // Calculate duration from actual recording time
            const duration = Math.max(1, Math.ceil((Date.now() - recordingStartTime) / 1000));
            await uploadVoiceMessage(audioBlob, duration);
          } else {
            toast({
              title: 'Recording error',
              description: 'No audio data captured',
              variant: 'destructive',
            });
          }
        }
        
        stream.getTracks().forEach((track) => track.stop());
        audioChunksRef.current = [];
        
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
        setRecordingDuration(0);
      };

      mediaRecorder.start(100);
      setRecording(true);
      setRecordingStartTime(Date.now());
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Recording error:', error);
      setIsRecordingActive(false);
      toast({
        title: 'Microphone access denied',
        description: 'Please allow microphone access',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const handleVoiceButtonClick = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleVoiceTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple starts
    if (recording || isRecordingActive) {
      console.log('Already recording, ignoring touch start');
      return;
    }
    
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    touchStartTimeRef.current = Date.now();
    setShouldUploadVoice(true);
    setSlideOffset({ x: 0, y: 0 });
    setIsLocked(false);
    startRecording();
  };

  const handleVoiceTouchMove = (e: React.TouchEvent) => {
    if (!recording || isLocked) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartPosRef.current.x;
    const deltaY = touch.clientY - touchStartPosRef.current.y;

    setSlideOffset({ x: deltaX, y: deltaY });
  };

  const handleVoiceTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ignore if not recording
    if (!recording && !isRecordingActive) {
      return;
    }
    
    const touchDuration = Date.now() - touchStartTimeRef.current;

    // Check if slid up to lock
    if (slideOffset.y < -80 && !isLocked) {
      setIsLocked(true);
      setSlideOffset({ x: 0, y: 0 });
      toast({ title: 'Recording locked', description: 'Tap stop when done' });
      return;
    }

    // Check if slid left to cancel
    if (slideOffset.x < -100) {
      // Cancel recording
      setShouldUploadVoice(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setRecording(false);
      setIsRecordingActive(false);
      setIsLocked(false);
      setSlideOffset({ x: 0, y: 0 });
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      toast({ 
        title: 'Recording cancelled', 
        description: 'Voice message deleted',
        duration: 2000
      });
      return;
    }
    
    if (touchDuration < 500) {
      // Too short - cancel
      setShouldUploadVoice(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setRecording(false);
      setIsRecordingActive(false);
      setIsLocked(false);
      setSlideOffset({ x: 0, y: 0 });
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      toast({ 
        title: 'Recording cancelled', 
        description: 'Hold the button longer to record',
        duration: 2000
      });
    } else if (!isLocked) {
      // Stop and upload
      setSlideOffset({ x: 0, y: 0 });
      stopRecording();
    }
  };

  const cancelRecording = () => {
    setShouldUploadVoice(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setIsRecordingActive(false);
    setIsLocked(false);
    setSlideOffset({ x: 0, y: 0 });
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    toast({ title: 'Recording cancelled' });
  };

  const handleStopLockedRecording = () => {
    setIsLocked(false);
    setSlideOffset({ x: 0, y: 0 });
    stopRecording();
  };

  const uploadVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!selectedConversation || !userId) return;

    const tempId = crypto.randomUUID();
    
    // Create optimistic message with uploading state
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: selectedConversation,
      sender_id: userId,
      body: null,
      created_at: new Date().toISOString(),
      attachment_type: 'audio',
      attachment_url: '', // Will be filled after upload
      attachment_duration: duration,
      status: 'sent',
    };
    
    // Add optimistically for instant display
    setMessages(prev => [...prev, optimisticMessage]);
    setUploadProgress(10);

    try {
      const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const fileName = `voice-${Date.now()}.${extension}`;
      const filePath = `${userId}/${fileName}`;

      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from('message-media')
        .upload(filePath, audioBlob, {
          contentType: audioBlob.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      const { data: { publicUrl } } = supabase.storage
        .from('message-media')
        .getPublicUrl(filePath);

      setUploadProgress(80);

      const { data, error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation,
        sender_id: userId,
        body: null,
        attachment_type: 'audio',
        attachment_url: publicUrl,
        attachment_duration: duration,
        attachment_metadata: { mimeType: audioBlob.type },
        status: 'sent',
      }).select().single();

      if (error) throw error;

      setUploadProgress(100);

      // Replace temp message with real one
      if (data) {
        setMessages(prev => 
          prev.map(m => m.id === tempId ? data as Message : m)
        );
      }

      toast({ title: 'Voice message sent' });
    } catch (error: any) {
      console.error('Voice message upload error:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadProgress(0);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !userId) return;

    setSending(true);
    const tempId = crypto.randomUUID();
    const messageText = messageInput.trim();
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: selectedConversation,
      sender_id: userId,
      body: messageText,
      created_at: new Date().toISOString(),
      status: 'sent',
      read: false
    };
    
    // Add optimistically for instant feedback
    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');
    
    try {
      // Stop typing indicator
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (presenceChannelRef.current) {
        presenceChannelRef.current.untrack();
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: userId,
          body: messageText,
          status: 'sent',
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        // Replace temp message with real one
        setMessages(prev => 
          prev.map(m => m.id === tempId ? data as Message : m)
        );
      }
    } catch (error: any) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessageInput(messageText); // Restore input
      
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const renderMessageContent = (msg: Message) => {
    // Room preview card if present
    if (msg.attachment_metadata?.type === 'room_inquiry') {
      return (
        <>
          <p className="text-sm whitespace-pre-wrap break-words">{formatMessageBody(msg)}</p>
          <RoomPreviewCard metadata={msg.attachment_metadata} />
        </>
      );
    }

    if (msg.attachment_type === 'image') {
      return (
        <img
          src={msg.attachment_url || ''}
          alt="Shared image"
          className="max-w-xs rounded-lg cursor-pointer"
          onClick={() => window.open(msg.attachment_url, '_blank')}
        />
      );
    }

    if (msg.attachment_type === 'video') {
      return <video src={msg.attachment_url || ''} controls className="max-w-xs rounded-lg" />;
    }

    if (msg.attachment_type === 'audio') {
      return <AudioPlayer url={msg.attachment_url || ''} />;
    }

    return <p className="text-sm whitespace-pre-wrap break-words">{formatMessageBody(msg)}</p>;
  };

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hide Navbar on mobile, show on desktop */}
      {!isMobile && <Navbar />}
      
      <main 
        className={`flex-1 container mx-auto px-0 md:px-4 py-0 md:py-8 ${isMobile ? 'pt-0 pb-20' : 'mt-20 mb-0'}`}
        style={isMobile ? { 
          paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))'
        } : undefined}
      >
        <div className={`${isMobile ? 'h-screen' : 'h-[calc(100vh-12rem)]'} flex flex-col md:flex-row gap-0 md:gap-4`}>
          {/* Conversations List */}
          <Card className={`${isMobile && selectedConversation ? 'hidden' : 'flex'} flex-col w-full md:w-80 rounded-none md:rounded-lg border-0 md:border shadow-none md:shadow-sm`}>
            <div className={`p-4 border-b border-border ${isMobile ? 'pt-6' : ''}`}>
              <div className="flex items-center justify-between w-full">
                <h2 className={`${isMobile ? 'text-3xl' : 'text-2xl'} font-bold flex items-center gap-2`}>
                  <MessageSquare className="w-6 h-6" />
                  Messages
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  {showArchived ? 'Hide' : 'Archived'}
                </Button>
              </div>
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
                  <div key={conv.id} className="relative group">
                    <button
                      onClick={() => {
                        setSelectedConversation(conv.id);
                        loadMessages(conv.id);
                      }}
                      className={`w-full p-4 border-b border-border hover:bg-muted/50 transition-colors text-left ${
                        selectedConversation === conv.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={conv.other_user_photo || undefined} alt={conv.other_user_name} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {conv.other_user_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              {conv.is_pinned && <Pin className="w-3 h-3 text-primary" />}
                              {conv.muted_until && new Date(conv.muted_until) > new Date() && (
                                <BellOff className="w-3 h-3 text-muted-foreground" />
                              )}
                              <p className="font-semibold text-sm truncate">{conv.other_user_name}</p>
                            </div>
                            {conv.unreadCount > 0 && (!conv.muted_until || new Date(conv.muted_until) <= new Date()) && (
                              <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-primary-foreground bg-primary rounded-full shrink-0">
                                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-foreground/60 truncate">{conv.last_message}</p>
                          <p className="text-xs text-foreground/60 truncate">{conv.dorm_name}</p>
                        </div>
                      </div>
                    </button>
              <div className="absolute top-2 right-2">
                <ConversationContextMenu
                  conversationId={conv.id}
                  isPinned={conv.is_pinned || false}
                  isArchived={conv.is_archived || false}
                  mutedUntil={conv.muted_until || null}
                  onUpdate={() => loadConversations()}
                />
              </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </Card>

          {/* Chat Window */}
          <Card className={`${isMobile && !selectedConversation ? 'hidden' : 'flex'} flex-col flex-1 rounded-none md:rounded-lg border-0 md:border shadow-none md:shadow-sm`}>
            {selectedConversation ? (
              <>
                {/* Instagram-style conversation header */}
                <div className={`${isMobile ? 'p-3' : 'p-4'} border-b border-border flex items-center gap-3 bg-background`}>
                  {isMobile && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSelectedConversation(null)}
                      className="shrink-0"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage 
                      src={conversations.find(c => c.id === selectedConversation)?.other_user_photo || undefined} 
                      alt="User" 
                    />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {conversations.find(c => c.id === selectedConversation)?.other_user_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {conversations.find(c => c.id === selectedConversation)?.other_user_name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {conversations.find(c => c.id === selectedConversation)?.dorm_name}
                    </p>
                  </div>
                </div>

                <ScrollArea className={`flex-1 p-4 ${isMobile ? 'pb-32' : ''}`}>
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
                          {renderMessageContent(msg)}
                          <div className="flex items-center gap-1 text-xs opacity-70 mt-1">
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                    {msg.sender_id === userId && (
                      <span className="ml-1">
                        <MessageStatusIcon status={msg.status || 'sent'} />
                      </span>
                    )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing indicator */}
                    {typingUsers.size > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl px-4 py-3 text-foreground/60 italic text-sm">
                          Typing...
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div 
                  className={`${isMobile ? 'p-3 fixed bottom-0 left-0 right-0 bg-background z-10' : 'p-4'} border-t border-border`}
                  style={isMobile ? { 
                    paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))'
                  } : undefined}
                >
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mb-2">
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* WhatsApp-style input layout */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || recording}
                      aria-label="Attach image or video"
                      title="Attach image or video"
                    >
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Paperclip className="w-5 h-5" />
                      )}
                    </Button>

                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      disabled={sending || recording}
                      className="flex-1"
                      aria-label="Message input"
                    />

                    {/* Dynamic button: Mic when empty, Send when typing */}
                    {messageInput.trim() ? (
                      <Button 
                        onClick={sendMessage} 
                        disabled={sending} 
                        size="icon"
                        aria-label="Send message"
                        title="Send message"
                        className="shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={isMobile ? undefined : handleVoiceButtonClick}
                        onTouchStart={isMobile ? handleVoiceTouchStart : undefined}
                        onTouchMove={isMobile ? handleVoiceTouchMove : undefined}
                        onTouchEnd={isMobile ? handleVoiceTouchEnd : undefined}
                        className="shrink-0"
                        aria-label="Record voice message"
                        title={isMobile ? "Hold to record voice message" : "Click to record voice message"}
                      >
                        <Mic className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Voice Recording Overlay */}
                <VoiceRecordingOverlay
                  isRecording={recording}
                  duration={recordingDuration}
                  isLocked={isLocked}
                  slideOffset={slideOffset}
                  onCancel={cancelRecording}
                  onStop={handleStopLockedRecording}
                />
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
