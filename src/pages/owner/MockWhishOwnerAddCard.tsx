import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, ArrowLeft, AlertTriangle, CheckCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  detectCardBrand, 
  validateCardNumber, 
  formatCardNumber, 
  getCvvLength,
  CardBrandIcon 
} from '@/components/payments/CardBrandIcons';
import { ExpirationPicker } from '@/components/payments/ExpirationPicker';

const COUNTRIES = [
  { code: 'LB', name: 'Lebanon' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'JO', name: 'Jordan' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'QA', name: 'Qatar' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
];

export default function MockWhishOwnerAddCard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const ownerId = searchParams.get('ownerId');
  const isReplace = searchParams.get('replace') === 'true';
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    cvv: '',
    country: 'LB',
  });
  const [expMonth, setExpMonth] = useState<string>('');
  const [expYear, setExpYear] = useState<string>('');
  const [showExpirationPicker, setShowExpirationPicker] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const detectedBrand = useMemo(() => detectCardBrand(formData.cardNumber), [formData.cardNumber]);
  const isCardValid = useMemo(() => validateCardNumber(formData.cardNumber), [formData.cardNumber]);
  const cvvLength = useMemo(() => getCvvLength(detectedBrand), [detectedBrand]);

  const formattedExpiration = useMemo(() => {
    if (expMonth && expYear) {
      return `${expMonth}/${expYear}`;
    }
    return '';
  }, [expMonth, expYear]);

  const isFormValid = useMemo(() => {
    return (
      isCardValid &&
      formData.cvv.length === cvvLength &&
      expMonth !== '' &&
      expYear !== '' &&
      formData.country !== ''
    );
  }, [isCardValid, formData.cvv.length, cvvLength, expMonth, expYear, formData.country]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData(prev => ({ ...prev, cardNumber: formatted }));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, cvvLength);
    setFormData(prev => ({ ...prev, cvv: value }));
  };

  const handleExpirationSelect = (month: string, year: string) => {
    setExpMonth(month);
    setExpYear(year);
    setShowExpirationPicker(false);
  };

  const handleAddCard = async () => {
    if (!ownerId) {
      toast({
        title: 'Error',
        description: 'Owner ID is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!isFormValid) {
      toast({
        title: 'Invalid Card Details',
        description: 'Please check all card fields.',
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
      const last4 = formData.cardNumber.replace(/\s/g, '').slice(-4);
      const countryName = COUNTRIES.find(c => c.code === formData.country)?.name || formData.country;

      // Insert the new card with full details
      const { error } = await supabase
        .from('owner_payment_methods')
        .insert({
          owner_id: ownerId,
          whish_token: mockToken,
          brand: detectedBrand || 'Visa',
          last4: last4,
          exp_month: parseInt(expMonth),
          exp_year: parseInt(expYear),
          country: countryName,
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
              {isReplace ? 'Replace' : 'Add'} Payout Whish Card
            </CardTitle>
            <CardDescription>
              Your payouts will be transferred to this card automatically
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

            {/* Mock Card Preview */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <CardBrandIcon brand={detectedBrand} size="lg" />
                  <span className="text-white/60 text-sm">PAYOUT CARD</span>
                </div>
                <p className="text-lg tracking-widest mb-4 font-mono">
                  {formData.cardNumber || '•••• •••• •••• ••••'}
                </p>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-white/60 text-xs">EXPIRES</p>
                    <p>{formattedExpiration || '••/••••'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs">CVV</p>
                    <p>{'•'.repeat(formData.cvv.length) || '•••'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                  className={`pr-12 ${isCardValid ? 'border-green-500' : ''}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CardBrandIcon brand={detectedBrand} size="sm" />
                </div>
              </div>
              {formData.cardNumber.length > 0 && !isCardValid && (
                <p className="text-xs text-destructive">Invalid card number</p>
              )}
            </div>

            {/* Expiration & CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiration Date</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowExpirationPicker(true)}
                  className="w-full justify-start font-normal"
                >
                  {formattedExpiration || 'MM/YYYY'}
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="password"
                  inputMode="numeric"
                  placeholder={detectedBrand === 'amex' ? '••••' : '•••'}
                  value={formData.cvv}
                  onChange={handleCvvChange}
                  maxLength={cvvLength}
                />
              </div>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">
                <Globe className="h-4 w-4 inline mr-1" />
                Country
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleAddCard}
                disabled={processing || !isFormValid}
                className="w-full"
              >
                {processing ? 'Processing...' : 'Add Payout Card'}
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

      {/* Expiration Picker */}
      <ExpirationPicker
        isOpen={showExpirationPicker}
        onClose={() => setShowExpirationPicker(false)}
        onSelect={handleExpirationSelect}
        initialMonth={expMonth || undefined}
        initialYear={expYear || undefined}
      />
    </div>
  );
}
