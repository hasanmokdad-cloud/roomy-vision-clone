import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Loader2 } from 'lucide-react';

interface AddWhishCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddWhishCardModal({ open, onOpenChange, onSuccess }: AddWhishCardModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (open) {
      loadExistingProfile();
    }
  }, [open]);

  const loadExistingProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_payment_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setExistingProfile(data);
      setFormData({
        fullName: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
      });
    } else {
      // Pre-fill with auth email
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate phone format (basic validation)
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        throw new Error('Please enter a valid phone number (e.g., +9611234567)');
      }

      const profileData = {
        user_id: user.id,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      };

      if (existingProfile) {
        // Update existing
        const { error } = await supabase
          .from('user_payment_profiles')
          .update(profileData)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: 'Payment info updated',
          description: 'Your payment information has been updated successfully.',
        });
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_payment_profiles')
          .insert(profileData);

        if (error) throw error;

        toast({
          title: 'Payment info saved',
          description: 'Your payment information has been saved successfully.',
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {existingProfile ? 'Update Payment Info' : 'Add Payment Info'}
          </DialogTitle>
          <DialogDescription>
            Enter your payment information for Whish payment processing.
            This information is required to reserve rooms or purchase AI Match plans.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+961 1234567"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
            <p className="text-xs text-muted-foreground">
              Include country code (e.g., +961 for Lebanon)
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                existingProfile ? 'Update Info' : 'Save Info'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
