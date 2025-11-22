import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Check, Copy, Facebook, MessageCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  collection: any;
  onUpdateCollection: (updates: any) => Promise<void>;
}

export function ShareCollectionDialog({
  open,
  onOpenChange,
  shareUrl,
  collection,
  onUpdateCollection,
}: ShareCollectionDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState(collection?.title || 'My Saved Rooms');
  const [description, setDescription] = useState(collection?.description || '');
  const [isPublic, setIsPublic] = useState(collection?.is_public ?? true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (collection) {
      setTitle(collection.title || 'My Saved Rooms');
      setDescription(collection.description || '');
      setIsPublic(collection.is_public ?? true);
    }
  }, [collection]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: 'Link copied!',
      description: 'Share link copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      await onUpdateCollection({
        title,
        description,
        is_public: isPublic,
      });
      toast({
        title: 'Collection updated',
        description: 'Your changes have been saved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update collection',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleShareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Check out my room collection: ${shareUrl}`)}`,
      '_blank'
    );
  };
  
  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass border-white/20">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">Share Your Collection</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Share Link */}
          <div className="space-y-2">
            <Label className="text-foreground">Shareable Link</Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="bg-background/50 border-white/20 text-foreground"
              />
              <Button onClick={handleCopyLink} size="icon" variant="outline">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleShareWhatsApp} variant="outline" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button onClick={handleShareFacebook} variant="outline" className="flex-1">
              <Facebook className="w-4 h-4 mr-2" />
              Facebook
            </Button>
          </div>

          {/* Collection Settings */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label className="text-foreground">Collection Title (Optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Top Picks for Fall 2025"
                maxLength={100}
                className="bg-background/50 border-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Description (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a note about your room selection..."
                maxLength={500}
                rows={3}
                className="bg-background/50 border-white/20"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-foreground">Public Collection</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone with the link can view
                </p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          </div>

          {/* Stats */}
          {collection && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{collection.view_count} views</span>
              </div>
              <span>•</span>
              <span>Created {new Date(collection.created_at).toLocaleDateString()}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleSaveChanges} 
              className="flex-1"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
