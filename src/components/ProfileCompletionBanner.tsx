import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ProfileCompletionBannerProps {
  completionPercentage: number;
  onDismiss?: () => void;
}

export function ProfileCompletionBanner({ completionPercentage, onDismiss }: ProfileCompletionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('profile_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('profile_banner_dismissed', 'true');
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed || completionPercentage === 100) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-50 bg-gradient-to-r from-primary/90 to-secondary/90 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm mb-1">
                Complete your profile to unlock AI Match and contact owners
              </p>
              <div className="flex items-center gap-3">
                <Progress value={completionPercentage} className="h-2 flex-1 max-w-xs" />
                <span className="text-white/90 text-xs font-medium">
                  {completionPercentage}% complete
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/profile">
              <Button size="sm" variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30">
                Complete Profile
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
