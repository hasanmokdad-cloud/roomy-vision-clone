import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, MessageSquare, Check, CheckCheck, Paperclip, Mic, Loader2, Pin, BellOff, Archive } from 'lucide-react';
import { ConversationContextMenu } from '@/components/messages/ConversationContextMenu';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import BottomNav from '@/components/BottomNav';
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
};

type TypingStatus = {
  userId: string;
  conversationId: string;
  typing?: boolean;
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

export default function Messages() {
  const { loading: authLoading, userId } = useAuthGuard();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Handle auto-open/auto-send from match links
    if (location.state?.openThreadWithUserId) {
      const openAndSendMessage = async () => {
        const targetUserId = location.state.openThreadWithUserId;
        const initialMessage = location.state.initialMessage;

        // Find or create conversation
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        const { data: targetStudent } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (!student || !targetStudent) return;

        // Check if conversation exists
        let conversationId: string | null = null;
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(student_id.eq.${student.id},owner_id.eq.${targetStudent.id}),and(student_id.eq.${targetStudent.id},owner_id.eq.${student.id})`)
          .maybeSingle();

        if (existingConv) {
          conversationId = existingConv.id;
        } else {
          // Create new conversation (treating both as students, use a placeholder for owner_id)
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              student_id: student.id,
              owner_id: targetStudent.id, // Using as peer
              dorm_id: null
            })
            .select('id')
            .single();
          
          if (newConv) conversationId = newConv.id;
        }

        if (conversationId) {
          setSelectedConversation(conversationId);
          await loadMessages(conversationId);

          // Send initial message if provided
          if (initialMessage) {
            await supabase.from('messages').insert({
              conversation_id: conversationId,
              sender_id: userId,
              body: initialMessage,
              read: false,
              status: 'sent',
            });
          }
        }

        // Clear location state
        navigate(location.pathname, { replace: true, state: {} });
      };

      openAndSendMessage();
    }
  }, [userId, location.state]);

  useEffect(() => {
    if (!userId) return;
    loadConversations();

    // Subscribe to new messages using realtime utility
    const messagesChannel = subscribeTo("messages", async (payload) => {
      const newMessage = payload.new as Message;
      if (newMessage.conversation_id === selectedConversation) {
        setMessages(prev => [...prev, newMessage]);
        
        // Automatically mark as delivered when received
        if (newMessage.sender_id !== userId) {
          await supabase
            .from('messages')
            .update({ 
              status: 'delivered',
              delivered_at: new Date().toISOString()
            })
            .eq('id', newMessage.id);
          
          // Mark as seen since conversation is open
          markAsRead(newMessage.id);
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
    });

    // Subscribe to message updates for real-time status changes
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
          setMessages(prev =>
            prev.map(m => (m.id === updatedMessage.id ? updatedMessage : m))
          );
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

    let query = supabase.from('conversations').select('*');

    if (admin) {
      // Admins see all support conversations
      query = query.eq('conversation_type', 'support');
    } else if (student) {
      query = query.eq('student_id', student.id);
    } else if (owner) {
      query = query.eq('owner_id', owner.id);
    } else {
      return;
    }

    // Filter archived
    if (!showArchived) {
      query = query.or('is_archived.is.null,is_archived.eq.false');
    }

    // Sort pinned first, then by updated_at
    query = query.order('is_pinned', { ascending: false }).order('updated_at', { ascending: false });

    const { data } = await query;
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
            // Admin viewing: show student name
            const { data: studentData } = await supabase
              .from('students')
              .select('full_name, profile_photo_url')
              .eq('id', conv.student_id)
              .maybeSingle();
            otherUserName = studentData?.full_name || 'Student';
            otherUserPhoto = studentData?.profile_photo_url || null;
          } else {
            // Student viewing: show "Roomy Support"
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

        const lastMessage = lastMsg?.attachment_type
          ? `📎 ${lastMsg.attachment_type === 'image' ? 'Photo' : lastMsg.attachment_type === 'video' ? 'Video' : 'Voice message'}`
          : lastMsg?.body || '';

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Prefer opus codec for better quality and compatibility
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
          // Validate blob has actual data
          if (audioBlob.size > 0) {
            await uploadVoiceMessage(audioBlob);
          } else {
            toast({
              title: 'Recording error',
              description: 'No audio data captured. Please try again.',
              variant: 'destructive',
            });
          }
        }
        stream.getTracks().forEach((track) => track.stop());
        audioChunksRef.current = [];
        
        // Clear timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
        setRecordingDuration(0);
      };

      // Use larger timeslice for more reliable recording
      mediaRecorder.start(1000); // 1 second chunks
      setRecording(true);
      setRecordingDuration(0);
      
      // Start duration counter
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      
      toast({
        title: 'Recording...',
        description: 'Voice message is being recorded',
      });
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: 'Microphone access denied',
        description: 'Please allow microphone access to record voice messages.',
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

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Helper to calculate audio duration
  const getAudioDuration = async (blob: Blob): Promise<number> => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      await audioContext.close();
      return Math.round(audioBuffer.duration);
    } catch (error) {
      console.error('Error calculating audio duration:', error);
      return 0;
    }
  };

  const uploadVoiceMessage = async (audioBlob: Blob) => {
    if (!selectedConversation || !userId) return;

    try {
      // Calculate duration
      const duration = await getAudioDuration(audioBlob);
      
      // Determine file extension based on MIME type
      const extension = audioBlob.type.includes('webm') ? 'webm' 
        : audioBlob.type.includes('mp4') ? 'mp4' 
        : audioBlob.type.includes('ogg') ? 'ogg' 
        : 'webm';
      
      const fileName = `voice-${Date.now()}.${extension}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('message-media')
        .upload(filePath, audioBlob, {
          contentType: audioBlob.type || 'audio/webm',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('message-media')
        .getPublicUrl(filePath);

      await supabase.from('messages').insert({
        conversation_id: selectedConversation,
        sender_id: userId,
        body: '',
        attachment_type: 'audio',
        attachment_url: publicUrl,
        attachment_duration: duration,
        attachment_metadata: { mimeType: audioBlob.type },
        status: 'sent',
      });

      toast({ title: 'Voice message sent' });
    } catch (error: any) {
      console.error('Voice message upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !userId) return;

    setSending(true);
    try {
      // Stop typing indicator
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (presenceChannelRef.current) {
        presenceChannelRef.current.untrack();
      }

      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation,
        sender_id: userId,
        body: messageInput.trim(),
        status: 'sent',
      });

      if (error) throw error;

      setMessageInput('');
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

  const renderMessageContent = (msg: Message) => {
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
      return (
        <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
          <audio controls src={msg.attachment_url || ''} className="w-48" />
        </div>
      );
    }

    return <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>;
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
      <Navbar />
      
      <main className={`flex-1 container mx-auto px-0 md:px-4 py-0 md:py-8 mt-16 md:mt-20 ${isMobile ? 'mb-20' : 'mb-0'}`}>
        <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-12rem)] flex flex-col md:flex-row gap-0 md:gap-4">
          {/* Conversations List */}
          <Card className={`${isMobile && selectedConversation ? 'hidden' : 'flex'} flex-col w-full md:w-80 rounded-none md:rounded-lg border-0 md:border`}>
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
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
                              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-primary-foreground bg-primary rounded-full shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-foreground/60 truncate">{conv.last_message}</p>
                          <p className="text-xs text-foreground/60 truncate">{conv.dorm_name}</p>
                        </div>
                      </div>
                    </button>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <Card className={`${isMobile && !selectedConversation ? 'hidden' : 'flex'} flex-col flex-1 rounded-none md:rounded-lg border-0 md:border`}>
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-border flex items-center gap-2">
                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}>
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={conversations.find(c => c.id === selectedConversation)?.other_user_photo || undefined} 
                      alt="User" 
                    />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {conversations.find(c => c.id === selectedConversation)?.other_user_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
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
                          {renderMessageContent(msg)}
                          <div className="flex items-center gap-1 text-xs opacity-70 mt-1">
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                            {msg.sender_id === userId && msg.status && (
                              <span className="ml-1">
                                <MessageStatusIcon status={msg.status} />
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

                <div className="p-4 border-t border-border">
                  {recording && (
                    <div className="flex items-center justify-center gap-2 bg-red-500/10 text-red-500 px-3 py-2 rounded-lg mb-2 animate-pulse">
                      <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">
                        Recording... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  
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

                    {/* Desktop: Click to toggle, Mobile: Hold to record */}
                    <Button
                      type="button"
                      variant={recording ? "destructive" : "ghost"}
                      size="icon"
                      onClick={isMobile ? undefined : toggleRecording}
                      onMouseDown={isMobile ? startRecording : undefined}
                      onMouseUp={isMobile ? stopRecording : undefined}
                      onTouchStart={isMobile ? startRecording : undefined}
                      onTouchEnd={isMobile ? stopRecording : undefined}
                      className={recording ? "animate-pulse" : ""}
                      aria-label={recording ? "Stop recording" : "Record voice message"}
                      title={isMobile ? "Hold to record voice message" : "Click to record voice message"}
                    >
                      <Mic className="w-5 h-5" />
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

                    <Button 
                      onClick={sendMessage} 
                      disabled={sending || !messageInput.trim() || recording} 
                      size="icon"
                      aria-label="Send message"
                      title="Send message"
                    >
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
