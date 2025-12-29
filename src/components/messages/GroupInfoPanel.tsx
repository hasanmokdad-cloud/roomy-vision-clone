import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Camera, 
  MoreVertical, 
  UserPlus, 
  LogOut, 
  Trash2, 
  Shield, 
  ShieldOff,
  Pencil,
  Check,
  X,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GroupMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  name?: string;
  avatar?: string | null;
}

interface GroupInfoPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  groupName: string;
  groupPhoto?: string | null;
  userId: string | null;
  onAddMembers: () => void;
  onUpdate: () => void;
}

export function GroupInfoPanel({
  open,
  onOpenChange,
  conversationId,
  groupName: initialGroupName,
  groupPhoto: initialGroupPhoto,
  userId,
  onAddMembers,
  onUpdate,
}: GroupInfoPanelProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(initialGroupName);
  const [groupPhoto, setGroupPhoto] = useState(initialGroupPhoto);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);

  useEffect(() => {
    if (open && conversationId) {
      loadMembers();
    }
  }, [open, conversationId]);

  useEffect(() => {
    setGroupName(initialGroupName);
    setGroupPhoto(initialGroupPhoto);
  }, [initialGroupName, initialGroupPhoto]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data: memberData } = await supabase
        .from('group_members')
        .select('*')
        .eq('conversation_id', conversationId);

      if (!memberData) {
        setLoading(false);
        return;
      }

      // Enrich with user details
      const enrichedMembers: GroupMember[] = [];
      for (const member of memberData) {
        let name = 'Unknown';
        let avatar = null;

        // Check students
        const { data: student } = await supabase
          .from('students')
          .select('full_name, profile_photo_url')
          .eq('user_id', member.user_id)
          .single();

        if (student) {
          name = student.full_name;
          avatar = student.profile_photo_url;
        } else {
          // Check owners
          const { data: owner } = await supabase
            .from('owners')
            .select('full_name, profile_photo_url')
            .eq('user_id', member.user_id)
            .single();

          if (owner) {
            name = owner.full_name;
            avatar = owner.profile_photo_url;
          }
        }

        enrichedMembers.push({
          ...member,
          role: member.role as 'admin' | 'member',
          name,
          avatar,
        });

        // Check if current user is admin
        if (member.user_id === userId && member.role === 'admin') {
          setIsAdmin(true);
        }
      }

      // Sort: admins first, then alphabetically
      enrichedMembers.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        return (a.name || '').localeCompare(b.name || '');
      });

      setMembers(enrichedMembers);
    } catch (error) {
      console.error('Error loading members:', error);
    }
    setLoading(false);
  };

  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ group_name: groupName.trim() })
        .eq('id', conversationId);

      if (error) throw error;

      toast({ title: 'Group name updated' });
      setIsEditingName(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating group name:', error);
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `group-${conversationId}-${Date.now()}.${fileExt}`;
      const filePath = `group-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      const { error } = await supabase
        .from('conversations')
        .update({ group_photo_url: data.publicUrl })
        .eq('id', conversationId);

      if (error) throw error;

      setGroupPhoto(data.publicUrl);
      toast({ title: 'Photo updated' });
      onUpdate();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({ title: 'Failed to upload photo', variant: 'destructive' });
    }
  };

  const handleMakeAdmin = async (member: GroupMember) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('id', member.id);

      if (error) throw error;

      toast({ title: `${member.name} is now an admin` });
      loadMembers();
    } catch (error) {
      console.error('Error making admin:', error);
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleRemoveAdmin = async (member: GroupMember) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'member' })
        .eq('id', member.id);

      if (error) throw error;

      toast({ title: `${member.name} is no longer an admin` });
      loadMembers();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberToRemove.id);

      if (error) throw error;

      toast({ title: `${memberToRemove.name} removed from group` });
      setMemberToRemove(null);
      loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({ title: 'Failed to remove', variant: 'destructive' });
    }
  };

  const handleLeaveGroup = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({ title: 'You left the group' });
      setShowLeaveDialog(false);
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({ title: 'Failed to leave group', variant: 'destructive' });
    }
  };

  const handleDeleteGroup = async () => {
    try {
      // Delete all members first
      await supabase
        .from('group_members')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete all messages
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete the conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      toast({ title: 'Group deleted' });
      setShowDeleteDialog(false);
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({ title: 'Failed to delete group', variant: 'destructive' });
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>Group Info</SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-60px)]">
            {/* Group header */}
            <div className="flex flex-col items-center gap-4 p-6 border-b">
              <label className="relative cursor-pointer group">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={groupPhoto || undefined} />
                  <AvatarFallback className="bg-primary/10 text-2xl">
                    <Users className="w-10 h-10 text-primary" />
                  </AvatarFallback>
                </Avatar>
                {isAdmin && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
                {isAdmin && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                )}
              </label>

              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="text-center"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleUpdateGroupName}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{groupName}</h2>
                  {isAdmin && (
                    <Button size="icon" variant="ghost" onClick={() => setIsEditingName(true)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </p>
            </div>

            {/* Members list */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Members</h3>
                {isAdmin && (
                  <Button size="sm" variant="outline" onClick={onAddMembers}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {members.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {member.user_id === userId ? 'You' : member.name}
                          </span>
                          {member.role === 'admin' && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                      {isAdmin && member.user_id !== userId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.role === 'member' ? (
                              <DropdownMenuItem onClick={() => handleMakeAdmin(member)}>
                                <Shield className="w-4 h-4 mr-2" />
                                Make admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleRemoveAdmin(member)}>
                                <ShieldOff className="w-4 h-4 mr-2" />
                                Remove admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setMemberToRemove(member)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove from group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setShowLeaveDialog(true)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave group
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete group
                </Button>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Leave group confirmation */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave group?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer receive messages from this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroup}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete group confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the group and all messages. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove member confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {memberToRemove?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will no longer be able to send or receive messages in this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
