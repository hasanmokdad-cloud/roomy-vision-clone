import { useState, useEffect } from 'react';
import { X, Share, MoreVertical, Download, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PWAInstallBannerProps {
  className?: string;
}

// Detect iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Detect Android
const isAndroid = () => {
  return /Android/.test(navigator.userAgent);
};

// Check if running as installed PWA
const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

// Check if mobile device
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export function PWAInstallBanner({ className }: PWAInstallBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true);
  const [isInstalled, setIsInstalled] = useState(true);

  useEffect(() => {
    // Check if already installed as PWA
    const installed = isPWA();
    setIsInstalled(installed);

    // Check if dismissed within last 7 days
    const dismissedTime = localStorage.getItem('pwa_banner_dismissed');
    if (dismissedTime) {
      const dismissedDate = new Date(parseInt(dismissedTime));
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
        return;
      }
    }

    // Show banner if on mobile and not installed
    if (isMobileDevice() && !installed) {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
    setIsDismissed(true);
  };

  // Don't show if already installed or dismissed
  if (isInstalled || isDismissed) {
    return null;
  }

  const iosDevice = isIOS();
  const androidDevice = isAndroid();

  return (
    <div className={cn(
      "bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 rounded-xl p-4 relative",
      className
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex items-start gap-3 pr-8">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm">
            Install Roomy for notifications
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Get instant alerts for messages, tours, and reservations
          </p>

          {/* Platform-specific instructions */}
          <div className="mt-3 p-3 bg-background/60 rounded-lg border border-border/50">
            {iosDevice ? (
              <div className="flex items-start gap-2">
                <Share className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-foreground">iPhone/iPad:</p>
                  <p className="text-muted-foreground mt-0.5">
                    Tap <span className="font-medium text-foreground">Share</span> at the bottom, then <span className="font-medium text-foreground">"Add to Home Screen"</span>
                  </p>
                </div>
              </div>
            ) : androidDevice ? (
              <div className="flex items-start gap-2">
                <MoreVertical className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-foreground">Android:</p>
                  <p className="text-muted-foreground mt-0.5">
                    Tap <span className="font-medium text-foreground">Menu (⋮)</span> then <span className="font-medium text-foreground">"Install App"</span> or <span className="font-medium text-foreground">"Add to Home screen"</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-foreground">Desktop:</p>
                  <p className="text-muted-foreground mt-0.5">
                    Look for the install icon <span className="font-medium">(⊕)</span> in your browser's address bar
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground/70 mt-2">
            After installing, open Roomy from your home screen to enable notifications
          </p>
        </div>
      </div>
    </div>
  );
}
