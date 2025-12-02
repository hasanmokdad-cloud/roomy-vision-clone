import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PayoutSetupBannerProps {
  ownerId: string;
}

export function PayoutSetupBanner({ ownerId }: PayoutSetupBannerProps) {
  const { toast } = useToast();
  const [payoutStatus, setPayoutStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayoutStatus();
  }, [ownerId]);

  const loadPayoutStatus = async () => {
    const { data: owner } = await supabase
      .from('owners')
      .select('payout_status, whish_account_id')
      .eq('id', ownerId)
      .single();

    setPayoutStatus(owner?.payout_status || 'not_connected');
    setLoading(false);
  };

  const handleSetupPayouts = () => {
    // In production, this would redirect to Whish onboarding flow
    toast({
      title: 'Whish Setup',
      description: 'Whish integration is in preview mode. Real integration coming soon.',
    });
  };

  if (loading || payoutStatus === 'active') {
    return null; // Don't show banner if active or loading
  }

  const statusConfig = {
    not_connected: {
      icon: AlertCircle,
      color: 'bg-orange-500/10 border-orange-500/20',
      badgeColor: 'bg-orange-500',
      text: 'Not Connected',
    },
    pending_verification: {
      icon: Clock,
      color: 'bg-blue-500/10 border-blue-500/20',
      badgeColor: 'bg-blue-500',
      text: 'Pending Verification',
    },
    suspended: {
      icon: AlertCircle,
      color: 'bg-red-500/10 border-red-500/20',
      badgeColor: 'bg-red-500',
      text: 'Suspended',
    },
  };

  const config = statusConfig[payoutStatus as keyof typeof statusConfig] || statusConfig.not_connected;
  const Icon = config.icon;

  return (
    <Card className={`${config.color} border-2`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold">Set up your Whish account</h3>
                <Badge className={config.badgeColor}>
                  {config.text}
                </Badge>
              </div>
              <p className="text-foreground/60">
                Receive reservation payouts directly to your Whish wallet
              </p>
            </div>
          </div>
          <Button
            onClick={handleSetupPayouts}
            className="gap-2 bg-gradient-to-r from-primary to-secondary whitespace-nowrap"
          >
            Set up payouts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
