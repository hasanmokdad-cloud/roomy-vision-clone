import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PayoutSetupBannerProps {
  ownerId: string;
}

export function PayoutSetupBanner({ ownerId }: PayoutSetupBannerProps) {
  const navigate = useNavigate();
  const [payoutStatus, setPayoutStatus] = useState<string | null>(null);
  const [hasPayoutCard, setHasPayoutCard] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayoutStatus();
  }, [ownerId]);

  const loadPayoutStatus = async () => {
    // Check for actual payout card in owner_payment_methods
    const { data: cards } = await supabase
      .from('owner_payment_methods')
      .select('id')
      .eq('owner_id', ownerId)
      .eq('is_default', true)
      .limit(1);

    if (cards && cards.length > 0) {
      // Has a card - consider "active"
      setHasPayoutCard(true);
      setPayoutStatus('active');
    } else {
      // No card - check owner's payout_status field
      const { data: owner } = await supabase
        .from('owners')
        .select('payout_status')
        .eq('id', ownerId)
        .single();

      setHasPayoutCard(false);
      setPayoutStatus(owner?.payout_status || 'not_connected');
    }
    setLoading(false);
  };

  const handleSetupPayouts = () => {
    if (!hasPayoutCard) {
      // No card - go directly to add card flow
      navigate(`/mock-whish-owner-add-card?ownerId=${ownerId}`);
    } else {
      // Has card - go to wallet
      navigate('/owner/wallet');
    }
  };

  // Hide banner if loading or if owner has active payout setup
  if (loading || payoutStatus === 'active') {
    return null;
  }

  const statusConfig = {
    not_connected: {
      icon: AlertCircle,
      color: 'bg-orange-500/10 border-orange-500/20',
      badgeClass: 'bg-gradient-to-r from-orange-400 to-orange-500 text-white',
      text: 'Not Connected',
    },
    pending_verification: {
      icon: Clock,
      color: 'bg-blue-500/10 border-blue-500/20',
      badgeClass: 'bg-gradient-to-r from-blue-400 to-blue-500 text-white',
      text: 'Pending Verification',
    },
    suspended: {
      icon: AlertCircle,
      color: 'bg-red-500/10 border-red-500/20',
      badgeClass: 'bg-gradient-to-r from-red-400 to-red-500 text-white',
      text: 'Suspended',
    },
  };

  const config = statusConfig[payoutStatus as keyof typeof statusConfig] || statusConfig.not_connected;
  const Icon = config.icon;

  return (
    <Card className={`${config.color} border-2 col-span-full rounded-2xl shadow-md`}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6D5BFF] to-[#9A6AFF] flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-700">Set up your Whish account</h3>
                <span className={`${config.badgeClass} rounded-full px-3 py-1 text-xs font-medium`}>
                  {config.text}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Receive reservation payouts directly to your Whish wallet
              </p>
            </div>
          </div>
          <Button
            onClick={handleSetupPayouts}
            className="w-full md:w-auto gap-2 bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] text-white rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Set up payouts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
