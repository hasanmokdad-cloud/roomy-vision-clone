// Messages.tsx - Production build
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Send, ArrowLeft, MessageSquare, Check, CheckCheck, Mic, Loader2, Pin, BellOff, Archive, X, Smile, Square, Info, BarChart3, Plus, Camera, Keyboard, Trash2, Search } from 'lucide-react';
import { ConversationSearchBar, HighlightedText } from '@/components/messages/ConversationSearchBar';
import { TypingIndicator } from '@/components/messages/TypingIndicator';
import { RecordingIndicator } from '@/components/messages/RecordingIndicator';
import { AnimatePresence } from 'framer-motion';
import { AttachmentModal } from '@/components/messages/AttachmentModal';
import { formatDistanceToNowStrict } from 'date-fns';
import { VoiceWaveform } from '@/components/messages/VoiceWaveform';
import { ConversationContextMenu } from '@/components/messages/ConversationContextMenu';
import { VoiceRecordingOverlay } from '@/components/messages/VoiceRecordingOverlay';
import { TourMessageCard } from '@/components/messages/TourMessageCard';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { EmojiPickerSheet } from '@/components/messages/EmojiPickerSheet';
import { SwipeableMessage } from '@/components/messages/SwipeableMessage';
import { SwipeableChatRow } from '@/components/messages/SwipeableChatRow';
import { OnlineIndicator } from '@/components/messages/OnlineIndicator';
import { LastSeenStatus } from '@/components/messages/LastSeenStatus';
import { EditMessageModal } from '@/components/messages/EditMessageModal';
import { ContactInfoPanel } from '@/components/messages/ContactInfoPanel';
import { FriendsTab } from '@/components/friends/FriendsTab';
import { FriendSearchBar } from '@/components/friends/FriendSearchBar';
import { MicPermissionModal } from '@/components/voice/MicPermissionModal';
import { MicSetupModal } from '@/components/voice/MicSetupModal';
import { useMicPermission } from '@/contexts/MicPermissionContext';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { subscribeTo, unsubscribeFrom } from '@/lib/supabaseRealtime';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { extractMeetingUrl } from '@/lib/meetingUtils';
import { haptics } from '@/utils/haptics';

type Conversation = {
  id: string;
  dorm_id: string | null;
  owner_id: string | null;
  student_id: string;
  conversation_type?: string;
  updated_at: string;
  user_a_id?: string | null;
  user_b_id?: string | null;
  other_user_name?: string;
  other_user_avatar?: string | null;
  other_student_id?: string | null;
  other_user_role?: 'Student' | 'Owner' | 'Admin';
  owner_dorm_name?: string | null;
  last_message?: string;
  last_message_status?: 'sent' | 'delivered' | 'seen';
  last_message_sender_id?: string | null;
  last_message_time?: string;
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
  receiver_id?: string | null;
  body: string | null;
  created_at: string;
  read?: boolean;
  status?: 'sent' | 'delivered' | 'seen';
  delivered_at?: string | null;
  seen_at?: string | null;
  played_at?: string | null;
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
  reply_to_message_id?: string | null;
  is_starred?: boolean;
  edited_at?: string | null;
  deleted_for_all?: boolean;
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

// AudioPlayer component removed - now using VoiceWaveform component

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
  const { role } = useRoleGuard();
  const { isAuthenticated, isAuthReady, openAuthModal, userId, isSigningOut } = useAuth();
  const isMobile = useIsMobile();
  // Skip auth guard loading for mobile unauthenticated - they see login prompt
  const authLoading = !isAuthReady;
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { setHideBottomNav } = useBottomNav();
  const { permission, requestPermission, syncToDatabase, loadFromDatabase, checkPermission } = useMicPermission();
  
  // Track component mount state to prevent state updates after unmount (React Error #300)
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [recordingUsers, setRecordingUsers] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showArchivedPage, setShowArchivedPage] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const shouldUploadVoiceRef = useRef(true);
  const [slideOffset, setSlideOffset] = useState({ x: 0, y: 0 });
  const slideOffsetRef = useRef(slideOffset);
  // Keep ref in sync with state for use in touch event closures
  useEffect(() => { slideOffsetRef.current = slideOffset; }, [slideOffset]);
  const [isLocked, setIsLocked] = useState(false);
  // Phase 3: Voice recording enhancements
  const [isPaused, setIsPaused] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewIntervalRef = useRef<NodeJS.Timeout>();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  // Removed hoveredConversation state - three-dot menu is now always visible on desktop
  const [studentId, setStudentId] = useState<string | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [detailsSource, setDetailsSource] = useState<'conversation' | 'menu'>('conversation');
  const [showMicPermissionModal, setShowMicPermissionModal] = useState(false);
  const [showMicSetupModal, setShowMicSetupModal] = useState(false);
  const [micPermissionLoaded, setMicPermissionLoaded] = useState(false);
  const [hasShownMicSetup, setHasShownMicSetup] = useState(() => {
    return localStorage.getItem('roomyMicSetupShown') === 'true';
  });
  // Track if user was trying to record when permission modal appeared
  const pendingRecordingRef = useRef(false);
  // Safety timeout ref to reset stuck states
  const stuckResetTimeoutRef = useRef<NodeJS.Timeout>();
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  // In-conversation search state
  const [showConversationSearch, setShowConversationSearch] = useState(false);
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
  const [matchingMessageIds, setMatchingMessageIds] = useState<string[]>([]);
  const [currentSearchMatchIndex, setCurrentSearchMatchIndex] = useState(-1);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartTimeRef = useRef<number>(0);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const micButtonRef = useRef<HTMLButtonElement>(null);

  // Unauthenticated state - Airbnb style (both mobile and desktop)
  if (isAuthReady && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {!isMobile && <RoomyNavbar />}
        
        <div className={`${isMobile ? 'pt-20 px-6 pb-32' : 'pt-32 px-6 pb-16'}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center space-y-6"
          >
            <h1 className="text-3xl font-bold text-foreground">Inbox</h1>
            
            <div className="py-12">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/30 mb-6" />
              <h2 className="text-xl font-semibold mb-2">Log in to see messages</h2>
              <p className="text-muted-foreground">
                Once you login, you'll find messages from hosts here.
              </p>
            </div>

            <Button
              onClick={() => openAuthModal()}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-6 text-lg rounded-xl"
            >
              Log in
            </Button>
          </motion.div>
        </div>
        
        {isMobile && <BottomNav />}
      </div>
    );
  }


  // Get student ID for friends functionality
  useEffect(() => {
    if (userId && role === 'student') {
      supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single()
        .then(({ data }) => {
          if (data) setStudentId(data.id);
        });
    }
  }, [userId, role]);

  // Start heartbeat for online status
  useOnlineStatus(userId, selectedConversation || undefined);

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

        // Get current user's student profile
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!student) {
          toast({
            title: 'Error',
            description: 'Could not find your student profile',
            variant: 'destructive'
          });
          return;
        }

        let conversationId: string | null = null;

        // Check if target is an owner
        const { data: targetOwner, error: ownerError } = await supabase
          .from('owners')
          .select('id')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (targetOwner) {
          // Student → Owner conversation
          const { data: existingConv, error: convCheckError } = await supabase
            .from('conversations')
            .select('id')
            .eq('student_id', student.id)
            .eq('owner_id', targetOwner.id)
            .maybeSingle();

          if (convCheckError) {
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
          } else {
            // Create new student-owner conversation
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
              
              // Reload conversations list to show the new conversation
              await loadConversations();
              
              // Wait for UI to update, then select the conversation
              setTimeout(() => {
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
              toast({
                title: 'Error',
                description: 'Failed to send initial message',
                variant: 'destructive'
              });
            } else {
              toast({
                title: 'Success',
                description: 'Conversation started with owner',
              });
            }
          }
          
          // THEN load messages to display them immediately
          await loadMessages(conversationId);
        } else {
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

  // Set accurate viewport height for mobile Safari
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  // Proactively show mic setup modal when user first opens any conversation
  // This ensures permission is granted BEFORE they try to record (preventing Safari popup interruption)
  // CRITICAL: For Safari compatibility, we show the modal IMMEDIATELY when permission is 'prompt'
  // No delay - Safari users need to see the modal before any getUserMedia call happens
  // Load mic permission from database on mount for existing users
  // IMPORTANT: Must complete BEFORE checking if modal should show
  // Also: If DB says 'granted', immediately mark hasShownMicSetup to prevent modal
  useEffect(() => {
    if (userId) {
      loadFromDatabase(userId).then((dbPermission) => {
        setMicPermissionLoaded(true);
        // Only skip modal if ACTUALLY granted (not if Safari returned 'prompt' for re-verification)
        // Safari will return 'prompt' even when DB says granted - that means modal must show
        if (dbPermission === 'granted') {
          setHasShownMicSetup(true);
          localStorage.setItem('roomyMicSetupShown', 'true');
          console.log('[Messages] DB permission is granted AND verified, skipping mic setup modal');
        } else if (dbPermission === 'prompt') {
          // Safari returned 'prompt' - modal will show via next useEffect
          console.log('[Messages] Safari needs re-verification this session, modal will show');
        }
      });
    }
  }, [userId, loadFromDatabase]);

  // Show mic setup modal only AFTER loading from database completes
  // This prevents the race condition where modal shows before DB says 'granted'
  // SAFARI: Show modal every session since Safari resets permissions
  // Other browsers: Only show once per device
  useEffect(() => {
    if (isMobile && selectedConversation && permission === 'prompt' && micPermissionLoaded) {
      // Detect Safari
      const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      // On Safari: always show when permission is 'prompt' (each session)
      // On other browsers: only show once (controlled by hasShownMicSetup)
      if (isSafariBrowser || !hasShownMicSetup) {
        setShowMicSetupModal(true);
        if (!isSafariBrowser) {
          setHasShownMicSetup(true);
          localStorage.setItem('roomyMicSetupShown', 'true');
        }
      }
    }
  }, [isMobile, selectedConversation, permission, micPermissionLoaded, hasShownMicSetup]);

  // Hide bottom nav when in conversation view on mobile (Instagram-style)
  // Also lock body scroll to prevent viewport shifting
  useEffect(() => {
    if (isMobile && selectedConversation) {
      setHideBottomNav(true);
      document.body.classList.add('messages-chat-open');
    } else {
      setHideBottomNav(false);
      document.body.classList.remove('messages-chat-open');
    }
    
    // Cleanup when leaving the page
    return () => {
      setHideBottomNav(false);
      document.body.classList.remove('messages-chat-open');
    };
  }, [isMobile, selectedConversation, setHideBottomNav]);

  // Mobile uses tap-to-start now (same as desktop), no need for native touch listeners

  useEffect(() => {
    if (!userId || isSigningOut) return;
    loadConversations();

    // Subscribe to new messages using realtime utility
    const messagesChannel = subscribeTo("messages", async (payload) => {
      // Guard against updates during sign-out or after unmount
      if (!isMountedRef.current || isSigningOut) return;
      
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
          if (isMountedRef.current && !isSigningOut) {
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
          // Update the sender's own message status if it was updated
          setMessages(prev =>
            prev.map(m => (m.id === newMessage.id ? { ...m, ...newMessage } : m))
          );
        }
      } else {
        // Message in different conversation, just mark as delivered
        if (newMessage.sender_id !== userId && newMessage.status === 'sent' && isMountedRef.current && !isSigningOut) {
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
      if (isMountedRef.current && !isSigningOut) {
        loadConversations();
      }
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
        const recordingSet = new Set<string>();
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence) => {
            if (presence.userId !== userId) {
              if (presence.typing) {
                typingSet.add(presence.userId);
              }
              if (presence.recording) {
                recordingSet.add(presence.userId);
              }
            }
          });
        });
        setTypingUsers(typingSet);
        setRecordingUsers(recordingSet);
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

  // Scroll to bottom only on initial load or when sending new messages
  const lastMessageCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  
  useEffect(() => {
    if (messages.length === 0) {
      isInitialLoadRef.current = true;
      lastMessageCountRef.current = 0;
      return;
    }
    
    // Only auto-scroll on initial load or when new messages are added (not on every render)
    const isNewMessage = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;
    
    if (isInitialLoadRef.current || isNewMessage) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: isInitialLoadRef.current ? 'auto' : 'smooth' });
        isInitialLoadRef.current = false;
      });
    }
  }, [messages]);

  // Hide bottom nav and disable swipe when in conversation on mobile
  useEffect(() => {
    if (isMobile && selectedConversation) {
      setHideBottomNav(true);
      document.body.setAttribute('data-chat-open', 'true');
    } else {
      setHideBottomNav(false);
      document.body.removeAttribute('data-chat-open');
    }
    
    return () => {
      setHideBottomNav(false);
      document.body.removeAttribute('data-chat-open');
    };
  }, [selectedConversation, isMobile, setHideBottomNav]);

  // Load pinned messages for current conversation
  const loadPinnedMessages = async () => {
    if (!selectedConversation) {
      setPinnedMessages([]);
      return;
    }
    
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', selectedConversation)
      .eq('is_pinned', true)
      .order('pinned_at', { ascending: false });
    
    if (data) {
      setPinnedMessages(data as Message[]);
    }
  };

  // Conversation action handlers for swipe gestures
  const handlePinConversation = async (conversationId: string, isPinned: boolean) => {
    const { error } = await supabase
      .from('conversations')
      .update({ is_pinned: !isPinned })
      .eq('id', conversationId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to pin chat', variant: 'destructive' });
    } else {
      toast({ title: isPinned ? 'Chat unpinned' : 'Chat pinned' });
      loadConversations();
    }
  };

  const handleArchiveConversation = async (conversationId: string, isArchived: boolean) => {
    // Optimistic update - immediately update local state
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, is_archived: !isArchived }
        : conv
    ));
    
    // Show toast immediately
    toast({ title: isArchived ? 'Chat unarchived' : 'Chat archived' });

    // Update database in background
    const { error } = await supabase
      .from('conversations')
      .update({ is_archived: !isArchived })
      .eq('id', conversationId);

    if (error) {
      // Revert on error
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, is_archived: isArchived }
          : conv
      ));
      toast({ title: 'Error', description: 'Failed to archive chat', variant: 'destructive' });
    }
  };

  const handleMarkConversationRead = async (conversationId: string) => {
    if (!userId) return;
    
    const { error } = await supabase
      .from('messages')
      .update({ seen_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('seen_at', null);

    if (!error) {
      loadConversations();
    }
  };

  // State for "More" action sheet
  const [moreActionConversation, setMoreActionConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    loadPinnedMessages();
  }, [selectedConversation]);

  // Scroll to specific message
  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight message briefly
      messageElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        messageElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

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
      recording: false,
      timestamp: Date.now()
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      presenceChannelRef.current?.untrack();
    }, 2000);
  };

  const handleRecordingPresence = (isRecording: boolean) => {
    if (!selectedConversation || !userId || !presenceChannelRef.current) return;

    if (isRecording) {
      presenceChannelRef.current.track({
        userId,
        typing: false,
        recording: true,
        timestamp: Date.now()
      });
    } else {
      presenceChannelRef.current.untrack();
    }
  };

  const loadConversations = async () => {
    if (!userId) return;
    // Guard against updates during sign-out or after unmount
    if (isSigningOut || !isMountedRef.current) return;
    
    console.log('🔄 Loading conversations for user:', userId);

    // Get user role - check admin first
    const [adminResult, studentResult, ownerResult] = await Promise.all([
      supabase.from('admins').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('students').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('owners').select('id').eq('user_id', userId).maybeSingle()
    ]);
    
    // Early return if unmounted during fetch
    if (!isMountedRef.current || isSigningOut) return;
    
    const admin = adminResult.data;
    const student = studentResult.data;
    const owner = ownerResult.data;

    console.log('👤 User role:', { admin: !!admin, student: !!student, owner: !!owner });

    let query = supabase.from('conversations').select('*');

    if (admin) {
      query = query.eq('conversation_type', 'support');
    } else {
      query = query.or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);
    }

    query = query.order('is_pinned', { ascending: false }).order('updated_at', { ascending: false });

    const { data, error } = await query;
    
    // Early return if unmounted during fetch
    if (!isMountedRef.current || isSigningOut) return;
    
    if (error) {
      console.error('❌ Error loading conversations:', error);
      return;
    }
    
    console.log(`✅ Loaded ${data?.length || 0} conversations`);
    
    if (!data || data.length === 0) {
      setConversations([]);
      return;
    }
    
    // OPTIMIZED: Show conversations immediately with basic info
    // Then enrich in background
    const conversationIds = data.map(c => c.id);
    const otherUserIds = new Set<string>();
    const ownerIds = new Set<string>();
    const studentIds = new Set<string>();
    const dormIds = new Set<string>();
    
    // Collect all IDs we need to look up
    data.forEach(conv => {
      if (conv.user_a_id && conv.user_a_id !== userId) otherUserIds.add(conv.user_a_id);
      if (conv.user_b_id && conv.user_b_id !== userId) otherUserIds.add(conv.user_b_id);
      if (conv.owner_id) ownerIds.add(conv.owner_id);
      if (conv.student_id) studentIds.add(conv.student_id);
      if (conv.dorm_id && conv.conversation_type !== 'support') dormIds.add(conv.dorm_id);
    });
    
    // Batch fetch all related data in parallel
    const [studentsResult, ownersResult, adminsResult, dormsResult, threadStatesResult] = await Promise.all([
      // Fetch students by user_id
      otherUserIds.size > 0 
        ? supabase.from('students').select('id, user_id, full_name, profile_photo_url').in('user_id', Array.from(otherUserIds))
        : Promise.resolve({ data: [] }),
      // Fetch owners by user_id AND by id (for old-style conversations)
      Promise.all([
        otherUserIds.size > 0 
          ? supabase.from('owners').select('id, user_id, full_name, profile_photo_url').in('user_id', Array.from(otherUserIds))
          : Promise.resolve({ data: [] }),
        ownerIds.size > 0
          ? supabase.from('owners').select('id, user_id, full_name, profile_photo_url').in('id', Array.from(ownerIds))
          : Promise.resolve({ data: [] })
      ]),
      // Fetch admins by user_id
      otherUserIds.size > 0 
        ? supabase.from('admins').select('user_id, full_name, profile_photo_url').in('user_id', Array.from(otherUserIds))
        : Promise.resolve({ data: [] }),
      // Fetch dorms
      dormIds.size > 0 
        ? supabase.from('dorms').select('id, name, dorm_name, owner_id').in('id', Array.from(dormIds))
        : Promise.resolve({ data: [] }),
      // Fetch thread states for unread counts
      supabase.from('user_thread_state').select('thread_id, last_read_at').eq('user_id', userId).in('thread_id', conversationIds)
    ]);
    
    // Fetch last messages in parallel (small number of parallel queries is fine)
    const lastMessagesResults = await Promise.all(conversationIds.map(id => 
      supabase.from('messages')
        .select('body, attachment_type, sender_id, created_at, conversation_id')
        .eq('conversation_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ));
    
    // Build lookup maps
    const studentsByUserId = new Map<string, any>();
    const studentsByProfileId = new Map<string, any>();
    (studentsResult.data || []).forEach((s: any) => {
      studentsByUserId.set(s.user_id, s);
      studentsByProfileId.set(s.id, s);
    });
    
    const ownersByUserId = new Map<string, any>();
    const ownersByProfileId = new Map<string, any>();
    const [ownersByUserIdResult, ownersByProfileIdResult] = ownersResult;
    (ownersByUserIdResult.data || []).forEach((o: any) => ownersByUserId.set(o.user_id, o));
    (ownersByProfileIdResult.data || []).forEach((o: any) => ownersByProfileId.set(o.id, o));
    
    const adminsByUserId = new Map<string, any>();
    (adminsResult.data || []).forEach((a: any) => adminsByUserId.set(a.user_id, a));
    
    const dormsById = new Map<string, any>();
    (dormsResult.data || []).forEach((d: any) => dormsById.set(d.id, d));
    
    const lastMessagesByConvId = new Map<string, any>();
    lastMessagesResults.forEach((result) => {
      if (result.data?.conversation_id) {
        lastMessagesByConvId.set(result.data.conversation_id, result.data);
      }
    });
    
    const threadStatesByConvId = new Map<string, string>();
    (threadStatesResult.data || []).forEach((ts: any) => threadStatesByConvId.set(ts.thread_id, ts.last_read_at));
    
    // Fetch owner dorm names (for showing dorm name next to owner)
    const ownerProfileIds = new Set<string>();
    ownersByUserId.forEach(o => ownerProfileIds.add(o.id));
    ownersByProfileId.forEach(o => ownerProfileIds.add(o.id));
    
    let ownerDormsMap = new Map<string, string>();
    if (ownerProfileIds.size > 0) {
      const { data: ownerDorms } = await supabase
        .from('dorms')
        .select('owner_id, name, dorm_name')
        .in('owner_id', Array.from(ownerProfileIds))
        .eq('verification_status', 'approved');
      if (ownerDorms) {
        ownerDorms.forEach((d: any) => {
          if (!ownerDormsMap.has(d.owner_id)) {
            ownerDormsMap.set(d.owner_id, d.dorm_name || d.name);
          }
        });
      }
    }
    
    // OPTIMIZED: Batch fetch unread counts in ONE query instead of N queries
    // Fetch messages from all conversations where sender is NOT the current user
    const { data: allUnreadMessages } = await supabase
      .from('messages')
      .select('conversation_id, created_at, sender_id')
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId!);
    
    // Early return if unmounted during fetch
    if (!isMountedRef.current || isSigningOut) return;
    
    // Build unread counts map - calculate on client side
    const unreadCountsByConvId = new Map<string, number>();
    conversationIds.forEach(id => unreadCountsByConvId.set(id, 0));
    
    if (allUnreadMessages) {
      allUnreadMessages.forEach((msg: any) => {
        const convId = msg.conversation_id;
        const lastReadAt = threadStatesByConvId.get(convId);
        // Count as unread if no last_read_at OR message is newer than last_read_at
        if (!lastReadAt || new Date(msg.created_at) > new Date(lastReadAt)) {
          unreadCountsByConvId.set(convId, (unreadCountsByConvId.get(convId) || 0) + 1);
        }
      });
    }
    
    // Now enrich conversations SYNCHRONOUSLY using our lookup maps (no more async)
    const enriched = data.map((conv) => {
      let dorm = conv.dorm_id ? dormsById.get(conv.dorm_id) : null;
      let otherUserName = 'User';
      let otherUserPhoto: string | null = null;
      let otherStudentId: string | null = null;
      let otherUserRole: 'Student' | 'Owner' | 'Admin' = 'Student';
      let ownerDormName: string | null = null;

      // Handle support conversations
      if (conv.conversation_type === 'support') {
        if (admin) {
          const otherUserId = conv.user_a_id === userId ? conv.user_b_id : conv.user_a_id;
          
          const studentData = studentsByUserId.get(otherUserId);
          if (studentData) {
            otherUserName = studentData.full_name || 'Student';
            otherUserPhoto = studentData.profile_photo_url;
            otherUserRole = 'Student';
          } else {
            const ownerData = ownersByUserId.get(otherUserId);
            if (ownerData) {
              otherUserName = ownerData.full_name || 'Owner';
              otherUserPhoto = ownerData.profile_photo_url;
              otherUserRole = 'Owner';
              ownerDormName = ownerDormsMap.get(ownerData.id) || null;
            } else {
              const adminData = adminsByUserId.get(otherUserId);
              if (adminData) {
                otherUserName = adminData.full_name || 'Admin';
                otherUserPhoto = adminData.profile_photo_url;
                otherUserRole = 'Admin';
              }
            }
          }
        } else {
          otherUserName = 'Roomy Support';
        }
      } else if (conv.user_a_id && conv.user_b_id) {
        // Peer-to-peer conversation
        const otherUserId = conv.user_a_id === userId ? conv.user_b_id : conv.user_a_id;
        
        const studentData = studentsByUserId.get(otherUserId);
        if (studentData) {
          otherUserName = studentData.full_name || 'Student';
          otherUserPhoto = studentData.profile_photo_url;
          otherStudentId = studentData.id;
          otherUserRole = 'Student';
        } else {
          const ownerData = ownersByUserId.get(otherUserId);
          if (ownerData) {
            otherUserName = ownerData.full_name || 'Owner';
            otherUserPhoto = ownerData.profile_photo_url;
            otherUserRole = 'Owner';
            ownerDormName = ownerDormsMap.get(ownerData.id) || null;
          } else {
            const adminData = adminsByUserId.get(otherUserId);
            if (adminData) {
              otherUserName = adminData.full_name || 'Admin';
              otherUserPhoto = adminData.profile_photo_url;
              otherUserRole = 'Admin';
            }
          }
        }
      } else {
        // Regular dorm conversations
        if (student) {
          if (conv.owner_id) {
            const ownerData = ownersByProfileId.get(conv.owner_id);
            if (ownerData) {
              otherUserName = ownerData.full_name || 'Owner';
              otherUserPhoto = ownerData.profile_photo_url;
              otherUserRole = 'Owner';
              ownerDormName = ownerDormsMap.get(ownerData.id) || null;
            }
          } else {
            otherUserName = 'Support';
            otherUserRole = 'Admin';
          }
        } else if (conv.student_id) {
          const studentData = studentsByProfileId.get(conv.student_id);
          if (studentData) {
            otherUserName = studentData.full_name || 'Student';
            otherUserPhoto = studentData.profile_photo_url;
            otherStudentId = studentData.id;
            otherUserRole = 'Student';
          }
        }
      }

      // Get last message from map
      const lastMsg = lastMessagesByConvId.get(conv.id);
      
      // Get unread count from pre-calculated batch map (INSTANT - no await!)
      const unreadCount = unreadCountsByConvId.get(conv.id) || 0;

      // Format last message preview
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
        other_student_id: otherStudentId,
        other_user_role: otherUserRole,
        owner_dorm_name: ownerDormName,
        last_message: lastMessage,
        last_message_sender_id: lastMsg?.sender_id || null,
        last_message_time: lastMsg?.created_at || conv.updated_at,
        unreadCount
      };
    });
    
    // Early return if unmounted during processing
    if (!isMountedRef.current || isSigningOut) return;
    
    setConversations(enriched);
  };

  const loadMessages = async (conversationId: string) => {
    // Guard against updates during sign-out or after unmount
    if (isSigningOut || !isMountedRef.current) return;
    
    console.log('🔄 Loading messages for conversation:', conversationId, 'userId:', userId);
    
    // Reset search state when changing conversations
    setShowConversationSearch(false);
    setConversationSearchQuery('');
    setMatchingMessageIds([]);
    setCurrentSearchMatchIndex(-1);
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Early return if unmounted during fetch
    if (!isMountedRef.current || isSigningOut) return;

    console.log('📨 Messages loaded:', data?.length || 0, 'Error:', error);

    if (data) {
      setMessages(data as Message[]);
      
      // Load pinned messages
      const pinned = data.filter(m => m.is_pinned);
      setPinnedMessages(pinned as Message[]);
      
      // Mark all unseen messages as seen
      const unseenIds = data.filter(m => m.sender_id !== userId && m.status !== 'seen').map(m => m.id);
      if (unseenIds.length > 0 && isMountedRef.current && !isSigningOut) {
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
      if (userId && isMountedRef.current && !isSigningOut) {
        await supabase.from('user_thread_state').upsert(
          {
            thread_id: conversationId,
            user_id: userId,
            last_read_at: new Date().toISOString(),
          },
          { onConflict: 'thread_id,user_id' }
        );
        if (isMountedRef.current && !isSigningOut) {
          loadConversations();
        }
      }
    }
  };

  // Handler for pin changes from MessageBubble
  const handlePinChange = (messageId: string, isPinned: boolean) => {
    if (isPinned) {
      // Add to pinned messages
      const message = messages.find(m => m.id === messageId);
      if (message) {
        setPinnedMessages(prev => [...prev, { ...message, is_pinned: true }]);
      }
    } else {
      // Remove from pinned messages
      setPinnedMessages(prev => prev.filter(m => m.id !== messageId));
    }
  };

  // Mark voice message as played (for recipients only)
  const markMessageAsPlayed = async (messageId: string) => {
    if (!userId) return;
    
    // Only mark as played if it hasn't been played yet
    const message = messages.find(m => m.id === messageId);
    if (!message || message.played_at) return;
    
    const { error } = await supabase
      .from('messages')
      .update({ played_at: new Date().toISOString() })
      .eq('id', messageId)
      .is('played_at', null);

    if (!error) {
      // Update local state
      setMessages(prev => 
        prev.map(m => 
          m.id === messageId 
            ? { ...m, played_at: new Date().toISOString() } 
            : m
        )
      );
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

    // Use ref for permission to avoid stale closure issues
    const currentPermission = permissionRef.current;

    // Double-check permission before recording (defensive)
    if (currentPermission === 'denied') {
      setShowMicPermissionModal(true);
      return;
    }
    
    if (currentPermission === 'prompt') {
      setShowMicSetupModal(true);
      return;
    }

    try {
      setIsRecordingActive(true);
      shouldUploadVoiceRef.current = true; // Reset flag for new recording
      setIsPaused(false);
      setIsPreviewPlaying(false);
      setPreviewProgress(0);
      
      // Clear any existing safety timeout
      if (stuckResetTimeoutRef.current) {
        clearTimeout(stuckResetTimeoutRef.current);
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream); // Store for live waveform
      
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
        // CRITICAL: Reset all recording states FIRST before any async work
        // This ensures mic button is immediately responsive
        recordingStartedRef.current = false;
        setIsRecordingActive(false);
        setMediaStream(null);
        setRecording(false);
        setIsLocked(false);
        slideOffsetRef.current = { x: 0, y: 0 };
        setSlideOffset({ x: 0, y: 0 });
        setIsPaused(false);
        setIsPreviewPlaying(false);
        setPreviewProgress(0);
        
        // Remove recording attribute to re-enable swipe
        document.body.removeAttribute('data-recording');
        
        // Clear safety timeout since we're stopping normally
        if (stuckResetTimeoutRef.current) {
          clearTimeout(stuckResetTimeoutRef.current);
        }
        
        // Stop timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
        setRecordingDuration(0);
        
        // Only upload if not cancelled (async work after state reset)
        if (shouldUploadVoiceRef.current && audioChunksRef.current.length > 0) {
          const actualMimeType = mimeType || mediaRecorder.mimeType;
          const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
          
          if (audioBlob.size > 0) {
            let duration: number;
            if (recordingStartTime > 0) {
              duration = Math.max(1, Math.ceil((Date.now() - recordingStartTime) / 1000));
            } else {
              duration = Math.max(1, recordingDuration);
            }
            duration = Math.min(duration, 900);
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
      };

      mediaRecorder.start(100);
      setRecording(true);
      setRecordingStartTime(Date.now());
      setRecordingDuration(0);
      handleRecordingPresence(true);
      // Add attribute to disable swipe during recording
      document.body.setAttribute('data-recording', 'true');
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      
    } catch (error: any) {
      console.error('Recording error:', error);
      setIsRecordingActive(false);
      
      // If getUserMedia fails unexpectedly, permission was likely revoked
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setShowMicPermissionModal(true);
      }
      
      toast({
        title: 'Microphone access required',
        description: 'Please allow microphone access to record voice messages',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      handleRecordingPresence(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const handleVoiceButtonClick = async (e?: React.MouseEvent | React.TouchEvent) => {
    // If permission is denied, show modal with instructions
    if (permission === 'denied') {
      setShowMicPermissionModal(true);
      return;
    }
    
    // If permission not yet granted, show setup modal on TAP (not hold)
    // This prevents the browser popup from interrupting the hold gesture
    if (permission === 'prompt') {
      setShowMicSetupModal(true);
      return;
    }
    
    // Permission is granted - toggle recording
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Callback when permission is granted via setup modal
  const handleMicPermissionGranted = () => {
    setHasShownMicSetup(true);
    localStorage.setItem('roomyMicSetupShown', 'true');
    
    // Note: MicSetupModal already synced 'granted' to database before calling this
    // Do NOT call checkPermission() here as it resets Safari's state to 'prompt'
    
    // Update ref immediately so startRecording sees 'granted'
    permissionRef.current = 'granted';
    
    // If user was trying to record when modal appeared, auto-start now
    if (pendingRecordingRef.current) {
      pendingRecordingRef.current = false;
      // Small delay to ensure modal is fully closed
      setTimeout(() => {
        startRecording();
      }, 100);
      toast({ 
        title: 'Recording started!', 
        description: 'Hold or lock to continue recording' 
      });
    } else {
      toast({ 
        title: 'Voice messages enabled!', 
        description: 'Hold the mic button to record' 
      });
    }
  };

  // Refs to track current state values for touch handlers (avoid stale closures)
  const isTrackingRef = useRef(false);
  const recordingRef = useRef(recording);
  const isLockedRef = useRef(isLocked);
  const recordingStartedRef = useRef(false); // Track if recording was TRIGGERED (after 220ms hold) - set immediately, not tied to state
  const isRecordingActiveRef = useRef(isRecordingActive); // Track pending recording state (getUserMedia in progress)
  const permissionRef = useRef(permission); // Track mic permission for touch handlers
  
  // Keep refs in sync with state
  useEffect(() => { recordingRef.current = recording; }, [recording]);
  useEffect(() => { isLockedRef.current = isLocked; }, [isLocked]);
  useEffect(() => { isRecordingActiveRef.current = isRecordingActive; }, [isRecordingActive]);
  useEffect(() => { permissionRef.current = permission; }, [permission]);

  // Refs for the actual handler logic - these get updated with latest values
  const touchMoveLogicRef = useRef<(e: TouchEvent) => void>(() => {});
  const touchEndLogicRef = useRef<(e: TouchEvent) => void>(() => {});
  
  // Stable wrapper functions that delegate to refs - these never change identity
  const stableTouchMove = useCallback((e: TouchEvent) => {
    touchMoveLogicRef.current(e);
  }, []);
  
  const stableTouchEnd = useCallback((e: TouchEvent) => {
    touchEndLogicRef.current(e);
  }, []);

  // Cleanup document listeners helper - uses stable wrapper functions
  const cleanupDocumentListeners = useCallback(() => {
    document.removeEventListener('touchmove', stableTouchMove);
    document.removeEventListener('touchend', stableTouchEnd);
    isTrackingRef.current = false;
  }, [stableTouchMove, stableTouchEnd]);

  // Update the handler logic refs with latest closure values
  // This runs on every render to ensure handlers always have fresh state
  useEffect(() => {
    touchMoveLogicRef.current = (e: TouchEvent) => {
      if (!isTrackingRef.current) return;
      e.preventDefault();
      
      const deltaX = e.touches[0].clientX - touchStartPosRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartPosRef.current.y;
      
      // Haptic feedback when crossing thresholds
      const prevOffset = slideOffsetRef.current;
      
      // Entering cancel zone (slide left past -50px)
      if (deltaX < -50 && prevOffset.x >= -50 && recordingStartedRef.current) {
        haptics.voiceCancelNear();
      }
      // Entering lock zone (slide up past -40px)
      if (deltaY < -40 && prevOffset.y >= -40 && recordingStartedRef.current) {
        haptics.voiceLockNear();
      }
      
      // Update BOTH state and ref directly for immediate access in handleTouchEnd
      const newOffset = { x: deltaX, y: deltaY };
      slideOffsetRef.current = newOffset;
      setSlideOffset(newOffset);
    };
    
    touchEndLogicRef.current = (e: TouchEvent) => {
      if (!isTrackingRef.current) return;
      e.preventDefault();
      
      // Clean up document listeners AFTER processing
      setTimeout(() => cleanupDocumentListeners(), 0);
      
      // Use refs to get current values (avoid stale closures)
      const currentSlideOffset = slideOffsetRef.current;
      
      // Process gestures if recording was TRIGGERED (held 220ms+)
      const recordingWasTriggered = recordingStartedRef.current;
      const recordingIsActive = recordingRef.current || isRecordingActiveRef.current;
      
      if (recordingWasTriggered && !isLockedRef.current) {
        // Check slide gestures
        if (currentSlideOffset.x < -80) {
          haptics.voiceCancelled();
          cancelRecording();
        } else if (currentSlideOffset.y < -60) {
          haptics.voiceLocked();
          setIsLocked(true);
          slideOffsetRef.current = { x: 0, y: 0 };
          setSlideOffset({ x: 0, y: 0 });
          toast({ title: 'Recording locked', description: 'Tap send when done' });
        } else if (recordingIsActive) {
          // Auto-send on release (only if recording actually started or is pending)
          haptics.voiceSent();
          stopRecording();
        }
      }
      
      // Reset refs
      recordingStartedRef.current = false;
      slideOffsetRef.current = { x: 0, y: 0 };
      setSlideOffset({ x: 0, y: 0 });
    };
  }); // No deps - runs every render to capture latest values

  // Function to attach touch handlers to mic button - extracted so it can be called from callback ref
  const attachMicTouchHandlers = useCallback((micButton: HTMLButtonElement | null) => {
    if (!isMobile || !micButton) return () => {};
    
    let pressTimer: NodeJS.Timeout;
    
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Use ref to get CURRENT permission value (not stale closure value)
      const currentPermission = permissionRef.current;
      
      // If permission is denied, show modal with instructions
      if (currentPermission === 'denied') {
        setShowMicPermissionModal(true);
        return;
      }
      
      // If permission not yet granted, show setup modal on TAP (not hold)
      if (currentPermission === 'prompt') {
        pendingRecordingRef.current = true; // Mark that user wants to record
        setShowMicSetupModal(true);
        return;
      }
      
      // Permission is granted - proceed with hold-to-record
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      
      // Clean up any existing document listeners first (this resets isTrackingRef to false)
      cleanupDocumentListeners();
      
      // NOW set tracking to true AFTER cleanup - this is critical!
      isTrackingRef.current = true;
      
      // Attach STABLE wrapper functions to document
      // These never change identity, but delegate to refs with latest logic
      document.addEventListener('touchmove', stableTouchMove, { passive: false });
      document.addEventListener('touchend', stableTouchEnd, { passive: false });
      
      // Start recording after 220ms hold
      pressTimer = setTimeout(() => {
        // Set recordingStartedRef IMMEDIATELY before async startRecording
        // This ensures touch handlers know recording was triggered
        recordingStartedRef.current = true;
        haptics.voiceStart();
        startRecording();
      }, 220);
    };
    
    // Only attach touchstart to mic button
    micButton.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    // Return cleanup function - ONLY removes touchstart from mic button
    // Document listeners are managed separately and persist during recording
    return () => {
      clearTimeout(pressTimer);
      micButton.removeEventListener('touchstart', handleTouchStart);
      // Do NOT clean up document listeners here - they need to persist during recording
    };
  }, [isMobile, cleanupDocumentListeners, stableTouchMove, stableTouchEnd]);
  // Store cleanup function for mic button touch handlers
  const micCleanupRef = useRef<(() => void) | null>(null);
  
  // Callback ref for mic button - re-attaches handlers whenever button mounts
  const micButtonCallbackRef = useCallback((node: HTMLButtonElement | null) => {
    // Cleanup previous handlers
    if (micCleanupRef.current) {
      micCleanupRef.current();
      micCleanupRef.current = null;
    }
    
    // Update the regular ref
    micButtonRef.current = node;
    
    // Attach new handlers if node exists
    if (node && isMobile) {
      micCleanupRef.current = attachMicTouchHandlers(node);
    }
  }, [isMobile, attachMicTouchHandlers]);

  const cancelRecording = () => {
    shouldUploadVoiceRef.current = false;
    recordingStartedRef.current = false; // Reset triggered flag
    
    // Clean up document listeners (in case cancel is called while still tracking)
    cleanupDocumentListeners();
    
    // Stop preview if playing
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setIsRecordingActive(false);
    setIsLocked(false);
    slideOffsetRef.current = { x: 0, y: 0 };
    setSlideOffset({ x: 0, y: 0 });
    setIsPaused(false);
    setIsPreviewPlaying(false);
    setPreviewProgress(0);
    setMediaStream(null);
    handleRecordingPresence(false);
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    toast({ title: 'Recording cancelled' });
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  // Resume recording
  const resumeRecording = () => {
    // Stop any preview that might be playing
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
    }
    setIsPreviewPlaying(false);
    setPreviewProgress(0);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  // Play preview of recorded audio
  const playPreview = () => {
    if (audioChunksRef.current.length === 0) return;
    
    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const previewBlob = new Blob(audioChunksRef.current, { type: mimeType });
    const previewUrl = URL.createObjectURL(previewBlob);
    
    const audio = new Audio(previewUrl);
    previewAudioRef.current = audio;
    
    audio.onended = () => {
      setIsPreviewPlaying(false);
      setPreviewProgress(0);
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
      }
    };
    
    audio.play();
    setIsPreviewPlaying(true);
    
    // Update progress
    previewIntervalRef.current = setInterval(() => {
      if (audio.duration && audio.currentTime) {
        setPreviewProgress(audio.currentTime / audio.duration);
      }
    }, 100);
  };

  // Pause preview playback
  const pausePreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
      }
    }
  };

  // Send the recorded voice message
  const sendRecording = () => {
    // Stop preview if playing
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
    }
    
    setIsLocked(false);
    setSlideOffset({ x: 0, y: 0 });
    setIsPaused(false);
    setIsPreviewPlaying(false);
    setPreviewProgress(0);
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
    
    // Check if editing (should not happen since we use modal now)
    if (editingMessage) {
      setSending(false);
      return;
    }
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: selectedConversation,
      sender_id: userId,
      body: messageText,
      created_at: new Date().toISOString(),
      status: 'sent',
      read: false,
      reply_to_message_id: replyToMessage?.id || null,
    };
    
    // Add optimistically for instant feedback
    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');
    const currentReplyTo = replyToMessage;
    setReplyToMessage(null);
    
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
          reply_to_message_id: currentReplyTo?.id || null,
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
      setReplyToMessage(currentReplyTo); // Restore reply
      
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const renderMessageContent = (msg: Message, isCurrentMatch: boolean = false) => {
    // Helper function to wrap text with highlighting
    const wrapWithHighlight = (text: string) => {
      if (conversationSearchQuery.trim()) {
        return (
          <HighlightedText 
            text={text} 
            searchQuery={conversationSearchQuery} 
            isCurrentMatch={isCurrentMatch}
          />
        );
      }
      return text;
    };

    // Tour booking card if present
    if (msg.attachment_metadata?.type === 'tour_booking' || msg.attachment_metadata?.type === 'tour_reminder') {
      return <TourMessageCard metadata={msg.attachment_metadata as any} message={msg} />;
    }
    
    // Room preview card if present
    if (msg.attachment_metadata?.type === 'room_inquiry') {
      return (
        <>
          <p className="text-sm whitespace-pre-wrap break-words">{wrapWithHighlight(formatMessageBody(msg))}</p>
          <RoomPreviewCard metadata={msg.attachment_metadata} />
        </>
      );
    }
    
    // Make URLs clickable and open externally (fixes 404 error)
    const body = formatMessageBody(msg);
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = body.split(urlRegex);
    
    if (parts.length > 1) {
      return (
        <p className="text-sm whitespace-pre-wrap break-words">
          {parts.map((part, index) => {
            if (part.match(urlRegex)) {
              return (
                <a
                  key={index}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(part, '_blank', 'noopener,noreferrer');
                  }}
                >
                  {part}
                </a>
              );
            }
            return <span key={index}>{wrapWithHighlight(part)}</span>;
          })}
        </p>
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
      return (
        <VoiceWaveform 
          audioUrl={msg.attachment_url || ''} 
          duration={msg.attachment_duration || 0}
          isSender={msg.sender_id === userId}
          messageId={msg.id}
          onPlay={markMessageAsPlayed}
        />
      );
    }

    return <p className="text-sm whitespace-pre-wrap break-words">{wrapWithHighlight(formatMessageBody(msg))}</p>;
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
      {!isMobile && <RoomyNavbar />}

      {/* Archives Page Overlay - WhatsApp style (mobile and desktop) */}
      {showArchivedPage && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-background sticky top-0 z-10 pt-6">
            <Button variant="ghost" size="icon" onClick={() => setShowArchivedPage(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">Archived</h2>
          </div>

          {/* Archived conversations list */}
          <ScrollArea className="flex-1">
            {conversations.filter(c => c.is_archived).length === 0 ? (
              <div className="p-8 text-center text-foreground/60">
                <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No archived chats</p>
              </div>
            ) : (
              conversations.filter(c => c.is_archived).map((conv) => {
                const hasUnread = (conv.unreadCount || 0) > 0 && (!conv.muted_until || new Date(conv.muted_until) <= new Date());
                const timeAgo = conv.last_message_time 
                  ? formatDistanceToNowStrict(new Date(conv.last_message_time), { addSuffix: false })
                      .replace(' seconds', 's')
                      .replace(' second', 's')
                      .replace(' minutes', 'm')
                      .replace(' minute', 'm')
                      .replace(' hours', 'h')
                      .replace(' hour', 'h')
                      .replace(' days', 'd')
                      .replace(' day', 'd')
                      .replace(' weeks', 'w')
                      .replace(' week', 'w')
                      .replace(' months', 'mo')
                      .replace(' month', 'mo')
                      .replace(' years', 'y')
                      .replace(' year', 'y')
                  : '';

                return (
                  <SwipeableChatRow
                    key={conv.id}
                    conversationId={conv.id}
                    isPinned={conv.is_pinned || false}
                    isArchived={conv.is_archived || false}
                    hasUnread={hasUnread}
                    onPin={() => handlePinConversation(conv.id, conv.is_pinned || false)}
                    onArchive={async () => {
                      await handleArchiveConversation(conv.id, conv.is_archived || false);
                      // If unarchiving, close the archives page after a brief delay
                      if (conv.is_archived) {
                        setTimeout(() => {
                          if (conversations.filter(c => c.is_archived && c.id !== conv.id).length === 0) {
                            setShowArchivedPage(false);
                          }
                        }, 300);
                      }
                    }}
                    onMore={() => setMoreActionConversation(conv)}
                    onMarkRead={() => handleMarkConversationRead(conv.id)}
                  >
                    <div 
                      className={`relative group cursor-pointer hover:bg-muted/50 transition-colors ${hasUnread ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                      onClick={() => {
                        setSelectedConversation(conv.id);
                        loadMessages(conv.id);
                        setShowArchivedPage(false);
                      }}
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="relative shrink-0">
                          <Avatar className="w-14 h-14">
                            <AvatarImage src={conv.other_user_photo || undefined} alt={conv.other_user_name} />
                            <AvatarFallback className="bg-primary/20 text-primary text-lg">
                              {conv.other_user_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {conv.is_pinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
                            {conv.muted_until && new Date(conv.muted_until) > new Date() && (
                              <BellOff className="w-3 h-3 text-muted-foreground shrink-0" />
                            )}
                            <span className={`text-[14px] truncate ${hasUnread ? 'font-bold text-foreground' : 'font-normal text-foreground'}`}>
                              {conv.other_user_name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 mt-0.5 min-w-0">
                            {conv.last_message_sender_id === userId && (
                              <MessageStatusIcon status={conv.last_message_status} />
                            )}
                            <p className={`text-sm truncate max-w-[65%] ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                              {conv.last_message_sender_id === userId ? 'You: ' : ''}{conv.last_message || 'Start a conversation'}
                            </p>
                            {timeAgo && (
                              <span className="text-sm text-muted-foreground shrink-0 whitespace-nowrap ml-1">· {timeAgo}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {hasUnread && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  </SwipeableChatRow>
                );
              })
            )}
          </ScrollArea>
        </div>
      )}
      
      <main 
        className={`flex-1 flex ${isMobile ? 'pt-0' : 'mt-20'}`}
        style={isMobile ? { 
          paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))'
        } : undefined}
      >
        {/* Conversations List - Edge-to-edge, no Card wrapper */}
        <div className={`${isMobile && selectedConversation ? 'hidden' : 'flex'} flex-col w-full md:w-[350px] border-r border-border bg-background ${isMobile ? 'h-screen' : 'h-[calc(100vh-80px)]'}`}>
            
            <div className={`p-4 border-b border-border ${isMobile ? 'pt-6' : ''} space-y-3`}>
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <h2 className={`${isMobile ? 'text-3xl' : 'text-2xl'} font-bold flex items-center gap-2`}>
                    <MessageSquare className="w-6 h-6" />
                    Messages
                  </h2>
                </div>
              </div>

              {/* Search bar for ALL roles */}
              <FriendSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={activeTab === 'chats' || role !== 'student' ? 'Search messages...' : 'Search students...'}
              />
              
              {/* Chats/Friends tabs - STUDENT ONLY */}
              {role === 'student' && studentId && (
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chats' | 'friends')}>
                  <TabsList className="w-full">
                    <TabsTrigger value="chats" className="flex-1">Chats</TabsTrigger>
                    <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>
            {activeTab === 'friends' && role === 'student' && studentId ? (
              <FriendsTab studentId={studentId} searchQuery={searchQuery} />
            ) : (
              <ScrollArea className="flex-1 [&>div>div]:!overflow-visible">
                {conversations.filter(c => 
                  !searchQuery || 
                  c.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                  <div className="p-8 text-center text-foreground/60">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start chatting about dorms to see conversations here</p>
                  </div>
                ) : (
                  <>
                    {/* Archived section row - WhatsApp style - ALWAYS visible */}
                    <button
                      onClick={() => setShowArchivedPage(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border"
                    >
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                        <Archive className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-medium text-foreground">Archived</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {conversations.filter(c => c.is_archived).length}
                      </span>
                    </button>
                    
                    {/* Main conversation list - exclude archived */}
                    {conversations.filter(c => 
                      !c.is_archived &&
                      (!searchQuery || 
                      c.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.last_message?.toLowerCase().includes(searchQuery.toLowerCase()))
                    ).map((conv) => {
                      const hasUnread = (conv.unreadCount || 0) > 0 && (!conv.muted_until || new Date(conv.muted_until) <= new Date());
                      const timeAgo = conv.last_message_time 
                        ? formatDistanceToNowStrict(new Date(conv.last_message_time), { addSuffix: false })
                          .replace(' seconds', 's')
                          .replace(' second', 's')
                          .replace(' minutes', 'm')
                          .replace(' minute', 'm')
                          .replace(' hours', 'h')
                          .replace(' hour', 'h')
                          .replace(' days', 'd')
                          .replace(' day', 'd')
                          .replace(' weeks', 'w')
                          .replace(' week', 'w')
                          .replace(' months', 'mo')
                          .replace(' month', 'mo')
                          .replace(' years', 'y')
                          .replace(' year', 'y')
                        : '';
                      
                      
                      const chatRowContent = (
                        <div 
                          className={`relative cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedConversation === conv.id ? 'bg-muted' : ''
                          } ${hasUnread ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                          onClick={() => {
                            setSelectedConversation(conv.id);
                            loadMessages(conv.id);
                          }}
                        >
                          <div className="flex items-center gap-3 px-4 py-3">
                            {/* Avatar - 56px like Instagram */}
                            <div className="relative shrink-0">
                              <Avatar className="w-14 h-14">
                                <AvatarImage src={conv.other_user_photo || undefined} alt={conv.other_user_name} />
                                <AvatarFallback className="bg-primary/20 text-primary text-lg">
                                  {conv.other_user_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              {conv.student_id && <OnlineIndicator userId={conv.student_id} />}
                            </div>
                            
                            {/* Content - Instagram style: name on top, message + time on bottom */}
                            <div className="flex-1 min-w-0">
                              {/* Row 1: Name with icons */}
                              <div className="flex items-center gap-1.5">
                                {conv.is_pinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
                                {conv.muted_until && new Date(conv.muted_until) > new Date() && (
                                  <BellOff className="w-3 h-3 text-muted-foreground shrink-0" />
                                )}
                                <span className={`text-[14px] truncate ${hasUnread ? 'font-bold text-foreground' : 'font-normal text-foreground'}`}>
                                  {conv.other_user_name}
                                </span>
                              </div>
                              
                              {/* Row 2: Message preview + time (Instagram style: "Message · 1d") */}
                              <div className="flex items-center gap-1 mt-0.5 min-w-0">
                                {conv.last_message_sender_id === userId && (
                                  <MessageStatusIcon status={conv.last_message_status} />
                                )}
                                <p className={`text-sm truncate flex-1 min-w-0 ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                  {conv.last_message_sender_id === userId ? 'You: ' : ''}{conv.last_message || 'Start a conversation'}
                                </p>
                                {timeAgo && (
                                  <span className="text-sm text-muted-foreground shrink-0 whitespace-nowrap">· {timeAgo}</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Right side controls */}
                            <div className="flex items-center gap-2 shrink-0 ml-2 z-10 overflow-visible">
                              {/* Blue dot for unread */}
                              {hasUnread && (
                                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                              )}
                              
                              {/* Three-dots context menu - DESKTOP ONLY, always visible */}
                              {!isMobile && (
                                <div onClick={(e) => e.stopPropagation()}>
                                  <ConversationContextMenu
                                    conversationId={conv.id}
                                    isPinned={conv.is_pinned || false}
                                    isArchived={conv.is_archived || false}
                                    mutedUntil={conv.muted_until || null}
                                    onUpdate={() => loadConversations()}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                      
                      // On mobile, wrap with SwipeableChatRow
                      if (isMobile) {
                        return (
                          <SwipeableChatRow
                            key={conv.id}
                            conversationId={conv.id}
                            isPinned={conv.is_pinned || false}
                            isArchived={conv.is_archived || false}
                            hasUnread={hasUnread}
                            onPin={() => handlePinConversation(conv.id, conv.is_pinned || false)}
                            onArchive={() => handleArchiveConversation(conv.id, conv.is_archived || false)}
                            onMore={() => setMoreActionConversation(conv)}
                            onMarkRead={() => handleMarkConversationRead(conv.id)}
                          >
                            {chatRowContent}
                          </SwipeableChatRow>
                        );
                      }
                      
                      // On desktop, render without swipe wrapper
                      return <div key={conv.id}>{chatRowContent}</div>;
                    })}
                  </>
                )}
              </ScrollArea>
            )}
        </div>

        {/* Chat Window - Edge-to-edge, no Card wrapper */}
        <div 
          className={`${isMobile && !selectedConversation ? 'hidden' : 'flex'} flex-col bg-background ${
            isMobile 
              ? 'fixed top-0 left-0 right-0 z-30' 
              : 'flex-1 h-[calc(100vh-80px)]'
          }`}
          style={isMobile ? {
            height: 'calc(var(--vh, 1vh) * 100)',
            maxHeight: 'calc(var(--vh, 1vh) * 100)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)'
          } : undefined}
          onContextMenu={(e) => e.preventDefault()}
        >
            {selectedConversation ? (
              <>
              {/* Instagram-style conversation header - fixed on mobile */}
                <div className={`${isMobile ? 'p-3 shrink-0 z-20' : 'p-4'} border-b border-border flex items-center gap-3 bg-background`}>
                  {isMobile && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedConversation(null)}
                      className="shrink-0 flex items-center gap-1 px-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      {totalUnreadCount > 0 && (
                        <span className="text-primary font-semibold text-sm">{totalUnreadCount}</span>
                      )}
                    </Button>
                  )}
                  <div className="relative">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage 
                        src={conversations.find(c => c.id === selectedConversation)?.other_user_photo || undefined} 
                        alt="User" 
                      />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {conversations.find(c => c.id === selectedConversation)?.other_user_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {(() => {
                      const otherUserId = conversations.find(c => c.id === selectedConversation)?.student_id;
                      return otherUserId ? <OnlineIndicator userId={otherUserId} /> : null;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {conversations.find(c => c.id === selectedConversation)?.other_user_name}
                    </h3>
                    <LastSeenStatus
                      userId={(() => {
                        const conv = conversations.find(c => c.id === selectedConversation);
                        if (!conv) return null;
                        // Determine the other user's ID based on conversation type and role
                        if (conv.conversation_type === 'student_to_student') {
                          return conv.user_a_id === userId ? conv.user_b_id : conv.user_a_id;
                        }
                        return role === 'owner' ? conv.student_id : conv.owner_id;
                      })()}
                      isTyping={typingUsers.size > 0}
                      isRecording={recordingUsers.size > 0}
                      fallbackText={(() => {
                        const conv = conversations.find(c => c.id === selectedConversation);
                        if (!conv) return '';
                        if (conv.other_user_role === 'Owner' && conv.owner_dorm_name) {
                          return `${conv.owner_dorm_name} • Owner`;
                        }
                        return conv.other_user_role || 'User';
                      })()}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowConversationSearch(true)}
                    className="shrink-0"
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDetailsSource('conversation');
                      setShowContactInfo(!showContactInfo);
                    }}
                    className="shrink-0"
                  >
                    <Info className="w-5 h-5" />
                  </Button>
                </div>

                {/* In-conversation search bar */}
                <ConversationSearchBar
                  open={showConversationSearch}
                  onClose={() => {
                    setShowConversationSearch(false);
                    setConversationSearchQuery('');
                    setMatchingMessageIds([]);
                    setCurrentSearchMatchIndex(-1);
                  }}
                  messages={messages}
                  onNavigateToMatch={(messageId) => {
                    const element = document.getElementById(`message-${messageId}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Flash highlight effect
                      element.classList.add('bg-primary/20');
                      setTimeout(() => element.classList.remove('bg-primary/20'), 1500);
                    }
                  }}
                  currentMatchIndex={currentSearchMatchIndex}
                  setCurrentMatchIndex={setCurrentSearchMatchIndex}
                  matchingMessageIds={matchingMessageIds}
                  setMatchingMessageIds={setMatchingMessageIds}
                  searchQuery={conversationSearchQuery}
                  setSearchQuery={setConversationSearchQuery}
                />

                {/* Chat Messages - Native scroll on mobile for smooth touch scrolling */}
                {isMobile ? (
                  <div 
                    className="flex-1 overflow-y-auto overscroll-contain p-4"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    <div className="space-y-4">
                      {/* Pinned Messages Banner */}
                      {pinnedMessages.length > 0 && (
                        <div 
                          className="sticky top-0 z-10 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-lg p-3 cursor-pointer flex items-center gap-3 hover:bg-primary/20 transition-colors"
                          onClick={() => {
                            const firstPinned = pinnedMessages[0];
                            if (firstPinned) {
                              scrollToMessage(firstPinned.id);
                            }
                          }}
                        >
                          <Pin className="w-4 h-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary">
                              {pinnedMessages.length === 1 ? 'Pinned message' : `${pinnedMessages.length} pinned messages`}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {pinnedMessages[0].body?.substring(0, 50) || 'Media'}
                              {pinnedMessages[0].body && pinnedMessages[0].body.length > 50 ? '...' : ''}
                            </p>
                          </div>
                        </div>
                      )}

                      {messages.map((msg) => {
                        const currentConversation = conversations.find(c => c.id === selectedConversation);
                        const isSender = msg.sender_id === userId;
                        const senderName = isSender ? 'You' : currentConversation?.other_user_name || 'User';
                        const senderAvatar = isSender ? undefined : currentConversation?.other_user_avatar;

                        return (
                          <SwipeableMessage
                            key={msg.id}
                            onSwipeReply={() => setReplyToMessage(msg)}
                            disabled={false}
                          >
                            <div id={`message-${msg.id}`}>
                              <MessageBubble
                                message={msg}
                                isSender={isSender}
                                userId={userId}
                                senderName={senderName}
                                senderAvatar={senderAvatar}
                                onReply={() => setReplyToMessage(msg)}
                                onEdit={() => {
                                  setEditingMessage(msg);
                                  setShowEditModal(true);
                                }}
                                renderContent={() => renderMessageContent(msg, matchingMessageIds[currentSearchMatchIndex] === msg.id)}
                                showAvatar={!isSender}
                                allMessages={messages}
                                onScrollToMessage={scrollToMessage}
                                onPinChange={handlePinChange}
                                searchQuery={conversationSearchQuery}
                                isCurrentSearchMatch={matchingMessageIds[currentSearchMatchIndex] === msg.id}
                              />
                            </div>
                          </SwipeableMessage>
                        );
                      })}
                      
                      {/* Typing and Recording indicators */}
                      <AnimatePresence mode="wait">
                        {recordingUsers.size > 0 && (
                          <RecordingIndicator 
                            userName={conversations.find(c => c.id === selectedConversation)?.other_user_name}
                            avatarUrl={conversations.find(c => c.id === selectedConversation)?.other_user_photo}
                          />
                        )}
                        {recordingUsers.size === 0 && typingUsers.size > 0 && (
                          <TypingIndicator 
                            userName={conversations.find(c => c.id === selectedConversation)?.other_user_name}
                            avatarUrl={conversations.find(c => c.id === selectedConversation)?.other_user_photo}
                          />
                        )}
                      </AnimatePresence>
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="flex-1 overflow-hidden p-4">
                    <div className="space-y-4">
                      {/* Pinned Messages Banner */}
                      {pinnedMessages.length > 0 && (
                        <div 
                          className="sticky top-0 z-10 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-lg p-3 cursor-pointer flex items-center gap-3 hover:bg-primary/20 transition-colors"
                          onClick={() => {
                            const firstPinned = pinnedMessages[0];
                            if (firstPinned) {
                              scrollToMessage(firstPinned.id);
                            }
                          }}
                        >
                          <Pin className="w-4 h-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary">
                              {pinnedMessages.length === 1 ? 'Pinned message' : `${pinnedMessages.length} pinned messages`}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {pinnedMessages[0].body?.substring(0, 50) || 'Media'}
                              {pinnedMessages[0].body && pinnedMessages[0].body.length > 50 ? '...' : ''}
                            </p>
                          </div>
                        </div>
                      )}

                      {messages.map((msg) => {
                        const currentConversation = conversations.find(c => c.id === selectedConversation);
                        const isSender = msg.sender_id === userId;
                        const senderName = isSender ? 'You' : currentConversation?.other_user_name || 'User';
                        const senderAvatar = isSender ? undefined : currentConversation?.other_user_avatar;

                        return (
                          <SwipeableMessage
                            key={msg.id}
                            onSwipeReply={() => setReplyToMessage(msg)}
                            disabled={false}
                          >
                            <div id={`message-${msg.id}`}>
                              <MessageBubble
                                message={msg}
                                isSender={isSender}
                                userId={userId}
                                senderName={senderName}
                                senderAvatar={senderAvatar}
                                onReply={() => setReplyToMessage(msg)}
                                onEdit={() => {
                                  setEditingMessage(msg);
                                  setShowEditModal(true);
                                }}
                                renderContent={() => renderMessageContent(msg, matchingMessageIds[currentSearchMatchIndex] === msg.id)}
                                showAvatar={!isSender}
                                allMessages={messages}
                                onScrollToMessage={scrollToMessage}
                                onPinChange={handlePinChange}
                                searchQuery={conversationSearchQuery}
                                isCurrentSearchMatch={matchingMessageIds[currentSearchMatchIndex] === msg.id}
                              />
                            </div>
                          </SwipeableMessage>
                        );
                      })}
                      
                      {/* Typing and Recording indicators */}
                      <AnimatePresence mode="wait">
                        {recordingUsers.size > 0 && (
                          <RecordingIndicator 
                            userName={conversations.find(c => c.id === selectedConversation)?.other_user_name}
                            avatarUrl={conversations.find(c => c.id === selectedConversation)?.other_user_photo}
                          />
                        )}
                        {recordingUsers.size === 0 && typingUsers.size > 0 && (
                          <TypingIndicator 
                            userName={conversations.find(c => c.id === selectedConversation)?.other_user_name}
                            avatarUrl={conversations.find(c => c.id === selectedConversation)?.other_user_photo}
                          />
                        )}
                      </AnimatePresence>
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                )}

                <div 
                  className={`${isMobile ? 'p-3 shrink-0 bg-background z-20 border-t border-border' : 'p-4 border-t border-border'}`}
                  style={isMobile ? { paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' } : undefined}
                >
                  {/* Voice Recording Overlay - rendered inline to inherit safe area positioning */}
                  {isMobile && recording ? (
                    <VoiceRecordingOverlay
                      isRecording={recording}
                      isPaused={isPaused}
                      isLocked={isLocked}
                      isPreviewPlaying={isPreviewPlaying}
                      duration={recordingDuration}
                      previewProgress={previewProgress}
                      slideOffset={slideOffset}
                      mediaStream={mediaStream}
                      onCancel={cancelRecording}
                      onSend={sendRecording}
                      onPause={pauseRecording}
                      onResume={resumeRecording}
                      onPreviewPlay={playPreview}
                      onPreviewPause={pausePreview}
                      onSlideChange={setSlideOffset}
                      onLock={() => {
                        setIsLocked(true);
                        setSlideOffset({ x: 0, y: 0 });
                        toast({ title: 'Recording locked', description: 'Tap send when done' });
                      }}
                    />
                  ) : (
                    <>
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

                  {/* Reply Preview */}
                  {replyToMessage && (
                    <div className="mb-2 bg-muted rounded-lg p-3 flex items-start gap-2 overflow-hidden">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-xs font-semibold text-primary truncate">
                          Replying to {replyToMessage.sender_id === userId ? 'yourself' : conversations.find(c => c.id === selectedConversation)?.other_user_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {replyToMessage.body 
                            ? replyToMessage.body.length > 100 
                              ? `${replyToMessage.body.slice(0, 100)}...` 
                              : replyToMessage.body 
                            : 'Media message'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => setReplyToMessage(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  
                  {/* WhatsApp-style input layout: [+] [Input] [Camera] [Mic/Send] */}
                  <div className="flex items-center gap-1.5">
                    {/* Hidden file inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    {/* [+] Button - opens attachment modal on mobile, shows keyboard icon when modal open */}
                    {isMobile ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowAttachmentModal(!showAttachmentModal)}
                        disabled={uploading || recording}
                        aria-label={showAttachmentModal ? "Close attachments" : "Add attachment"}
                        className="shrink-0 h-8 w-8"
                      >
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : showAttachmentModal ? (
                          <Keyboard className="w-5 h-5" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || recording}
                        aria-label="Attach file"
                        className="shrink-0 h-8 w-8"
                      >
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </Button>
                    )}

                    {/* Input field with emoji picker inside */}
                    <div className="flex-1 relative flex items-center bg-muted rounded-full">
                      <Input
                        placeholder="Message"
                        value={messageInput}
                        onChange={(e) => {
                          setMessageInput(e.target.value);
                          handleTyping();
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        disabled={sending || recording}
                        className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-10"
                        aria-label="Message input"
                      />
                      {/* Emoji picker inside input */}
                      <div className="absolute right-2">
                        <EmojiPickerSheet
                          open={showEmojiPicker}
                          onOpenChange={setShowEmojiPicker}
                          onEmojiSelect={(emoji) => {
                            setMessageInput(prev => prev + emoji);
                          }}
                          mode="input"
                          trigger={
                            <button
                              type="button"
                              disabled={recording}
                              aria-label="Add emoji"
                              className="p-1 hover:bg-background/50 rounded-full transition-colors"
                            >
                              <Smile className="w-5 h-5 text-muted-foreground" />
                            </button>
                          }
                        />
                      </div>
                    </div>

                    {/* Camera button - only show when no text (mobile only) */}
                    {isMobile && !messageInput.trim() && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={uploading || recording}
                        aria-label="Take photo"
                        className="shrink-0 h-8 w-8"
                      >
                        <Camera className="w-5 h-5" />
                      </Button>
                    )}

                    {/* Dynamic button: Mic when empty, Send when typing */}
                    {messageInput.trim() ? (
                      <Button 
                        onClick={sendMessage} 
                        disabled={sending} 
                        size="icon"
                        aria-label="Send message"
                        className="shrink-0 h-9 w-9 rounded-full bg-primary text-primary-foreground"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        ref={micButtonCallbackRef}
                        onClick={isMobile ? undefined : handleVoiceButtonClick}
                        className="shrink-0 h-8 w-8 voice-record-button"
                        aria-label="Record voice message"
                        title={isMobile ? 'Hold to record voice message' : 'Click to record voice message'}
                      >
                        <Mic className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  {/* Attachment Modal (Mobile Only) */}
                  {isMobile && (
                    <AttachmentModal
                      open={showAttachmentModal}
                      onOpenChange={setShowAttachmentModal}
                      onSelectPhoto={() => fileInputRef.current?.click()}
                      onSelectCamera={() => cameraInputRef.current?.click()}
                      onSelectDocument={() => fileInputRef.current?.click()}
                      uploading={uploading}
                    />
                  )}
                    </>
                  )}
                </div>
                {!isMobile && recording && (
                  <div className="fixed bottom-24 right-8 z-50 bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                      <Mic className="w-4 h-4 text-destructive" />
                      <span className="text-lg font-bold tabular-nums">
                        {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                      </span>
                      
                      {/* Simple waveform */}
                      <div className="flex items-center gap-0.5 h-6 ml-2">
                        {Array.from({ length: 15 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 bg-primary rounded-full"
                            style={{
                              height: `${30 + Math.sin(i * 0.5 + recordingDuration) * 40}%`,
                              transition: 'height 0.1s',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelRecording}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={stopRecording}
                        className="gap-2"
                      >
                        <Square className="w-4 h-4" />
                        Send
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-foreground/60">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
        </div>
          
        {/* Contact Info Panel */}
        {showContactInfo && selectedConversation && (
          <ContactInfoPanel
            onClose={() => {
              setShowContactInfo(false);
              if (detailsSource === 'menu') {
                // If accessed from menu, go back to general messages list
                setSelectedConversation(null);
              }
              // If from conversation, just close the panel (stay in the chat)
            }}
            contactName={conversations.find(c => c.id === selectedConversation)?.other_user_name || 'User'}
            contactAvatar={conversations.find(c => c.id === selectedConversation)?.other_user_photo || undefined}
            conversationId={selectedConversation}
            isMuted={(() => {
              const conv = conversations.find(c => c.id === selectedConversation);
              return conv?.muted_until ? new Date(conv.muted_until) > new Date() : false;
            })()}
            onMuteToggle={async (muted) => {
              try {
                const mutedUntil = muted ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null;
                await supabase
                  .from('conversations')
                  .update({ muted_until: mutedUntil })
                  .eq('id', selectedConversation);
                
                toast({ title: muted ? 'Conversation muted' : 'Conversation unmuted' });
                loadConversations();
              } catch (error) {
                toast({ title: 'Failed to update mute status', variant: 'destructive' });
              }
            }}
            currentStudentId={studentId}
            otherStudentId={conversations.find(c => c.id === selectedConversation)?.other_student_id || null}
          />
        )}
      </main>

      {isMobile && <BottomNav />}

      {/* Edit Message Modal */}
      {editingMessage && (
        <EditMessageModal
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open);
            if (!open) {
              setEditingMessage(null);
            }
          }}
          message={editingMessage}
          onSave={async (editedText) => {
            try {
              await supabase
                .from('messages')
                .update({
                  body: editedText,
                  edited_at: new Date().toISOString(),
                })
                .eq('id', editingMessage.id);

              toast({ title: 'Message updated' });
              setEditingMessage(null);
              if (selectedConversation) {
                loadMessages(selectedConversation);
              }
            } catch (error: any) {
              toast({
                title: 'Failed to update message',
                description: error.message,
                variant: 'destructive',
              });
              throw error;
            }
          }}
        />
      )}
      
      {/* Mic Permission Modal (for denied state) */}
      <MicPermissionModal
        open={showMicPermissionModal}
        onOpenChange={setShowMicPermissionModal}
      />

      {/* Mic Setup Modal (for first-time permission request) */}
      <MicSetupModal
        open={showMicSetupModal}
        onOpenChange={setShowMicSetupModal}
        onPermissionGranted={handleMicPermissionGranted}
        userId={userId}
        syncToDatabase={syncToDatabase}
      />

      {/* "More" Action Sheet for mobile swipe */}
      <Sheet open={!!moreActionConversation} onOpenChange={(open) => !open && setMoreActionConversation(null)}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="text-left">
              {moreActionConversation?.other_user_name}
            </SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-1">
            {/* Mute/Unmute */}
            <button
              onClick={async () => {
                if (!moreActionConversation) return;
                const isMuted = moreActionConversation.muted_until && new Date(moreActionConversation.muted_until) > new Date();
                const { error } = await supabase
                  .from('conversations')
                  .update({ muted_until: isMuted ? null : new Date('2099-12-31').toISOString() })
                  .eq('id', moreActionConversation.id);
                if (!error) {
                  toast({ title: isMuted ? 'Notifications unmuted' : 'Notifications muted' });
                  loadConversations();
                }
                setMoreActionConversation(null);
              }}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted rounded-lg transition-colors"
            >
              <BellOff className="w-5 h-5 text-muted-foreground" />
              <span>{moreActionConversation?.muted_until && new Date(moreActionConversation.muted_until) > new Date() ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* Details */}
            <button
              onClick={() => {
                if (!moreActionConversation) return;
                setDetailsSource('menu');
                setSelectedConversation(moreActionConversation.id);
                setShowContactInfo(true);
                setMoreActionConversation(null);
              }}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted rounded-lg transition-colors"
            >
              <Info className="w-5 h-5 text-muted-foreground" />
              <span>Details</span>
            </button>

            {/* Delete */}
            <button
              onClick={async () => {
                if (!moreActionConversation) return;
                const { error } = await supabase
                  .from('conversations')
                  .delete()
                  .eq('id', moreActionConversation.id);
                if (!error) {
                  toast({ title: 'Chat deleted' });
                  loadConversations();
                }
                setMoreActionConversation(null);
              }}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted rounded-lg transition-colors text-destructive"
            >
              <Trash2 className="w-5 h-5" />
              <span>Delete chat</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
