import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pin, Archive, BellOff, Trash2, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ConversationContextMenuProps = {
  conversationId: string;
  isPinned: boolean;
  isArchived: boolean;
  mutedUntil: string | null;
  onUpdate: () => void;
};

export function ConversationContextMenu({
  conversationId,
  isPinned,
  isArchived,
  mutedUntil,
  onUpdate,
}: ConversationContextMenuProps) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMuteDialog, setShowMuteDialog] = useState(false);

  const handlePin = async () => {
    const { error } = await supabase
      .from('conversations')
      .update({ is_pinned: !isPinned })
      .eq('id', conversationId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to pin chat', variant: 'destructive' });
    } else {
      toast({ title: isPinned ? 'Chat unpinned' : 'Chat pinned' });
      onUpdate();
    }
  };

  const handleArchive = async () => {
    const { error } = await supabase
      .from('conversations')
      .update({ is_archived: !isArchived })
      .eq('id', conversationId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to archive chat', variant: 'destructive' });
    } else {
      toast({ title: isArchived ? 'Chat unarchived' : 'Chat archived' });
      onUpdate();
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
      toast({ title: 'Error', description: 'Failed to mute chat', variant: 'destructive' });
    } else {
      toast({ title: 'Notifications muted' });
      onUpdate();
      setShowMuteDialog(false);
    }
  };

  const handleUnmute = async () => {
    const { error } = await supabase
      .from('conversations')
      .update({ muted_until: null })
      .eq('id', conversationId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to unmute chat', variant: 'destructive' });
    } else {
      toast({ title: 'Notifications unmuted' });
      onUpdate();
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete chat', variant: 'destructive' });
    } else {
      toast({ title: 'Chat deleted' });
      onUpdate();
      setShowDeleteDialog(false);
    }
  };

  const isMuted = mutedUntil && new Date(mutedUntil) > new Date();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            type="button"
            className="h-8 w-8 rounded-md flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-accent/50 transition-colors" 
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handlePin}>
            <Pin className="w-4 h-4 mr-2" />
            {isPinned ? 'Unpin chat' : 'Pin chat'}
          </DropdownMenuItem>
          
          {isMuted ? (
            <DropdownMenuItem onClick={handleUnmute}>
              <BellOff className="w-4 h-4 mr-2" />
              Unmute notifications
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setShowMuteDialog(true)}>
              <BellOff className="w-4 h-4 mr-2" />
              Mute notifications
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="w-4 h-4 mr-2" />
            {isArchived ? 'Unarchive chat' : 'Archive chat'}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showMuteDialog} onOpenChange={setShowMuteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mute message notifications</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Other members will not see that you muted this chat. You will still be notified if you are mentioned.
            </p>
          </DialogHeader>
          <div className="space-y-2 pt-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleMute('8hours')}
            >
              8 hours
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleMute('1week')}
            >
              1 week
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleMute('always')}
            >
              Always
            </Button>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowMuteDialog(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All messages in this conversation will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
