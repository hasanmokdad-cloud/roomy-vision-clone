import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, Loader2, AlertTriangle, X, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExpirationPicker } from '@/components/payments/ExpirationPicker';
import { CardBrandIcons, detectCardBrand, validateCardNumber, formatCardNumber, getCvvLength } from '@/components/payments/CardBrandIcons';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Countries list
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

export default function MockWhishAddCard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const studentId = searchParams.get('studentId');
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: '',
    country: 'Lebanon',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expirationPickerOpen, setExpirationPickerOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  const detectedBrand = detectCardBrand(formData.cardNumber);
  const cvvLength = getCvvLength(detectedBrand);

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setFormData(prev => ({ ...prev, cardNumber: formatted }));
    setError(null);
  };

  const handleCvvChange = (value: string) => {
    const cvv = value.replace(/\D/g, '').slice(0, cvvLength);
    setFormData(prev => ({ ...prev, cvv }));
    setError(null);
  };

  const handleExpirationSelect = (month: string, year: string) => {
    setFormData(prev => ({ 
      ...prev, 
      expirationMonth: month, 
      expirationYear: year 
    }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!studentId) {
      setError('Missing student ID');
      return;
    }

    const rawNumber = formData.cardNumber.replace(/\s/g, '');
    
    // Validation
    if (!rawNumber || rawNumber.length < 13) {
      setError('Please enter a valid card number');
      return;
    }

    if (!validateCardNumber(formData.cardNumber)) {
      setError('Invalid card number');
      return;
    }

    if (!formData.expirationMonth || !formData.expirationYear) {
      setError('Please select expiration date');
      return;
    }

    if (formData.cvv.length !== cvvLength) {
      setError(`CVV must be ${cvvLength} digits`);
      return;
    }

    if (!formData.country) {
      setError('Please select a country');
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
      const mockToken = `whish_tok_${crypto.randomUUID()}`;
      const last4 = rawNumber.slice(-4);

      // Insert new payment method
      const { error: insertError } = await supabase
        .from('payment_methods')
        .insert({
          student_id: studentId,
          whish_token: mockToken,
          brand: detectedBrand || 'unknown',
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

  const isFormValid = 
    formData.cardNumber.replace(/\s/g, '').length >= 13 &&
    formData.expirationMonth &&
    formData.expirationYear &&
    formData.cvv.length === cvvLength &&
    formData.country;

  const expirationDisplay = formData.expirationMonth && formData.expirationYear
    ? `${formData.expirationMonth} / ${formData.expirationYear}`
    : '';

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
            className="absolute right-4 top-4 text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Card Details</CardTitle>
          <CardDescription className="text-purple-200">
            Sandbox Mode - For testing purposes only
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <AlertDescription className="text-sm text-amber-200">
              This is a simulated card addition flow for development.
            </AlertDescription>
          </Alert>

          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber" className="text-white">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                className="pr-12 text-lg tracking-wider font-mono h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40"
                maxLength={19}
              />
              {detectedBrand && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div 
                    className="h-6 w-10 rounded flex items-center justify-center text-xs font-bold bg-white/20"
                  >
                    <span className="text-white">{detectedBrand.toUpperCase().substring(0, 4)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card Brand Icons */}
          <div className="flex justify-center py-1">
            <CardBrandIcons detectedBrand={detectedBrand} size="sm" />
          </div>

          {/* Expiration & CVV Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Expiration Date */}
            <div className="space-y-2">
              <Label className="text-white">Expiration Date</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setExpirationPickerOpen(true)}
                className="w-full h-12 justify-between rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 font-mono"
              >
                {expirationDisplay || <span className="text-white/40">MM / YYYY</span>}
                <ChevronDown className="w-4 h-4 text-white/50" />
              </Button>
            </div>

            {/* CVV */}
            <div className="space-y-2">
              <Label htmlFor="cvv" className="text-white">CVV</Label>
              <Input
                id="cvv"
                type="password"
                placeholder={detectedBrand === 'amex' ? '••••' : '•••'}
                value={formData.cvv}
                onChange={(e) => handleCvvChange(e.target.value)}
                className="h-12 rounded-xl bg-white/10 border-white/20 text-white text-center tracking-widest font-mono placeholder:text-white/40"
                maxLength={cvvLength}
              />
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label className="text-white">Country</Label>
            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={countryOpen}
                  className="w-full h-12 justify-between rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {formData.country || "Select country..."}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-white/50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search country..." />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {COUNTRIES.map((country) => (
                        <CommandItem
                          key={country.code}
                          value={country.name}
                          onSelect={() => {
                            setFormData(prev => ({ ...prev, country: country.name }));
                            setCountryOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.country === country.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {country.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Mock Card Preview */}
          {formData.cardNumber.replace(/\s/g, '').length >= 4 && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white">
              <div className="flex justify-between items-start mb-6">
                <span className="text-xs opacity-80">WHISH</span>
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="text-lg tracking-widest font-mono mb-4">
                {formData.cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div className="flex justify-between text-xs">
                <span className="opacity-80">{expirationDisplay || 'MM/YY'}</span>
                <span className="opacity-80">{detectedBrand?.toUpperCase() || 'CARD'}</span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !isFormValid}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg rounded-xl"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding Card...
              </span>
            ) : (
              'Add Card'
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full rounded-xl border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>

      {/* Expiration Date Picker */}
      <ExpirationPicker
        isOpen={expirationPickerOpen}
        onClose={() => setExpirationPickerOpen(false)}
        onSelect={handleExpirationSelect}
        initialMonth={formData.expirationMonth}
        initialYear={formData.expirationYear}
      />
    </div>
  );
}
