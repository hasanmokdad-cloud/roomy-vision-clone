import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function MockWhishOwnerAddCard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const ownerId = searchParams.get('ownerId');
  const isReplace = searchParams.get('replace') === 'true';
  
  const [last4, setLast4] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAddCard = async () => {
    if (!ownerId) {
      toast({
        title: 'Error',
        description: 'Owner ID is required.',
        variant: 'destructive',
      });
      return;
    }

    if (last4.length !== 4 || !/^\d{4}$/.test(last4)) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter exactly 4 digits.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    try {
      // If replacing, delete existing cards first
      if (isReplace) {
        await supabase
          .from('owner_payment_methods')
          .delete()
          .eq('owner_id', ownerId);
      }

      // Generate a mock Whish token
      const mockToken = `mock_owner_whish_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Insert the new card
      const { error } = await supabase
        .from('owner_payment_methods')
        .insert({
          owner_id: ownerId,
          whish_token: mockToken,
          brand: 'Whish',
          last4: last4,
          is_default: true,
        });

      if (error) throw error;

      setSuccess(true);

      // Redirect after short delay
      setTimeout(() => {
        navigate('/owner/wallet?status=payout_card_added');
      }, 1500);
    } catch (error) {
      console.error('Error adding card:', error);
      toast({
        title: 'Error',
        description: 'Failed to add card. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/owner/wallet');
  };

  if (!ownerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Invalid Request</h2>
            <p className="text-muted-foreground mb-4">
              Missing owner ID. Please try again from the wallet page.
            </p>
            <Button onClick={() => navigate('/owner/wallet')}>
              Return to Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardContent className="pt-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              >
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-xl font-semibold mb-2">Card Added Successfully!</h2>
              <p className="text-muted-foreground">
                Redirecting to your wallet...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>
              {isReplace ? 'Replace' : 'Add'} Whish Payout Card
            </CardTitle>
            <CardDescription>
              {isReplace
                ? 'Enter new card details to replace your existing payout card'
                : 'Add a card to receive deposits from student reservations'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                <strong>Sandbox Mode:</strong> This is a simulated card addition. 
                In production, you would be redirected to Whish's secure page.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="last4">Card Last 4 Digits</Label>
              <Input
                id="last4"
                type="text"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                placeholder="1234"
                value={last4}
                onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter any 4 digits for this mock flow
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleAddCard}
                disabled={processing || last4.length !== 4}
                className="w-full"
              >
                {processing ? 'Processing...' : 'Simulate Add Card (Success)'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={processing}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
