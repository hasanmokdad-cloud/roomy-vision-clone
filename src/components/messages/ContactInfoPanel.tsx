import { useState, useEffect } from "react";
import { X, ChevronRight, Image, FileText, Link as LinkIcon, Bell, BellOff, Star, UserPlus, UserMinus, Check, Ban, Flag, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StarredMessagesPanel } from "./StarredMessagesPanel";
import { MediaLinksDocsPanel } from "./MediaLinksDocsPanel";
import { MuteNotificationsModal } from "./MuteNotificationsModal";
import { useFriendshipStatus } from "@/hooks/useFriendshipStatus";
import { useFriendships } from "@/hooks/useFriendships";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContactInfoPanelProps {
  onClose: () => void;
  contactName: string;
  contactAvatar?: string;
  conversationId: string;
  isMuted: boolean;
  onMuteToggle: (muted: boolean) => void;
  currentStudentId?: string | null;
  otherStudentId?: string | null;
  onScrollToMessage?: (messageId: string) => void;
}

export function ContactInfoPanel({
  onClose,
  contactName,
  contactAvatar,
  conversationId,
  isMuted,
  onMuteToggle,
  currentStudentId,
  otherStudentId,
  onScrollToMessage,
}: ContactInfoPanelProps) {
  const isMobile = useIsMobile();
  const [showStarredMessages, setShowStarredMessages] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [mediaCount, setMediaCount] = useState(0);
  const [starredCount, setStarredCount] = useState(0);
  const [showMuteDialog, setShowMuteDialog] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Get friendship status if both are students
  const { status: friendshipStatus, friendshipId, refresh } = useFriendshipStatus(
    currentStudentId || null,
    otherStudentId || null
  );
  const { sendRequest, acceptRequest, removeFriend, blockUser } = useFriendships(currentStudentId || null);

  // Load counts on mount
  useEffect(() => {
    loadCounts();
    checkBlockStatus();

    // Subscribe to real-time changes for starred messages
    const channel = supabase
      .channel(`contact-info-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          loadCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Check block status on friendship status changes
  useEffect(() => {
    checkBlockStatus();
  }, [friendshipStatus]);

  const loadCounts = async () => {
    // Load starred count
    const { count: starredCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('is_starred', true);
    
    setStarredCount(starredCount || 0);

    // Load media count - only images and videos, not audio/voice messages
    const { count: mediaCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .not('attachment_url', 'is', null)
      .or('attachment_type.eq.image,attachment_type.eq.video,attachment_type.ilike.image/%,attachment_type.ilike.video/%');

    setMediaCount(mediaCount || 0);
  };

  const checkBlockStatus = async () => {
    if (!currentStudentId || !otherStudentId) return;
    
    const { data } = await supabase
      .from('friendships')
      .select('status, blocker_id')
      .or(`and(requester_id.eq.${currentStudentId},receiver_id.eq.${otherStudentId}),and(requester_id.eq.${otherStudentId},receiver_id.eq.${currentStudentId})`)
      .eq('status', 'blocked')
      .maybeSingle();

    if (data && data.blocker_id === currentStudentId) {
      setIsBlocked(true);
    }
  };

  const handleAddFriend = async () => {
    if (!otherStudentId) return;
    await sendRequest(otherStudentId);
    refresh();
  };

  const handleAcceptRequest = async () => {
    if (!friendshipId) return;
    await acceptRequest(friendshipId, conversationId);
    refresh();
  };

  const handleRemoveFriend = async () => {
    if (!friendshipId) return;
    await removeFriend(friendshipId);
    refresh();
  };

  // Check if this is a blockable conversation (student to student only)
  const canBlock = Boolean(currentStudentId && otherStudentId);
  const isNonStudentConversation = !otherStudentId;

  const handleBlockToggle = async () => {
    // Check if this is a non-student conversation (support, admin, owner, etc.)
    if (!otherStudentId) {
      // Check for common non-blockable account types
      if (contactName.toLowerCase().includes('support') || contactName.toLowerCase().includes('roomy')) {
        toast.error("Support accounts cannot be blocked");
      } else if (contactName.toLowerCase().includes('admin')) {
        toast.error("Admin accounts cannot be blocked");
      } else {
        toast.error("This user cannot be blocked");
      }
      return;
    }

    if (!currentStudentId) {
      toast.error("Cannot block user - please try again later");
      return;
    }

    if (isBlocked) {
      // Unblock - delete the friendship/block record
      if (friendshipId) {
        const { error } = await supabase
          .from('friendships')
          .delete()
          .eq('id', friendshipId);
        
        if (!error) {
          setIsBlocked(false);
          refresh();
          toast.success(`${contactName} has been unblocked`);
        } else {
          toast.error("Failed to unblock user");
        }
      }
    } else {
      // Block
      if (friendshipId) {
        await blockUser(friendshipId, otherStudentId);
        setIsBlocked(true);
        refresh();
        toast.success(`${contactName} has been blocked`);
      } else {
        // Create friendship record with blocked status
        const { error } = await supabase
          .from('friendships')
          .insert({
            requester_id: currentStudentId,
            receiver_id: otherStudentId,
            status: 'blocked',
            blocker_id: currentStudentId,
            blocked_at: new Date().toISOString(),
          });
        
        if (error) {
          toast.error("Failed to block user");
          return;
        }
      }
      setIsBlocked(true);
      refresh();
      toast.success(`${contactName} has been blocked`);
    }
  };

  const handleReport = async () => {
    try {
      toast.success(`${contactName} has been reported`);
    } catch (error) {
      toast.error("Failed to report user");
    }
  };

  const handleMuteSwitch = (checked: boolean) => {
    if (checked) {
      // Show mute duration dialog
      setShowMuteDialog(true);
    } else {
      // Unmute directly
      onMuteToggle(false);
    }
  };

  const handleMute = async (duration: '8hours' | '1week' | 'always') => {
    let mutedUntil: string | null = null;
    
    if (duration === '8hours') {
      mutedUntil = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    } else if (duration === '1week') {
      mutedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      mutedUntil = new Date('2099-12-31').toISOString();
    }

    const { error } = await supabase
      .from('conversations')
      .update({ muted_until: mutedUntil })
      .eq('id', conversationId);

    if (error) {
      toast.error('Failed to mute chat');
    } else {
      toast.success('Notifications muted');
      onMuteToggle(true);
    }
    setShowMuteDialog(false);
  };

  const handleMessageClick = (messageId: string) => {
    setShowStarredMessages(false);
    if (onScrollToMessage) {
      onScrollToMessage(messageId);
    }
  };

  if (showStarredMessages) {
    return (
      <StarredMessagesPanel
        conversationId={conversationId}
        onBack={() => setShowStarredMessages(false)}
        onMessageClick={handleMessageClick}
      />
    );
  }

  if (showMediaPanel) {
    return (
      <MediaLinksDocsPanel
        conversationId={conversationId}
        onBack={() => setShowMediaPanel(false)}
      />
    );
  }

  // Content shared between mobile and desktop
  const panelContent = (
    <>
      {/* Profile section */}
      <div className="flex flex-col items-center py-8 px-4">
        <Avatar className="h-32 w-32 mb-4">
          <AvatarImage src={contactAvatar} />
          <AvatarFallback className="text-4xl">
            {contactName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-2xl font-semibold mb-1">{contactName}</h3>
        <p className="text-sm text-muted-foreground">Student</p>
      </div>

      <Separator />

      {/* Friend Status - Only show if both are students */}
      {currentStudentId && otherStudentId && (
        <>
          <div className="p-4">
            <h3 className="font-semibold text-sm mb-3">Friend Status</h3>
            {friendshipStatus === 'friends' && (
              <div className="space-y-2">
                <Badge variant="secondary" className="w-full justify-center py-2">
                  <Check className="w-4 h-4 mr-2" />
                  Friends
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={handleRemoveFriend}
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remove Friend
                </Button>
              </div>
            )}
            {friendshipStatus === 'pending_sent' && (
              <Badge variant="outline" className="w-full justify-center py-2">
                Request Sent
              </Badge>
            )}
            {friendshipStatus === 'pending_received' && (
              <div className="space-y-2">
                <Badge variant="outline" className="w-full justify-center py-2 mb-2">
                  Pending Request
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={handleAcceptRequest}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleRemoveFriend}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            )}
            {friendshipStatus === 'none' && !isBlocked && (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={handleAddFriend}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend
              </Button>
            )}
          </div>
          <Separator />
        </>
      )}

      {/* Media, links and docs */}
      <button
        onClick={() => setShowMediaPanel(true)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-muted-foreground" />
            <FileText className="h-5 w-5 text-muted-foreground" />
            <LinkIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-left">
            <p className="font-medium">Media, links and docs</p>
            <p className="text-sm text-muted-foreground">{mediaCount} items</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>

      <Separator />

      {/* Starred messages */}
      <button
        onClick={() => setShowStarredMessages(true)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Star className="h-5 w-5 text-muted-foreground" />
          <p className="font-medium">Starred messages</p>
        </div>
        <div className="flex items-center gap-2">
          {starredCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {starredCount}
            </span>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </button>

      <Separator />

      {/* Mute notifications */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {isMuted ? (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Bell className="h-5 w-5 text-muted-foreground" />
          )}
          <p className="font-medium">Mute notifications</p>
        </div>
        <Switch checked={isMuted} onCheckedChange={handleMuteSwitch} />
      </div>

      <Separator />

      {/* Action buttons */}
      <div className="p-4 space-y-2">
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 ${isBlocked ? 'text-foreground hover:bg-accent' : 'text-destructive hover:bg-destructive/10'}`}
          onClick={handleBlockToggle}
        >
          <Ban className="h-5 w-5" />
          {isBlocked ? `Unblock ${contactName}` : `Block ${contactName}`}
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
          onClick={handleReport}
        >
          <Flag className="h-5 w-5" />
          Report {contactName}
        </Button>
      </div>

      {/* Mute Duration Modal */}
      <MuteNotificationsModal
        open={showMuteDialog}
        onOpenChange={setShowMuteDialog}
        onMute={handleMute}
      />
    </>
  );

  // Mobile: Full screen view with back button
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col animate-slide-in-right">
        {/* Header with back button */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-background sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Details</h2>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1">
          {panelContent}
        </ScrollArea>
      </div>
    );
  }

  // Desktop: Side panel
  return (
    <div className="w-96 border-l border-border bg-background h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {panelContent}
      </div>
    </div>
  );
}
