import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Loader2, ChevronDown, Check } from 'lucide-react';
import { ExpirationPicker } from './ExpirationPicker';
import { CardBrandIcons, detectCardBrand, validateCardNumber, formatCardNumber, getCvvLength } from './CardBrandIcons';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AddWhishCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Popular countries list
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

export function AddWhishCardModal({ open, onOpenChange, onSuccess }: AddWhishCardModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [expirationPickerOpen, setExpirationPickerOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: '',
    country: 'Lebanon',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const detectedBrand = detectCardBrand(formData.cardNumber);
  const cvvLength = getCvvLength(detectedBrand);

  useEffect(() => {
    if (open) {
      loadStudentId();
      // Reset form on open
      setFormData({
        cardNumber: '',
        expirationMonth: '',
        expirationYear: '',
        cvv: '',
        country: 'Lebanon',
      });
      setErrors({});
    }
  }, [open]);

  const loadStudentId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (student) {
      setStudentId(student.id);
    }
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setFormData(prev => ({ ...prev, cardNumber: formatted }));
    
    // Clear error on change
    if (errors.cardNumber) {
      setErrors(prev => ({ ...prev, cardNumber: '' }));
    }
  };

  const handleCvvChange = (value: string) => {
    const cvv = value.replace(/\D/g, '').slice(0, cvvLength);
    setFormData(prev => ({ ...prev, cvv }));
    
    if (errors.cvv) {
      setErrors(prev => ({ ...prev, cvv: '' }));
    }
  };

  const handleExpirationSelect = (month: string, year: string) => {
    setFormData(prev => ({ 
      ...prev, 
      expirationMonth: month, 
      expirationYear: year 
    }));
    
    if (errors.expiration) {
      setErrors(prev => ({ ...prev, expiration: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Card number validation
    const rawNumber = formData.cardNumber.replace(/\s/g, '');
    if (!rawNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!validateCardNumber(formData.cardNumber)) {
      newErrors.cardNumber = 'Invalid card number';
    }
    
    // Expiration validation
    if (!formData.expirationMonth || !formData.expirationYear) {
      newErrors.expiration = 'Expiration date is required';
    }
    
    // CVV validation
    if (!formData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (formData.cvv.length !== cvvLength) {
      newErrors.cvv = `CVV must be ${cvvLength} digits`;
    }
    
    // Country validation
    if (!formData.country) {
      newErrors.country = 'Country is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !studentId) return;
    
    setLoading(true);

    try {
      // Check if this is the first card
      const { data: existingCards } = await supabase
        .from('payment_methods')
        .select('id')
        .eq('student_id', studentId);

      const isFirstCard = !existingCards || existingCards.length === 0;
      
      // Generate mock token (in production, this would come from Whish API)
      const mockToken = `whish_tok_${crypto.randomUUID()}`;
      const last4 = formData.cardNumber.replace(/\s/g, '').slice(-4);

      const { error } = await supabase
        .from('payment_methods')
        .insert({
          student_id: studentId,
          whish_token: mockToken,
          brand: detectedBrand || 'unknown',
          last4: last4,
          is_default: isFirstCard,
        });

      if (error) throw error;

      toast({
        title: 'Card added successfully',
        description: `Your ${detectedBrand?.toUpperCase() || ''} card ending in ${last4} has been saved.`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add card',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="w-6 h-6 text-primary" />
              Card Details
            </DialogTitle>
            <DialogDescription>
              Enter your card information securely
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  className={cn(
                    "pr-12 text-lg tracking-wider font-mono h-12 rounded-xl bg-muted/50",
                    errors.cardNumber && "border-destructive focus-visible:ring-destructive"
                  )}
                  maxLength={19}
                />
                {detectedBrand && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div 
                      className="h-6 w-10 rounded flex items-center justify-center text-xs font-bold"
                      style={{ 
                        backgroundColor: detectedBrand === 'visa' ? '#1A1F7120' : 
                                        detectedBrand === 'mastercard' ? '#EB001B20' :
                                        detectedBrand === 'amex' ? '#006FCF20' : '#00000010',
                      }}
                    >
                      {detectedBrand.toUpperCase().substring(0, 4)}
                    </div>
                  </div>
                )}
              </div>
              {errors.cardNumber && (
                <p className="text-sm text-destructive">{errors.cardNumber}</p>
              )}
            </div>

            {/* Card Brand Icons */}
            <div className="flex justify-center">
              <CardBrandIcons detectedBrand={detectedBrand} size="sm" />
            </div>

            {/* Expiration & CVV Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Expiration Date */}
              <div className="space-y-2">
                <Label>Expiration Date</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExpirationPickerOpen(true)}
                  className={cn(
                    "w-full h-12 justify-between rounded-xl bg-muted/50 font-mono",
                    errors.expiration && "border-destructive"
                  )}
                >
                  {expirationDisplay || <span className="text-muted-foreground">MM / YYYY</span>}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
                {errors.expiration && (
                  <p className="text-sm text-destructive">{errors.expiration}</p>
                )}
              </div>

              {/* CVV */}
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="password"
                  placeholder={detectedBrand === 'amex' ? '••••' : '•••'}
                  value={formData.cvv}
                  onChange={(e) => handleCvvChange(e.target.value)}
                  className={cn(
                    "h-12 rounded-xl bg-muted/50 text-center tracking-widest font-mono",
                    errors.cvv && "border-destructive focus-visible:ring-destructive"
                  )}
                  maxLength={cvvLength}
                />
                {errors.cvv && (
                  <p className="text-sm text-destructive">{errors.cvv}</p>
                )}
              </div>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label>Country</Label>
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryOpen}
                    className={cn(
                      "w-full h-12 justify-between rounded-xl bg-muted/50",
                      errors.country && "border-destructive"
                    )}
                  >
                    {formData.country || "Select country..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                              if (errors.country) {
                                setErrors(prev => ({ ...prev, country: '' }));
                              }
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
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 text-lg bg-gradient-to-r from-primary to-purple-600 rounded-xl"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Adding Card...
                </>
              ) : (
                'Add Card'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expiration Date Picker */}
      <ExpirationPicker
        isOpen={expirationPickerOpen}
        onClose={() => setExpirationPickerOpen(false)}
        onSelect={handleExpirationSelect}
        initialMonth={formData.expirationMonth}
        initialYear={formData.expirationYear}
      />
    </>
  );
}
