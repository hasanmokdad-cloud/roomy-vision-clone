import { useState } from 'react';
import { Share2, Check, MessageCircle, Facebook, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  dormId: string;
  dormName: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "ghost" | "outline";
  className?: string;
}

export function ShareButton({ 
  dormId, 
  dormName, 
  size = "default", 
  variant = "ghost",
  className 
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = `${window.location.origin}/dorm/${dormId}`;
  const shareText = `Check out ${dormName} on Roomy - Student Housing Platform`;
  
  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: dormName,
          text: shareText,
          url: shareUrl,
        });
        setOpen(false);
      } catch (err) {
        // User cancelled or error
      }
    }
  };
  
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
    setOpen(false);
  };
  
  const handleFacebook = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    setOpen(false);
  };
  
  const handleTwitter = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    setOpen(false);
  };
  
  const handleLinkedIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    setOpen(false);
  };
  
  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The dorm link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
      setOpen(false);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("share-button", className)}
          aria-label="Share dorm"
          onClick={(e) => e.stopPropagation()}
        >
          <Share2 className="w-5 h-5" />
          {size === "lg" && <span className="ml-2">Share</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-2 glass-hover pointer-events-auto" 
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share via...</span>
            </button>
          )}
          
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">WhatsApp</span>
          </button>
          
          <button
            onClick={handleFacebook}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
          >
            <Facebook className="w-4 h-4" />
            <span className="text-sm">Facebook</span>
          </button>
          
          <button
            onClick={handleTwitter}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="text-sm">X (Twitter)</span>
          </button>
          
          <button
            onClick={handleLinkedIn}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
          >
            <Linkedin className="w-4 h-4" />
            <span className="text-sm">LinkedIn</span>
          </button>
          
          <div className="border-t border-border my-1" />
          
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
          >
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span className="text-sm">{copied ? "Copied!" : "Copy Link"}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
