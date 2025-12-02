import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, Loader2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function MockWhishAddCard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const studentId = searchParams.get('studentId');
  
  const [last4, setLast4] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!studentId) {
      setError('Missing student ID');
      return;
    }

    if (!/^\d{4}$/.test(last4)) {
      setError('Please enter exactly 4 digits');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Check if this is the student's first card
      const { data: existingCards } = await supabase
        .from('payment_methods')
        .select('id')
        .eq('student_id', studentId);

      const isFirstCard = !existingCards || existingCards.length === 0;

      // Generate mock token
      const mockToken = `mock_token_${crypto.randomUUID()}`;

      // Insert new payment method
      const { error: insertError } = await supabase
        .from('payment_methods')
        .insert({
          student_id: studentId,
          whish_token: mockToken,
          brand: 'Whish',
          last4: last4,
          is_default: isFirstCard,
        });

      if (insertError) throw insertError;

      // Redirect back to wallet with success status
      navigate('/wallet?status=card_added');
    } catch (err) {
      console.error('Error adding card:', err);
      setError('Failed to add card. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/wallet');
  };

  if (!studentId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Invalid Request</CardTitle>
            <CardDescription>Missing required parameters</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/wallet')} className="w-full">
              Return to Wallet
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4"
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <Card className="w-full max-w-md border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="absolute right-4 top-4"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Add Whish Card</CardTitle>
          <CardDescription>
            Sandbox Mode - For testing purposes only
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <AlertDescription className="text-sm text-amber-200">
              This is a simulated card addition flow for development.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="last4">Card Last 4 Digits</Label>
            <Input
              id="last4"
              placeholder="1234"
              maxLength={4}
              value={last4}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setLast4(value);
                setError(null);
              }}
              className="text-center text-2xl tracking-[0.5em] font-mono"
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter any 4 digits for testing
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Mock Card Preview */}
          {last4.length === 4 && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white">
              <div className="flex justify-between items-start mb-8">
                <span className="text-xs opacity-80">WHISH</span>
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="text-lg tracking-widest font-mono mb-4">
                •••• •••• •••• {last4}
              </div>
              <div className="text-xs opacity-80">SANDBOX CARD</div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || last4.length !== 4}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding Card...
              </span>
            ) : (
              'Simulate Add Card (Success)'
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
