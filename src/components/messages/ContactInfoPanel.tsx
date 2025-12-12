import { useState } from "react";
import { X, ChevronRight, Image, FileText, Link as LinkIcon, Bell, BellOff, Star, UserPlus, UserMinus, Check, Ban, Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StarredMessagesPanel } from "./StarredMessagesPanel";
import { MediaLinksDocsPanel } from "./MediaLinksDocsPanel";
import { useFriendshipStatus } from "@/hooks/useFriendshipStatus";
import { useFriendships } from "@/hooks/useFriendships";
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
}: ContactInfoPanelProps) {
  const [showStarredMessages, setShowStarredMessages] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [mediaCount, setMediaCount] = useState(0);

  // Get friendship status if both are students
  const { status: friendshipStatus, friendshipId, refresh } = useFriendshipStatus(
    currentStudentId || null,
    otherStudentId || null
  );
  const { sendRequest, acceptRequest, removeFriend, blockUser } = useFriendships(currentStudentId || null);

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

  const handleBlock = async () => {
    if (!friendshipId || !otherStudentId) {
      toast.error("Cannot block user - user information not available");
      return;
    }
    await blockUser(friendshipId, otherStudentId);
    onClose();
  };

  const handleReport = async () => {
    try {
      toast.success(`${contactName} has been reported`);
    } catch (error) {
      toast.error("Failed to report user");
    }
  };


  if (showStarredMessages) {
    return (
      <StarredMessagesPanel
        conversationId={conversationId}
        onBack={() => setShowStarredMessages(false)}
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

  return (
    <div className="w-96 border-l border-border bg-background h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Contact info</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
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
              {friendshipStatus === 'none' && (
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
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
          <Switch checked={isMuted} onCheckedChange={onMuteToggle} />
        </div>

        <Separator />

        {/* Action buttons */}
        <div className="p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
            onClick={handleBlock}
          >
            <Ban className="h-5 w-5" />
            Block {contactName}
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
      </div>
    </div>
  );
}
