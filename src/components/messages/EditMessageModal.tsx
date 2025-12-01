import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';

interface EditMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: {
    id: string;
    body: string | null;
    created_at: string;
  };
  onSave: (editedText: string) => Promise<void>;
}

export function EditMessageModal({ open, onOpenChange, message, onSave }: EditMessageModalProps) {
  const isMobile = useIsMobile();
  const [editedText, setEditedText] = useState(message.body || '');
  const [saving, setSaving] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    setEditedText(message.body || '');
  }, [message.body]);

  useEffect(() => {
    if (!open) return;

    const calculateTimeRemaining = () => {
      const createdAt = new Date(message.created_at);
      const now = new Date();
      const fifteenMinutes = 15 * 60 * 1000;
      const elapsed = now.getTime() - createdAt.getTime();
      const remaining = fifteenMinutes - elapsed;

      if (remaining <= 0) {
        setTimeRemaining('Edit time expired');
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [open, message.created_at]);

  const handleSave = async () => {
    if (!editedText.trim()) return;
    
    setSaving(true);
    try {
      await onSave(editedText.trim());
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedText(message.body || '');
    onOpenChange(false);
  };

  const content = (
    <>
      {/* Original message preview */}
      <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary mb-4">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
          {message.body}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Sent at {format(new Date(message.created_at), 'HH:mm')}
        </p>
      </div>

      {/* Edit input */}
      <Textarea
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        placeholder="Edit your message..."
        className="min-h-[120px] resize-none"
        autoFocus
      />

      {/* Time remaining indicator */}
      {timeRemaining && (
        <p className="text-xs text-muted-foreground mt-2">
          ⏱ You can edit for {timeRemaining} more
        </p>
      )}
    </>
  );

  const actions = (
    <>
      <Button variant="ghost" onClick={handleCancel} disabled={saving}>
        Cancel
      </Button>
      <Button onClick={handleSave} disabled={!editedText.trim() || saving}>
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>Edit message</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {content}
          </div>
          <SheetFooter className="mt-6">
            {actions}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {content}
        </div>
        <DialogFooter>
          {actions}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
